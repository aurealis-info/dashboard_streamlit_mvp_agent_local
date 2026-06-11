"""Single place that knows where the SQLite file lives.

On the work laptop, point the app at the real pipeline output:

    export DASHBOARD_DB_PATH=/path/to/your/transformed_views.db

Everything else reads through get_connection(), so swapping the database
(or later, replacing this module with a BigQuery client) touches one file.
"""

import os
import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "dashboard.db"


def db_path() -> Path:
    return Path(os.environ.get("DASHBOARD_DB_PATH", DEFAULT_DB_PATH))


def get_connection(readonly: bool = False) -> sqlite3.Connection:
    path = db_path()
    if not path.exists():
        raise FileNotFoundError(
            f"SQLite file not found at {path}. "
            "Run `python seed_data.py` for demo data, or set DASHBOARD_DB_PATH "
            "to your pipeline's transformed-views database."
        )
    if readonly:
        conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    else:
        conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn
