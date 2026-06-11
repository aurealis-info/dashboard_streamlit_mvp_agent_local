"""AI assistant on top of the in-process local model (lib/llm.py).

run_agent() is a small harness that answers questions by running read-only
SQL against the dashboard tables:

  loop (max N rounds):
    model responds {"sql": "SELECT ..."}  -> harness executes, feeds result back
    model responds {"answer": "..."}      -> done

Accuracy scaffolding (a 4B model needs all of it, each added after an
observed failure):
  - results are fed back as one-line records ("- assignee=Sofia; n=17"),
    never aligned tables — column-aligned text invites cross-row misreads
  - NULLs are spelled out and the prompt forbids attributing their numbers
  - the final answer is REGENERATED from only the question + results
  - a deterministic checker verifies every figure exists in the results AND
    is associated with the label it's attached to; failures trigger one
    corrective rewrite, and anything still unverified is flagged in the UI

Safety is structural: read-only connection, single SELECT statements only.
Without a model file everything degrades to labeled pandas templates.
"""

import json
import re
from collections import defaultdict

import pandas as pd

from lib import llm
from lib.queries import SQL_DIALECT, run_select, schema_description

MAX_ROUNDS = 3
MAX_RESULT_ROWS = 25


def backend_info() -> tuple[str, str | None]:
    """('local', model file name) or ('demo', None)."""
    if llm.available():
        return ("local", llm.model_name())
    return ("demo", None)


HARNESS_SYSTEM = """\
You are the data assistant for a work-management dashboard backed by SQLite.

Schema:
{schema}

You answer questions by running read-only SQL. Respond with EXACTLY ONE JSON
object on a single line, nothing else. Either:
  {{"sql": "SELECT ..."}}   to run one query and receive its result
  {{"answer": "..."}}       when you can answer (concise markdown, cite numbers)

Rules:
- If the message is a greeting, thanks, or anything that is NOT a question
  about the data, reply immediately with {{"answer": "..."}} — run NO SQL.
- State the scope of your answer (whole board vs a specific sprint) whenever
  the question doesn't specify one — the dashboard pages are sprint-scoped,
  so unscoped totals can look wrong to the reader.
- One SELECT statement per call, {dialect} dialect, on one line.
- SELECT every column you will mention in the answer (names AND numbers —
  if you sort by a measure, select that measure). Never state a number
  that is not in a query result.
- Use the PRE-AGGREGATED tables (see comments) when they hold the measure.
- When comparing groups, GROUP BY the label and select it — never UNION
  bare aggregates (the labels get lost).
- NULL assignees/owners mean unassigned — filter them out or report them as
  "unassigned", never as a person.
- At most {max_rounds} queries per question; prefer one well-chosen query.

Example exchange:
  User: Who has the most issues?
  You: {{"sql": "SELECT assignee, COUNT(*) AS n FROM issue_detail_current WHERE assignee IS NOT NULL GROUP BY assignee ORDER BY n DESC LIMIT 3"}}
  User: Result: - assignee=Maya Chen; n=9 / - assignee=Ravi Patel; n=7
  You: {{"answer": "**Maya Chen** has the most issues (**9**), ahead of Ravi Patel (7)."}}
"""


def run_agent(
    question: str,
    on_step=None,
    history: list[tuple[str, str]] | None = None,
    context: str | None = None,
    schema: str | None = None,
) -> dict:
    """Answer a question via the SQL harness.

    Returns {"answer", "steps": [{"sql","df","error"}], "unverified": [str]}.
    on_step(index, sql, df, error) fires as each query executes.
    history: recent (question, answer) pairs for follow-up context.
    context: what the user is looking at (page, scope, selected row) so
    questions like "is this person overloaded?" resolve without names.
    """
    if not llm.available():
        return {
            "answer": (
                "No local model found. Run `python download_model.py` to fetch "
                "Gemma 3 4B (~2.5 GB), then restart — the assistant will pick "
                "it up automatically."
            ),
            "steps": [], "unverified": [],
        }
    # schema may be precomputed by the caller: st.cache_data functions must
    # not be called from background threads, so the UI passes it in.
    system = HARNESS_SYSTEM.format(
        schema=schema or schema_description(), max_rounds=MAX_ROUNDS, dialect=SQL_DIALECT,
    )
    opening = question
    if history:
        past = "\n".join(f"Q: {q}\nA: {a[:300]}" for q, a in history[-3:])
        opening = f"Earlier conversation:\n{past}\n\nCurrent question: {question}"
    if context:
        opening = (
            f"The user is currently looking at: {context}\n"
            "Words like 'this person', 'this project' or 'here' refer to that "
            f"context.\n\n{opening}"
        )
    messages = [{"role": "user", "content": opening}]
    steps: list[dict] = []

    for _ in range(MAX_ROUNDS + 1):
        raw = llm.chat(system, messages, temperature=0.0, max_tokens=600)
        parsed = _extract_json(raw)

        if sql := parsed.get("sql"):
            df, error = None, None
            try:
                df = run_select(sql)
                feedback = _records(df) if not df.empty else (
                    "(query returned no rows — before concluding the data is "
                    "empty, check your filter values against the schema's "
                    "listed values and try a corrected query)"
                )
            except Exception as exc:
                error = str(exc)
                feedback = f"ERROR: {exc}"
            steps.append({"sql": sql, "df": df, "error": error})
            if on_step:
                on_step(len(steps), sql, df, error)
            if len(steps) > MAX_ROUNDS:
                break
            messages += [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": f"Result:\n{feedback}\n\nRespond with JSON."},
            ]
        elif parsed.get("answer") or not parsed:
            if steps:
                return _finalize(question, steps)
            return {"answer": parsed.get("answer") or raw, "steps": steps,
                    "unverified": []}

    if steps:
        return _finalize(question, steps)
    return {
        "answer": "I hit the query limit without a confident answer — "
                  "try a more specific question.",
        "steps": steps, "unverified": [],
    }


