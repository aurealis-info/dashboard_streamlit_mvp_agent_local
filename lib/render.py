"""Generic page renderer. Reads a page dict from dashboard_config.PAGES and
builds the whole page: scope picker, KPIs, filters, main table, drill-down
panel, charts, AI panel. It only ever assumes grain and join keys — never
specific column names.
"""

import pandas as pd
import plotly.express as px
import streamlit as st

import dashboard_config as config
from lib import agent, derived, rail, style
from lib.db import db_path
from lib.queries import load_table
from lib.search import fuzzy_filter
from lib.tables import interactive_table, prettify

MAX_AUTO_FILTERS = 3
AUTO_FILTER_MAX_CARDINALITY = 25


def render_page(cfg: dict) -> None:
    style.inject_css()
    df = derived.apply(cfg["slug"], load_table(cfg["table"]))

    scope_val, scope_toolbar = _resolve_scope(df, cfg)
    if scope_val is not None:
        df = df[df[cfg["scope"]["column"]] == scope_val]

    rail_open = st.session_state.setdefault("rail_open", True)
    if rail_open:
        main_col, rail_col = st.columns([2.55, 1.45], gap="medium")
    else:
        main_col, rail_col = st.container(), None

    selected = None
    with main_col:
        _header_row(cfg, rail_open)

        if kpis := cfg.get("kpis"):
            style.kpi_row([
                (k["label"], str(_metric(df, k)), k.get("note", ""), k.get("tone", ""))
                for k in kpis
            ])

        view = _apply_filters(df, cfg)

        selected = interactive_table(
            view,
            key=cfg["slug"],
            defaults=cfg.get("default_columns"),
            height=min(420, 70 + 35 * len(view)),
            toolbar=scope_toolbar,
            toolbar_left=lambda: _data_popover(cfg),
        )

        if detail := cfg.get("detail"):
            if selected is None:
                st.caption(
                    "Select a row to drill down — the assistant picks it up as context."
                )
            else:
                _render_detail(cfg, detail, selected, scope_val)

        if charts := cfg.get("charts"):
            st.divider()
            cols = st.columns(min(len(charts), 2))
            for i, chart in enumerate(charts):
                with cols[i % len(cols)]:
                    _render_chart(chart, scope_val)

    if rail_col is not None:
        with rail_col:
            rail.render_rail(cfg, scope_val, selected)


def _header_row(cfg: dict, rail_open: bool) -> None:
    title, toggle = st.columns([6, 2], vertical_alignment="center")
    title.markdown(f"# {cfg['name']}")
    if not rail_open:
        with toggle:
            st.button(
                "Local AI assistant", key=f"rail_open_{cfg['slug']}",
                icon=":material/forum:",
                on_click=lambda: st.session_state.update(rail_open=True),
            )


def _data_popover(cfg: dict) -> None:
    with st.popover("Data", icon=":material/database:"):
        st.caption(f"Source table: `{cfg['table']}`")
        st.caption(f"Database: `{db_path().name}`")
        try:
            runs = load_table(config.FRESHNESS_TABLE)
            for _, run in runs.iterrows():
                ok = str(run.get("status", "")).lower() in ("success", "ok", "succeeded")
                icon = ":material/check_circle:" if ok else ":material/error:"
                ran_at = run.get("ran_at", "")
                ts = ran_at.strftime("%b %d, %H:%M") if hasattr(ran_at, "strftime") else ran_at
                st.caption(f"{icon} {run.get('view_name', 'run')} · {ts}")
        except Exception as exc:
            st.caption(f"No freshness info: {exc}")
        if st.button("Refresh data", icon=":material/refresh:", key=f"refresh_{cfg['slug']}"):
            st.cache_data.clear()
            st.rerun()


def _resolve_scope(df: pd.DataFrame, cfg: dict):
    """Compact pager (‹ Sprint 25 ›) instead of a selectbox.

    The value is resolved here (KPIs and joins need it before the table
    renders); the arrows themselves render later in the table toolbar.
    Button on_click callbacks mutate state before the rerun, so the page
    always shows the value the user just paged to.
    """
    scope = cfg.get("scope")
    if not scope:
        return None, None
    options = sorted(df[scope["column"]].dropna().unique())
    if not options:
        return None, None
    key = f"scope_idx_{cfg['slug']}"
    idx = min(st.session_state.get(key, len(options) - 1), len(options) - 1)
    st.session_state[key] = idx

    def _step(delta: int):
        st.session_state[key] = min(max(idx + delta, 0), len(options) - 1)

    def toolbar():
        prev_col, label_col, next_col = st.columns(
            [1, 2.6, 1], vertical_alignment="center"
        )
        prev_col.button(
            "‹", key=f"{key}_prev", disabled=idx == 0,
            on_click=_step, args=(-1,), help="Previous " + scope["label"].lower(),
        )
        label_col.markdown(
            f'<div class="scope-label">{options[idx]}</div>', unsafe_allow_html=True
        )
        next_col.button(
            "›", key=f"{key}_next", disabled=idx == len(options) - 1,
            on_click=_step, args=(1,), help="Next " + scope["label"].lower(),
        )

    return options[idx], toolbar


