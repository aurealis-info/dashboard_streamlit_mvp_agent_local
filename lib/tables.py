"""Dynamic, schema-agnostic tables.

Tables show whatever columns their DataFrame contains: names are
auto-prettified (snake_case -> "Snake case"), formats follow dtype, columns
listed in dashboard_config.PILL_COLUMNS render as colored pills (stable
auto-assigned colors, with optional fixed overrides), and a per-table picker
exposes every available column. Nothing here knows what the data means.
"""

import zlib

import pandas as pd
import streamlit as st

import dashboard_config as config

# (background, text) pairs — values are hashed onto this palette so a given
# value always gets the same color, run after run.
PILL_PALETTE = [
    ("#E0EDFF", "#1F5FAE"),
    ("#DDF8EC", "#007A4D"),
    ("#FFF0DD", "#B26B00"),
    ("#F3E8FC", "#7E3EB6"),
    ("#FCE3E7", "#C0294B"),
    ("#E5F4F9", "#1A6E8C"),
    ("#ECEDF5", "#50545E"),
]


def prettify(col: str) -> str:
    return col.replace("_", " ").strip().capitalize()


def pill_style(value) -> str:
    if pd.isna(value) or str(value) == "":
        return ""
    text = str(value)
    bg, fg = config.PILL_OVERRIDES.get(
        text, PILL_PALETTE[zlib.crc32(text.encode()) % len(PILL_PALETTE)]
    )
    return f"background-color:{bg};color:{fg};font-weight:600;"


def auto_column_config(df: pd.DataFrame) -> dict:
    cfg = {}
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            cfg[col] = st.column_config.DateColumn(format="MMM D, YYYY")
        elif pd.api.types.is_float_dtype(df[col]):
            cfg[col] = st.column_config.NumberColumn(format="%.0f")
    return cfg


def column_picker(df: pd.DataFrame, defaults: list[str], key: str) -> list[str]:
    options = list(df.columns)
    with st.popover("Columns", icon=":material/view_column:"):
        chosen = st.multiselect(
            "Visible columns",
            options,
            default=[c for c in defaults if c in options],
            key=f"cols_{key}",
        )
    return chosen or options


def interactive_table(
    df: pd.DataFrame,
    *,
    key: str,
    defaults: list[str] | None = None,
    height: int = 400,
    selectable: bool = True,
    toolbar=None,
    toolbar_left=None,
) -> pd.Series | None:
    """Render a dynamic table; return the selected original row (or None).

    `toolbar` renders to the far right of the Columns button (e.g. the
    sprint pager); `toolbar_left` renders directly next to it (e.g. the
    data-status popover).
    """
    pill_cols = [prettify(c) for c in config.PILL_COLUMNS]
    display = df.rename(columns={c: prettify(c) for c in df.columns})
    defaults = [prettify(c) for c in (defaults or list(df.columns)[:10])]
    ordered = [c for c in defaults if c in display.columns] + [
        c for c in display.columns if c not in defaults
    ]
    display = display[ordered]

    if toolbar or toolbar_left:
        pick, extra, _, right = st.columns(
            [1.15, 1.0, 2.45, 1.4], vertical_alignment="center"
        )
        with pick:
            visible = column_picker(display, defaults, key)
        if toolbar_left:
            with extra:
                toolbar_left()
        if toolbar:
            with right:
                toolbar()
    else:
        visible = column_picker(display, defaults, key)
    display = display[[c for c in ordered if c in visible]].reset_index(drop=True)

    styler = display.style
    for col in display.columns:
        if col in pill_cols:
            styler = styler.map(pill_style, subset=[col])

    event = st.dataframe(
        styler,
        key=f"table_{key}",
        hide_index=True,
        width="stretch",
        height=height,
        column_config=auto_column_config(display),
        on_select="rerun" if selectable else "ignore",
        selection_mode="single-row",
    )
    if selectable and event.selection.rows:
        return df.reset_index(drop=True).iloc[event.selection.rows[0]]
    return None
