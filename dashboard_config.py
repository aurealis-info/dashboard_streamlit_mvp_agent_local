"""THE file to edit when plugging in real data. Everything here is declarative.

A page needs: a main table, a key column, and (optionally) a drill-down join,
KPIs, filters, and charts. The renderer never assumes specific column names —
it adapts to whatever columns the tables contain.

To point at the real pipeline database: set DASHBOARD_DB_PATH and replace the
table/column names below with the real ones. No other file needs editing.

KPI metric mini-language:  "count" | "sum:col" | "mean:col" | "nunique:col"
Optional "where" on KPIs/charts: a pandas query string. Use @scope to refer
to the page's scope picker value (e.g. the selected sprint).
"""

PAGES = [
    {
        "name": "Projects",
        "slug": "projects",
        "icon": ":material/view_kanban:",
        "table": "projects_current",
        "key": "issue_key",                      # column identifying a row
        "title_column": "summary",               # used in the detail header
        "search": ["issue_key", "summary"],      # free-text search targets
        "filters": "auto",                       # or a list of column names
        "default_columns": [
            "issue_key", "summary", "stage", "owner", "client",
            "priority", "created_at", "due_date",
        ],
        "kpis": [
            {"label": "Projects", "metric": "count"},
            {"label": "Clients", "metric": "nunique:client"},
            {"label": "In progress", "metric": "count", "where": "stage == 'In progress'", "tone": "accent"},
            {"label": "Done", "metric": "count", "where": "stage == 'Done'", "tone": "good"},
        ],
        "detail": {
            "title": "Linked issues",
            "table": "project_relationships",
            "join_on": {"project_key": "issue_key"},   # detail column: main column
            "default_columns": ["linked_key", "link_type", "linked_summary", "linked_type", "linked_status"],
        },
    },
    {
        "name": "Resources",
        "slug": "resources",
        "icon": ":material/groups:",
        "table": "assignee_sprint_current",
        "key": "assignee",
        "title_column": "assignee",
        "scope": {"column": "sprint", "label": "Sprint"},   # page-level picker
        "search": ["assignee"],
        "filters": "auto",
        "kpis": [
            {"label": "Assignees", "metric": "nunique:assignee"},
            {"label": "Issues", "metric": "sum:issues"},
            {"label": "Open points", "metric": "sum:open_points", "tone": "accent"},
            {"label": "Done points", "metric": "sum:done_points", "tone": "good"},
        ],
        "detail": {
            "title": "Issues for this person",
            "table": "issue_detail_current",
            "join_on": {"assignee": "assignee", "sprint": "@scope"},
            "default_columns": ["issue_key", "summary", "issue_type", "status", "priority", "story_points"],
        },
        "show_assign_stub": True,   # experimental: shows a disabled Assign button
    },
]

# Table whose rows describe pipeline runs; shown as a freshness badge in the
# sidebar. Expected columns: view_name, ran_at, status (extra columns ignored).
FRESHNESS_TABLE = "transform_runs"

# One-line hints fed to the AI assistant's schema context. Add one per table
# when you plug in real data — they steer the model to the right table.
TABLE_DESCRIPTIONS = {
    "projects_current": "one row per project; the main project list",
    "project_relationships": "issues linked to each project (join project_key)",
    "issue_detail_current": "one row per board issue; raw detail",
    "assignee_sprint_current": (
        "PRE-AGGREGATED per assignee+sprint: issues, points, open_points, "
        "done_points. Use this for workload/utilization questions"
    ),
    "counts_current": "pre-counted rows per sprint/dimension/value",
    "transform_runs": "pipeline run metadata (freshness)",
}

# Columns rendered as colored pills wherever they appear (presentation only).
PILL_COLUMNS = [
    "stage", "status", "status_category", "priority",
    "linked_status", "link_type", "issue_type", "health",
]

# Optional fixed colors for specific values: (background, text).
# Values not listed get a stable auto-assigned color.
PILL_OVERRIDES = {
    "Done": ("#DDF8EC", "#007A4D"),
    "In progress": ("#FFF0DD", "#B26B00"),
    "To do": ("#ECEDF5", "#50545E"),
    "Critical": ("#FCE3E7", "#C0294B"),
}

APP_TITLE = "work.management"
