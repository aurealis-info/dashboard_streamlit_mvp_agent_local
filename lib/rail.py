"""Assistant rail — a context-aware AI panel docked to the right of every page.

Architecture: generation runs in a BACKGROUND THREAD and the rail is a
Streamlit fragment that polls the job every couple of seconds. This is what
keeps the dashboard fully interactive while the model thinks — Streamlit
normally cancels the running script on any click, which would both freeze
the UI and kill the answer mid-generation.

The worker thread never touches Streamlit APIs: cached inputs (schema, the
model handle) are resolved in the main thread before spawning, and the
thread only mutates a plain dict that the fragment reads.
"""

import threading

import pandas as pd
import streamlit as st

from lib import agent, llm, style
from lib.queries import schema_description

EXAMPLES = [
    "Summarize what I'm looking at",
    "What needs attention here?",
    "Who has the most open points?",
]
CHAT_HEIGHT = 440
RECENT_MESSAGES = 6  # 3 exchanges shown; older ones collapse into an expander


def render_rail(cfg: dict, scope_val, selected: pd.Series | None) -> None:
    job = st.session_state.get("rail_job")
    running = bool(job) and job["status"] == "running"

    @st.fragment(run_every="1.5s" if running else None)
    def _fragment():
        with st.container(key="rail_card"):
            _rail_body(cfg, scope_val, selected)

    _fragment()


def _rail_body(cfg: dict, scope_val, selected: pd.Series | None) -> None:
    if "chat" not in st.session_state:
        st.session_state.chat = []

    # Collect a finished background job into history before rendering.
    job = st.session_state.get("rail_job")
    if job and job["status"] == "done":
        st.session_state.chat.append({"role": "user", "content": job["question"]})
        st.session_state.chat.append({"role": "assistant", **job["result"]})
        st.session_state.rail_job = None
        job = None

    head, clear, close = st.columns([4.4, 0.8, 0.8], vertical_alignment="center")
    head.markdown(
        '<span style="font-weight:600;font-size:0.95rem">'
        "Local AI assistant</span>",
        unsafe_allow_html=True,
    )
    if st.session_state.chat:
        clear.button(
            "", icon=":material/delete_sweep:", key="rail_clear",
            help="Clear conversation",
            on_click=lambda: st.session_state.update(chat=[], rail_job=None),
        )
    close.button(
        "✕", key="rail_close", help="Close the assistant",
        on_click=lambda: st.session_state.update(rail_open=False),
    )

    if not llm.available():
        st.caption("Demo mode — run `python download_model.py` to enable the model.")

    thread_box = st.container(height=CHAT_HEIGHT, border=False, key="rail_thread")
    question = None
    with thread_box:
        if not st.session_state.chat and not job:
            st.markdown(
                '<div class="rail-hero">'
                '<div class="hello">Hello.</div>'
                '<div class="sub">How can I help with your data?</div>'
                "</div>",
                unsafe_allow_html=True,
            )
            for example in EXAMPLES:
                if st.button(example, key=f"rail_ex_{example[:18]}", width="stretch"):
                    question = example

        msgs = st.session_state.chat
        older, recent = msgs[:-RECENT_MESSAGES], msgs[-RECENT_MESSAGES:]
        if older:
            with st.expander(f"Earlier messages ({len(older)})"):
                for i, msg in enumerate(older):
                    _render_message(msg, i)
        for i, msg in enumerate(recent, start=len(older)):
            _render_message(msg, i)

        if job and job["status"] == "running":
            with st.chat_message("user"):
                st.markdown(job["question"])
            with st.chat_message("assistant"):
                n = len(job["steps"])
                label = f"Working — {n} quer{'y' if n == 1 else 'ies'} so far…" if n else "Thinking…"
                with st.status(label, expanded=bool(n)):
                    for step in job["steps"]:
                        st.code(step["sql"], language="sql")
                st.caption("You can keep using the dashboard while I work.")

    with st.container(key="rail_prompt"):
        chips = _chip(cfg["name"], "#ECEDF5", "#50545E")
        if scope_val is not None:
            chips += _chip(str(scope_val), "#ECEDF5", "#50545E")
        if selected is not None:
            chips += _chip(str(selected[cfg["key"]]), "#E0EDFF", "#1F5FAE")
        st.markdown(
            '<div class="rail-context">'
            '<span style="font-size:0.7rem;font-weight:600;text-transform:uppercase;'
            'letter-spacing:0.05em;color:#9699A6;">Context</span>'
            f"{chips}</div>",
            unsafe_allow_html=True,
        )

        typed = st.chat_input("Ask about this view…", key="rail_input")
        if typed and typed.strip():
            question = typed.strip()

        st.caption(
            "The local model can make mistakes. Every figure is checked "
            "against the query results shown in each answer."
        )

    if question:
        if st.session_state.get("rail_job"):
            st.toast("Still working on the previous question — one moment.")
        else:
            _start_job(question, cfg, scope_val, selected)
            st.rerun(scope="fragment")


