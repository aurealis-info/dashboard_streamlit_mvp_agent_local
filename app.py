"""Entry point. Run with:  streamlit run app.py

Pages are built dynamically from dashboard_config.PAGES and shown in a top
navigation bar. The AI assistant lives in a context-aware rail on the right
of every page (lib/rail.py) — no separate page, no sidebar.
"""

import streamlit as st

import dashboard_config as config
from lib.render import render_page

st.set_page_config(
    page_title=config.APP_TITLE,
    page_icon="▤",
    layout="wide",
    initial_sidebar_state="collapsed",
)


def _make_page(cfg: dict):
    def _page():
        render_page(cfg)

    _page.__name__ = cfg["slug"]
    return st.Page(_page, title=cfg["name"], icon=cfg.get("icon"), url_path=cfg["slug"])


pages = st.navigation([_make_page(cfg) for cfg in config.PAGES], position="top")
pages.run()