def _metric(df: pd.DataFrame, spec: dict):
    if where := spec.get("where"):
        df = df.query(where)
    metric = spec["metric"]
    if metric == "count":
        return len(df)
    op, col = metric.split(":", 1)
    series = df[col].dropna()
    if series.empty:
        return 0
    if op == "sum":
        return int(series.sum())
    if op == "mean":
        return round(float(series.mean()), 1)
    if op == "nunique":
        return int(series.nunique())
    raise ValueError(f"Unknown metric '{metric}'")


def _apply_filters(df: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    filter_cols = cfg.get("filters", [])
    if filter_cols == "auto":
        skip = {cfg["key"], cfg.get("title_column"), *(cfg.get("search") or [])}
        if scope := cfg.get("scope"):
            skip.add(scope["column"])
        candidates = [
            c for c in df.select_dtypes(include="object").columns
            if c not in skip and 1 < df[c].nunique() <= AUTO_FILTER_MAX_CARDINALITY
        ]
        candidates.sort(key=lambda c: df[c].nunique())
        filter_cols = candidates[:MAX_AUTO_FILTERS]

    search_cols = cfg.get("search") or []
    if not filter_cols and not search_cols:
        return df

    # Big fuzzy search on the left, filter dropdowns on the right.
    if search_cols and filter_cols:
        boxes = st.columns([2.4] + [1] * len(filter_cols))
    else:
        boxes = st.columns(max(len(filter_cols), 1))

    needle = ""
    if search_cols:
        needle = boxes[0].text_input(
            "Search",
            placeholder="Fuzzy search: " + " / ".join(prettify(c) for c in search_cols),
            key=f"search_{cfg['slug']}",
            icon=":material/search:",
        )
    for i, col in enumerate(filter_cols, start=1 if search_cols else 0):
        chosen = boxes[i].multiselect(
            prettify(col),
            sorted(df[col].dropna().unique()),
            key=f"filter_{cfg['slug']}_{col}",
        )
        if chosen:
            df = df[df[col].isin(chosen)]
    if needle:
        df = fuzzy_filter(df, search_cols, needle)
    return df


def _render_detail(cfg: dict, detail: dict, selected: pd.Series, scope_val) -> None:
    detail_df = load_table(detail["table"])
    for detail_col, main_col in detail["join_on"].items():
        target = scope_val if main_col == "@scope" else selected[main_col]
        detail_df = detail_df[detail_df[detail_col] == target]

    with st.container(border=True):
        title_col = cfg.get("title_column", cfg["key"])
        header = str(selected[cfg["key"]])
        if title_col != cfg["key"]:
            header += f" · {selected[title_col]}"
        st.markdown(f'<div class="detail-title">{header}</div>', unsafe_allow_html=True)
        n = len(detail_df)
        st.markdown(f"**{detail['title']}** — {n} row{'s' if n != 1 else ''}")
        if detail_df.empty:
            st.caption("Nothing linked to this row.")
        else:
            interactive_table(
                detail_df,
                key=f"{cfg['slug']}_detail_{selected[cfg['key']]}",
                defaults=detail.get("default_columns"),
                height=min(330, 70 + 35 * len(detail_df)),
                selectable=False,
            )
        row_id = str(selected[cfg["key"]])
        action_cols = st.columns([1.4, 1, 4])
        if action_cols[0].button(
            "Generate briefing", icon=":material/auto_awesome:",
            key=f"briefbtn_{cfg['slug']}_{row_id}",
        ):
            with st.spinner("Reading the data…"):
                text = agent.brief_row(selected, detail_df, cfg["name"])
            st.session_state[f"brief_{cfg['slug']}"] = (row_id, text)
        if cfg.get("show_assign_stub"):
            action_cols[1].button(
                "Assign…", icon=":material/person_add:", disabled=True,
                help="Experimental — planned write-back action (assign people to work).",
                key=f"assign_{cfg['slug']}_{row_id}",
            )
        stored = st.session_state.get(f"brief_{cfg['slug']}")
        if stored and stored[0] == row_id:
            st.markdown(stored[1])


def _render_chart(chart: dict, scope_val) -> None:
    df = load_table(chart["table"])
    if where := chart.get("where"):
        df = df.query(where, local_dict={"scope": scope_val})
    st.markdown(f"### {chart['title']}")

    if chart["type"] == "bar_count":
        data = df[chart["dimension"]].value_counts().reset_index()
        fig = px.bar(
            data, x="count", y=chart["dimension"], orientation="h",
            color_discrete_sequence=[style.BLUE],
        )
        fig.update_yaxes(categoryorder="total ascending", title=None)
    elif chart["type"] == "bar_values":
        data = (
            df.groupby(chart["label_column"])[chart["value_column"]]
            .sum().reset_index()
        )
        fig = px.bar(
            data, x=chart["value_column"], y=chart["label_column"], orientation="h",
            color_discrete_sequence=[style.BLUE],
        )
        fig.update_yaxes(categoryorder="total ascending", title=None)
    elif chart["type"] == "week_line":
        data = (
            df.dropna(subset=[chart["date_column"]])
            .set_index(chart["date_column"]).resample("W").size()
            .tail(12).reset_index(name="count")
        )
        fig = px.bar(
            data, x=chart["date_column"], y="count",
            color_discrete_sequence=[style.SKY],
        )
        fig.update_yaxes(title=None, dtick=1)
    else:
        st.warning(f"Unknown chart type '{chart['type']}'")
        return
    fig.update_xaxes(title=None)
    st.plotly_chart(
        style.plotly_layout(fig, height=300),
        config={"displayModeBar": False},
        key=f"chart_{chart['title']}",
    )