def _records(df: pd.DataFrame, limit: int = MAX_RESULT_ROWS) -> str:
    """One line per row, 'col=value' pairs. Numbers stay glued to their
    labels, which column-aligned text tables fail to guarantee for small
    models."""
    lines = []
    for _, row in df.head(limit).iterrows():
        pairs = "; ".join(
            f"{col}={'NULL (unassigned/missing)' if pd.isna(val) else val}"
            for col, val in row.items()
        )
        lines.append(f"- {pairs}")
    if len(df) > limit:
        lines.append(f"... ({len(df)} rows total, {limit} shown)")
    return "\n".join(lines)


def _grounded_answer(question: str, steps: list[dict], correction: str | None = None) -> str:
    blocks = []
    for i, step in enumerate(steps, 1):
        if step.get("error"):
            blocks.append(f"Query {i}: {step['sql']}\nFAILED: {step['error']}")
        else:
            df = step["df"]
            body = _records(df) if not df.empty else "(no rows)"
            blocks.append(f"Query {i}: {step['sql']}\nResult ({len(df)} rows):\n{body}")
    system = (
        "Answer the question using ONLY the query results below. Each '- ' "
        "line is one row; a number belongs ONLY to the labels on its own "
        "line. NULL means unassigned/missing — never attribute its numbers "
        "to a named person or item. Every number you state must appear in "
        "the results. If the results don't contain the answer, say what is "
        "missing instead of guessing. Write natural prose or a short markdown "
        "bullet list for a human reader — NEVER echo the 'col=value' record "
        "syntax. Concise, no preamble."
    )
    user = f"Question: {question}\n\n" + "\n\n".join(blocks)
    if correction:
        user += f"\n\n{correction}"
    return llm.chat(system, user, temperature=0.0)


def _finalize(question: str, steps: list[dict]) -> dict:
    answer = _grounded_answer(question, steps)
    flags = _accuracy_flags(answer, steps)
    if flags:
        correction = (
            "IMPORTANT — your previous draft contained errors: "
            + "; ".join(flags)
            + ". Rewrite the answer keeping every number on the same row as "
            "its label."
        )
        retry = _grounded_answer(question, steps, correction=correction)
        retry_flags = _accuracy_flags(retry, steps)
        if len(retry_flags) < len(flags):
            answer, flags = retry, retry_flags
    return {"answer": answer, "steps": steps, "unverified": flags}


def _row_associations(steps: list[dict]):
    """available: every number present in any result (plus row counts).
    label_numbers: label string -> numbers appearing on that label's rows."""
    available: set[str] = set()
    label_numbers: dict[str, set[str]] = defaultdict(set)
    for step in steps:
        df = step.get("df")
        if df is None:
            continue
        available.add(str(len(df)))
        for _, row in df.head(MAX_RESULT_ROWS).iterrows():
            row_numbers: set[str] = set()
            row_labels: list[str] = []
            for val in row:
                if pd.isna(val):
                    continue
                text = str(val)
                tokens = re.findall(r"\d+(?:\.\d+)?", text)
                row_numbers.update(tokens)
                if not re.fullmatch(r"[\d\.\-]+", text) and len(text) > 2:
                    row_labels.append(text.lower())
            available.update(row_numbers)
            for label in row_labels:
                label_numbers[label].update(row_numbers)
    return available, label_numbers


