"""Fuzzy search over arbitrary columns — stdlib only, swappable.

If you have your own fuzzy search implementation (or want rapidfuzz),
replace fuzzy_filter(); the renderer only depends on its signature:
(df, columns, query) -> filtered df, best matches first.
"""

import difflib

import pandas as pd

THRESHOLD = 0.45


def _score(query: str, text: str) -> float:
    text = str(text).lower()
    if not text or text == "nan":
        return 0.0
    if query in text:
        return 1.0
    best = difflib.SequenceMatcher(None, query, text).ratio()
    for token in text.replace("-", " ").replace("_", " ").split():
        best = max(best, difflib.SequenceMatcher(None, query, token).ratio())
    return best


def fuzzy_filter(df: pd.DataFrame, columns: list[str], query: str) -> pd.DataFrame:
    """Keep rows whose searched columns resemble the query, ranked best-first.

    Exact substrings always win; otherwise difflib similarity per token
    tolerates typos ("procurment" still finds Procurement).
    """
    query = query.lower().strip()
    if not query or df.empty:
        return df
    columns = [c for c in columns if c in df.columns]
    if not columns:
        return df
    scores = df[columns].astype(str).apply(
        lambda row: max(_score(query, value) for value in row), axis=1
    )
    exact = scores[scores == 1.0]
    if not exact.empty:
        return df.loc[exact.index]
    keep = scores[scores >= THRESHOLD].sort_values(ascending=False)
    return df.loc[keep.index]
