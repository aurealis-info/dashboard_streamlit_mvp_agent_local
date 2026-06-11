"""Plug-in point for business logic — empty by design.

When you're ready to add derived columns (health rules, utilization,
SLA flags...), register a function per page slug. It receives the page's
main DataFrame and returns it with extra columns; new columns automatically
appear in the table and column picker. Nothing else in the app changes.

Example:

    def project_health(df):
        today = pd.Timestamp.today().normalize()
        df["health"] = ...      # your rule, your columns
        return df

    DERIVED = {"projects": project_health}
"""

import pandas as pd  # noqa: F401  (kept for the example above)

DERIVED: dict = {}


def apply(slug: str, df):
    fn = DERIVED.get(slug)
    return fn(df) if fn else df