def _start_job(question, cfg, scope_val, selected) -> None:
    history = [
        (m["content"], a.get("answer", ""))
        for m, a in zip(st.session_state.chat[::2], st.session_state.chat[1::2])
        if m["role"] == "user"
    ]
    context = _context_string(cfg, scope_val, selected)
    # Resolve everything cached in the MAIN thread: st.cache_* must not be
    # called from the worker.
    schema = schema_description()
    if llm.available():
        llm._llm()  # warm the model handle so the thread only reads the cache
    job = {"status": "running", "question": question, "steps": [], "result": None}
    st.session_state.rail_job = job
    threading.Thread(
        target=_worker, args=(question, history, context, schema, job), daemon=True
    ).start()


def _worker(question, history, context, schema, job) -> None:
    """Runs in a background thread. No Streamlit calls allowed here."""
    try:
        result = agent.run_agent(
            question,
            history=history,
            context=context,
            schema=schema,
            on_step=lambda i, sql, df, error: job["steps"].append(
                {"sql": sql, "df": df, "error": error}
            ),
        )
    except Exception as exc:
        result = {
            "answer": f"Something went wrong while answering: `{exc}`.",
            "steps": list(job["steps"]), "unverified": [],
        }
    job["result"] = result
    job["status"] = "done"


def _context_string(cfg: dict, scope_val, selected: pd.Series | None) -> str:
    parts = [f"page={cfg['name']} (table {cfg['table']})"]
    if scope := cfg.get("scope"):
        if scope_val is not None:
            parts.append(f"{scope['column']}={scope_val}")
    if selected is not None:
        row = "; ".join(
            f"{k}={v}" for k, v in selected.items()
            if pd.notna(v) and len(str(v)) < 60
        )
        parts.append(f"selected row: {row}")
    return " | ".join(parts)


def _chip(text: str, bg: str, fg: str) -> str:
    return (
        f'<span class="pill" style="background-color:{bg};color:{fg};'
        f'font-size:0.72rem;padding:2px 9px;">{text}</span>'
    )


def _verification_note(msg: dict) -> None:
    if flags := msg.get("unverified"):
        st.warning(
            "Verify these figures against the queries: " + " · ".join(flags),
            icon=":material/rule:",
        )


def _render_message(msg: dict, idx: int) -> None:
    try:
        with st.chat_message(msg["role"]):
            if msg["role"] == "user":
                st.markdown(msg["content"])
                return
            steps = msg.get("steps", [])
            if steps:
                n = len(steps)
                with st.expander(f"{n} quer{'y' if n == 1 else 'ies'}"):
                    for j, step in enumerate(steps):
                        st.code(step["sql"], language="sql")
                        if step.get("error"):
                            st.error(step["error"])
                        elif step.get("df") is not None and not step["df"].empty:
                            st.dataframe(
                                step["df"].head(agent.MAX_RESULT_ROWS),
                                hide_index=True, key=f"rail_{idx}_step_{j}",
                                height=min(230, 70 + 35 * min(len(step["df"]), 25)),
                            )
            st.markdown(msg.get("answer", ""))
            _verification_note(msg)
    except Exception as exc:
        st.error(f"Couldn't render this message ({exc}).")
