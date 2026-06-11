"""Look and feel: clean SaaS aesthetic in the spirit of Monday.com / Linear.

White cards on a cool light-gray canvas, one strong blue, and a vivid but
disciplined status palette. The Figtree font loads from Google Fonts when the
network allows and falls back to Segoe UI / Helvetica behind a proxy.
"""

import streamlit as st

TEXT = "#323338"
MUTED = "#676879"
BLUE = "#0073EA"
BORDER = "#E6E9EF"

GREEN = "#00C875"
RED = "#E2445C"
ORANGE = "#FDAB3D"
PURPLE = "#A25DDC"
SKY = "#579BFC"
GRAY = "#797E93"

# Categorical palette for charts (Monday-ish board colors)
CHART_COLORS = [
    "#0073EA", "#00C875", "#FDAB3D", "#A25DDC", "#E2445C",
    "#579BFC", "#66CCFF", "#FF7575", "#9CD326", "#797E93",
]

HEALTH_STYLES = {
    "At risk":    "background-color:#FCE3E7;color:#C0294B;font-weight:600;",
    "Stalled":    "background-color:#FFF0DD;color:#B26B00;font-weight:600;",
    "Unassigned": "background-color:#F3E8FC;color:#7E3EB6;font-weight:600;",
    "On track":   "background-color:#DDF8EC;color:#007A4D;font-weight:600;",
    "Done":       "background-color:#ECEDF5;color:#676879;font-weight:600;",
}
HEALTH_COLORS = {
    "At risk": RED, "Stalled": ORANGE, "Unassigned": PURPLE,
    "On track": GREEN, "Done": GRAY,
}

STAGE_STYLES = {
    "Intake":      "background-color:#ECEDF5;color:#50545E;",
    "Scoping":     "background-color:#E0EDFF;color:#1F5FAE;",
    "In progress": "background-color:#FFF0DD;color:#B26B00;",
    "Review":      "background-color:#F3E8FC;color:#7E3EB6;",
    "Done":        "background-color:#DDF8EC;color:#007A4D;",
}

STATUS_STYLES = {
    "To do":       "background-color:#ECEDF5;color:#50545E;",
    "In progress": "background-color:#FFF0DD;color:#B26B00;",
    "In review":   "background-color:#F3E8FC;color:#7E3EB6;",
    "Done":        "background-color:#DDF8EC;color:#007A4D;",
}


