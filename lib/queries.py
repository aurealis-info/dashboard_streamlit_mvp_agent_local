"""Generic data access. No table-specific SQL anywhere.

Every dashboard surface loads its table with load_table(name). Table names
come from dashboard_config.py and are validated against an allowlist built
from that config (avoids SQL injection via config typos).

Convention: columns ending in `_at` or `_date` are parsed as datetimes.
"""

import pandas as pd
import streamlit as st

import dashboard_config as config
from lib.db import get_connection

# Surfaced to the AI agent's prompt. When this module is reimplemented for
# BigQuery, set it to "BigQuery Standard SQL" and the agent follows.
SQL_DIALECT = "SQLite"


def _allowed_tables() -> set[str]:
    names = {config.FRESHNESS_TABLE}
    for page in config.PAGES:
        names.add(page["table"])
        if detail := page.get("detail"):
            names.add(detail["table"])
        for chart in page.get("charts", []):
            names.add(chart["table"])
    return names


@st.cache_data(ttl=300)
def schema_description() -> str:
    """Plain-text schema of every dashboard table — context for the AI agent.

    Low-cardinality text columns also list their distinct values: a local
    model can't guess that the sprint column holds 'Sprint 25' rather than
    '25', so we show it.
    """
    lines = []
    with get_connection(readonly=True) as conn:
        for name in sorted(_allowed_tables()):
            cols = conn.execute(f'PRAGMA table_info("{name}")').fetchall()
            col_list = ", ".join(f"{c['name']} {c['type'] or 'TEXT'}" for c in cols)
            lines.append(f"CREATE TABLE {name} ({col_list});")
            if hint := getattr(config, "TABLE_DESCRIPTIONS", {}).get(name):
                lines.append(f"-- {name}: {hint}")
            for col in cols:
                if (col["type"] or "TEXT").upper() != "TEXT":
                    continue
                values = conn.execute(
                    f'SELECT DISTINCT "{col["name"]}" FROM "{name}" '
                    f'WHERE "{col["name"]}" IS NOT NULL LIMIT 13'
                ).fetchall()
                if 1 < len(values) <= 12:
                    sample = ", ".join(f"'{v[0]}'" for v in values)
                    lines.append(f"-- {name}.{col['name']} values: {sample}")
    return "\n".join(lines)


def run_select(sql: str) -> pd.DataFrame:
    """Execute agent-generated SQL: single SELECT statement, read-only."""
    cleaned = sql.strip().rstrip(";").strip()
    if ";" in cleaned:
        raise ValueError("Only a single SQL statement is allowed.")
    if not cleaned.lower().startswith(("select", "with")):
        raise ValueError("Only SELECT queries are allowed.")
    with get_connection(readonly=True) as conn:
        return pd.read_sql_query(cleaned, conn)


@st.cache_data(ttl=300)
def load_table(name: str) -> pd.DataFrame:
    if name not in _allowed_tables():
        raise ValueError(f"Table '{name}' is not declared in dashboard_config.py")
    with get_connection() as conn:
        df = pd.read_sql_query(f'SELECT * FROM "{name}"', conn)
    for col in df.columns:
        if col.endswith(("_at", "_date")):
            df[col] = pd.to_datetime(df[col], errors="coerce")
    return df