def _accuracy_flags(answer: str, steps: list[dict]) -> list[str]:
    """Deterministic check: every figure must exist in the results, and a
    figure mentioned alongside a label must occur on that label's row."""
    available, label_numbers = _row_associations(steps)
    flags: list[str] = []
    plain = answer.replace(",", "")
    for token in re.findall(r"\d+(?:\.\d+)?", plain):
        normalized = token.rstrip("0").rstrip(".") if "." in token else token
        if token not in available and normalized not in available:
            flags.append(f"'{token}' does not appear in any query result")
    for segment in re.split(r"[.;\n]|, | and | while | whereas ", plain):
        seg_lower = segment.lower()
        seg_numbers = re.findall(r"\d+(?:\.\d+)?", segment)
        for label, allowed in label_numbers.items():
            if label in seg_lower:
                for number in seg_numbers:
                    if number in available and number not in allowed:
                        flags.append(
                            f"'{number}' is not on the same result row as '{label}'"
                        )
    return sorted(set(flags))


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?|```$", "", text).strip()
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        # Small models sometimes reply with bare SQL instead of the protocol.
        if re.match(r"(?is)^\s*(select|with)\b", text):
            return {"sql": text.strip()}
        return {}
    blob = match.group(0)
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        # Small models sometimes emit raw newlines inside JSON strings.
        for key in ("sql", "answer"):
            inner = re.search(rf'"{key}"\s*:\s*"(.*)"\s*\}}', blob, re.S)
            if inner:
                value = inner.group(1).replace('\\"', '"').replace("\\n", "\n")
                return {key: value}
        return {}


def brief_row(row: pd.Series, detail_df: pd.DataFrame, page_name: str) -> str:
    facts = "\n".join(f"{k}: {v}" for k, v in row.items() if pd.notna(v))
    if llm.available():
        detail_txt = _records(detail_df, 40) if not detail_df.empty else "(no linked rows)"
        system = (
            "You are a project management assistant. Write a crisp briefing "
            "(3-5 sentences, markdown) about the selected item using ONLY the "
            "data provided. Mention notable risks or imbalances if visible. "
            "Do not invent facts."
        )
        user = f"Page: {page_name}\nSelected item:\n{facts}\n\nLinked rows:\n{detail_txt}"
        return llm.chat(system, user)
    return _demo_brief(row, detail_df)


def _demo_brief(row: pd.Series, detail_df: pd.DataFrame) -> str:
    label = str(row.iloc[0])
    fields = [
        f"{str(k).replace('_', ' ')} **{v}**"
        for k, v in list(row.items())[1:]
        if pd.notna(v) and str(v) != ""
    ][:5]
    lines = [f"**{label}** — " + ", ".join(fields) + "."]
    if detail_df.empty:
        lines.append("No linked rows.")
    else:
        lines.append(f"Linked rows: **{len(detail_df)}**.")
        for col in detail_df.select_dtypes(include="object"):
            series = detail_df[col].dropna()
            if 1 < series.nunique() <= 8 and len(series) > 1:
                parts = ", ".join(f"{v} ({c})" for v, c in series.value_counts().items())
                lines.append(f"- {str(col).replace('_', ' ').capitalize()}: {parts}")
    lines.append("\n*Demo mode — template briefing. Add a local model for narrative output.*")
    return "\n\n".join(lines)


def summarize(df: pd.DataFrame, page_name: str) -> str:
    if df.empty:
        return "No rows match the current filters."
    if llm.available():
        system = (
            "You summarize dashboard data for a manager. 3-5 bullet points, "
            "markdown, grounded ONLY in the provided rows. Highlight outliers."
        )
        return llm.chat(system, f"Page: {page_name}\n\n{_records(df, 60)}")
    return _demo_summary(df, page_name)


def _demo_summary(df: pd.DataFrame, page_name: str) -> str:
    lines = [f"**{page_name}** — {len(df)} rows, {len(df.columns)} columns in view."]
    for col in df.select_dtypes(include="object"):
        series = df[col].dropna()
        if 1 < series.nunique() <= 12 and not series.empty:
            counts = series.value_counts()
            top, top_n = counts.index[0], int(counts.iloc[0])
            if top_n > 1:
                share = round(100 * top_n / len(series))
                lines.append(
                    f"- Most common **{str(col).replace('_', ' ')}**: {top} "
                    f"({top_n} rows, {share}%)."
                )
    for col in df.select_dtypes(include="number"):
        series = df[col].dropna()
        if not series.empty and series.nunique() > 1:
            lines.append(
                f"- **{str(col).replace('_', ' ')}**: total {int(series.sum())}, "
                f"median {round(float(series.median()), 1)}, max {int(series.max())}."
            )
        if len(lines) > 7:
            break
    lines.append("\n*Demo mode — computed with pandas. Add a local model for narrative summaries.*")
    return "\n".join(lines)