def inject_css() -> None:
    st.markdown(
        f"""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');

        #MainMenu, footer {{ visibility: hidden; }}
        .block-container {{
            padding-top: 2.6rem; max-width: 100%;
            padding-left: 2.4rem; padding-right: 2.4rem;
        }}

        .st-key-rail_card {{
            background: #FFFFFF;
            border: 1px solid {BORDER};
            border-radius: 14px;
            padding: 16px 18px 12px 18px;
            box-shadow: 0 1px 4px rgba(9, 30, 66, 0.06);
            position: sticky;
            top: 4.2rem;
        }}
        .st-key-rail_card {{
            min-height: calc(100vh - 6rem);
        }}
        .st-key-rail_prompt {{
            background: #F6F7FB;
            border: 1px solid {BORDER};
            border-radius: 12px;
            padding: 14px 14px 18px 14px;
            gap: 0.55rem !important;
        }}
        .st-key-rail_prompt [data-testid="stCaptionContainer"] {{
            margin-top: 14px;
        }}
        [class*="st-key-rail_open_"] {{
            display: flex;
            justify-content: flex-end;
        }}
        .st-key-rail_prompt [data-testid="stChatInput"] {{
            background: #FFFFFF;
            border: 1px solid {BORDER};
            border-radius: 10px;
        }}
        .st-key-rail_prompt [data-testid="stCaptionContainer"] p {{
            font-size: 0.74rem;
            line-height: 1.45;
        }}
        .rail-context {{
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
        }}
        .rail-context .pill {{ margin-right: 0; }}
        .st-key-rail_prompt [data-testid="stElementContainer"]:has(.rail-context) {{
            height: auto !important;
            min-height: 26px;
        }}
        .st-key-rail_prompt [data-testid="stMarkdownContainer"]:has(.rail-context) {{
            height: auto !important;
            overflow: visible;
        }}
        [data-testid="stLayoutWrapper"]:has(> .st-key-rail_thread) {{
            flex: 1 1 auto !important;
            height: auto !important;
            min-height: 160px;
        }}
        .st-key-rail_thread {{
            height: 100%;
            overflow-y: auto;
        }}
        .rail-hero {{ padding: 26px 4px 10px 4px; }}
        .rail-hero .hello {{
            font-size: 2rem; font-weight: 700; line-height: 1.15;
            background: linear-gradient(90deg, {BLUE}, {PURPLE});
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .rail-hero .sub {{
            font-size: 1.25rem; font-weight: 500; color: {MUTED};
            margin-top: 4px;
        }}
        [class*="st-key-rail_ex_"] button {{
            width: 100%;
            justify-content: flex-start;
            text-align: left;
            background: #F6F7FB;
            border: 1px solid {BORDER};
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: {TEXT};
            font-weight: 500;
        }}
        [class*="st-key-rail_ex_"] button:hover {{
            background: #EEF4FF;
            border-color: {BLUE};
        }}

        h1 {{ font-size: 1.7rem; font-weight: 700; letter-spacing: -0.02em; color: {TEXT}; }}
        h2, h3 {{ font-weight: 600; color: {TEXT}; }}
        h3 {{ font-size: 1.05rem; }}

        .kpi-row {{ display: flex; gap: 14px; margin: 0 0 1.4rem 0; flex-wrap: wrap; }}
        .kpi-card {{
            flex: 1; min-width: 150px;
            background: #FFFFFF;
            border: 1px solid {BORDER};
            border-radius: 8px;
            padding: 14px 18px;
            box-shadow: 0 1px 4px rgba(9, 30, 66, 0.06);
        }}
        .kpi-card .kpi-label {{
            font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.06em; color: {MUTED}; margin-bottom: 6px;
        }}
        .kpi-card .kpi-value {{
            font-size: 1.75rem; font-weight: 700; color: {TEXT}; line-height: 1.1;
        }}
        .kpi-card .kpi-note {{ font-size: 0.76rem; color: {MUTED}; margin-top: 4px; }}
        .kpi-card.kpi-bad .kpi-value {{ color: {RED}; }}
        .kpi-card.kpi-good .kpi-value {{ color: {GREEN}; }}
        .kpi-card.kpi-accent .kpi-value {{ color: {BLUE}; }}

        .pill {{
            display: inline-block; padding: 3px 12px; border-radius: 12px;
            font-size: 0.78rem; font-weight: 600; margin-right: 6px;
        }}
        .detail-title {{ font-size: 1.15rem; font-weight: 700; color: {TEXT}; }}
        .detail-sub {{ font-size: 0.82rem; color: {MUTED}; }}
        .avatar {{
            display: inline-flex; width: 38px; height: 38px; border-radius: 50%;
            background: {BLUE}; color: #fff; font-weight: 600; font-size: 0.85rem;
            align-items: center; justify-content: center; margin-right: 10px;
        }}

        .scope-label {{
            text-align: center; font-weight: 600; font-size: 0.9rem;
            color: {TEXT}; white-space: nowrap;
        }}

        section[data-testid="stSidebar"] {{ border-right: 1px solid {BORDER}; }}
        .brand {{ font-size: 1.05rem; font-weight: 700; color: {TEXT}; }}
        .brand-dot {{ color: {BLUE}; }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def page_header(title: str, subtitle: str) -> None:
    st.markdown(f"# {title}")
    st.caption(subtitle)


def kpi_row(items: list[tuple[str, str, str, str]]) -> None:
    """Each item: (label, value, note, tone) — tone in {'', 'good', 'bad', 'accent'}."""
    cards = "".join(
        f"""<div class="kpi-card kpi-{tone}">
              <div class="kpi-label">{label}</div>
              <div class="kpi-value">{value}</div>
              <div class="kpi-note">{note}</div>
            </div>"""
        for label, value, note, tone in items
    )
    st.markdown(f'<div class="kpi-row">{cards}</div>', unsafe_allow_html=True)


def pill(text: str, styles: dict) -> str:
    return f'<span class="pill" style="{styles.get(text, "")}">{text}</span>'


def plotly_layout(fig, height: int = 320):
    fig.update_layout(
        height=height,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Figtree, Segoe UI, Helvetica Neue, sans-serif", color=TEXT, size=13),
        margin=dict(l=10, r=10, t=24, b=10),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0, title=None),
    )
    fig.update_xaxes(gridcolor=BORDER, zeroline=False)
    fig.update_yaxes(gridcolor=BORDER, zeroline=False)
    return fig
