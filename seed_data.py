"""Generate a synthetic SQLite database mirroring the real pipeline's shapes:

  projects_current         one row per project (service desk queue)
  project_relationships    linked issues per project (drill-down)
  issue_detail_current     one row per sprint issue (resource drill-down)
  assignee_sprint_current  one row per assignee + sprint (resource main)
  counts_current           categorical counts per sprint and dimension
  transform_runs           pipeline run metadata (freshness badge)

Deterministic (seeded) so the demo looks the same on every machine.
Run:  python seed_data.py
"""

import os
import random
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd

DB_PATH = Path(
    os.environ.get(
        "DASHBOARD_DB_PATH",
        Path(__file__).resolve().parent / "data" / "dashboard.db",
    )
)

rng = random.Random(42)
TODAY = date.today()

PEOPLE = [
    "Maya Chen", "Adaeze Okafor", "Ravi Patel", "Lucia Fernandez", "Tom Becker",
    "Sofia Rossi", "Daniel Kim", "Ingrid Larsen", "Omar Haddad", "Priya Nair",
]
CLIENTS = [
    "Finance Ops", "HR Systems", "Supply Chain", "Marketing Analytics",
    "Legal & Compliance", "Customer Care", "Field Services", "Treasury",
    "Procurement", "Facilities",
]
STAGES = ["Intake", "Scoping", "In progress", "Review", "Done"]
STAGE_WEIGHTS = [0.14, 0.16, 0.34, 0.12, 0.24]
PRIORITIES = ["Low", "Medium", "High", "Critical"]
PRIORITY_WEIGHTS = [0.2, 0.45, 0.27, 0.08]
STATUSES = ["To do", "In progress", "In review", "Done"]
STATUS_WEIGHTS = [0.3, 0.3, 0.12, 0.28]
STATUS_CATEGORY = {
    "To do": "To Do", "In progress": "In Progress",
    "In review": "In Progress", "Done": "Done",
}
ISSUE_TYPES = ["Story", "Task", "Bug"]
ISSUE_TYPE_WEIGHTS = [0.55, 0.3, 0.15]
LINK_TYPES = ["relates to", "blocks", "is blocked by", "child of"]
SPRINTS = ["Sprint 23", "Sprint 24", "Sprint 25"]

PROJECT_THEMES = [
    "data migration", "portal revamp", "reporting automation", "SSO rollout",
    "invoice matching", "forecast model", "ticket triage bot", "asset register",
    "onboarding workflow", "KPI dashboard", "archive cleanup", "API integration",
    "master data audit", "alerting setup", "capacity planner", "self-service forms",
]
STORY_VERBS = [
    "Build", "Refactor", "Document", "Test", "Design", "Migrate", "Validate",
    "Automate", "Review", "Deploy",
]
STORY_OBJECTS = [
    "extraction job", "staging tables", "auth flow", "summary view", "data model",
    "validation rules", "export endpoint", "scheduler config", "error handling",
    "user guide", "dashboard filters", "load script",
]


def make_projects(n: int = 46) -> pd.DataFrame:
    rows = []
    for i in range(n):
        stage = rng.choices(STAGES, STAGE_WEIGHTS)[0]
        created = TODAY - timedelta(days=rng.randint(2, 160))
        idle = rng.choices(
            [rng.randint(0, 3), rng.randint(4, 10), rng.randint(11, 30)],
            [0.55, 0.3, 0.15],
        )[0]
        updated = max(created, TODAY - timedelta(days=idle))
        due = created + timedelta(days=rng.randint(30, 150)) if rng.random() < 0.7 else None
        client = rng.choice(CLIENTS)
        rows.append({
            "issue_key": f"SD-{180 + i}",
            "summary": f"{client} {rng.choice(PROJECT_THEMES)}".capitalize(),
            "client": client,
            "stage": stage,
            "owner": rng.choice(PEOPLE) if (stage != "Intake" or rng.random() < 0.25) else None,
            "priority": rng.choices(PRIORITIES, PRIORITY_WEIGHTS)[0],
            "created_at": created.isoformat(),
            "updated_at": updated.isoformat(),
            "due_date": due.isoformat() if due else None,
        })
    return pd.DataFrame(rows)


def make_relationships(projects: pd.DataFrame) -> pd.DataFrame:
    rows = []
    counter = 100
    for key in projects["issue_key"]:
        for _ in range(rng.randint(0, 5)):
            rows.append({
                "project_key": key,
                "linked_key": f"PLC-{counter}",
                "link_type": rng.choice(LINK_TYPES),
                "linked_summary": f"{rng.choice(STORY_VERBS)} {rng.choice(STORY_OBJECTS)}",
                "linked_type": rng.choices(ISSUE_TYPES, ISSUE_TYPE_WEIGHTS)[0],
                "linked_status": rng.choices(STATUSES, STATUS_WEIGHTS)[0],
            })
            counter += 1
    return pd.DataFrame(rows)


def make_issue_detail(n: int = 170) -> pd.DataFrame:
    rows = []
    rotation = 0
    for i in range(n):
        sprint = rng.choices(SPRINTS + ["Backlog"], [0.18, 0.25, 0.32, 0.25])[0]
        if sprint in ("Sprint 23", "Sprint 24"):
            status = rng.choices(STATUSES, [0.04, 0.08, 0.08, 0.8])[0]
        elif sprint == "Sprint 25":
            status = rng.choices(STATUSES, [0.3, 0.35, 0.15, 0.2])[0]
        else:
            status = "To do"
        if sprint == "Backlog":
            assignee = rng.choice(PEOPLE) if rng.random() < 0.5 else None
        else:
            assignee = PEOPLE[rotation % len(PEOPLE)]
            rotation += 1
        created = TODAY - timedelta(days=rng.randint(1, 90))
        rows.append({
            "issue_key": f"BRD-{500 + i}",
            "summary": f"{rng.choice(STORY_VERBS)} {rng.choice(STORY_OBJECTS)}",
            "issue_type": rng.choices(ISSUE_TYPES, ISSUE_TYPE_WEIGHTS)[0],
            "status": status,
            "status_category": STATUS_CATEGORY[status],
            "priority": rng.choices(PRIORITIES, PRIORITY_WEIGHTS)[0],
            "assignee": assignee,
            "sprint": sprint,
            "story_points": rng.choice([1, 2, 3, 3, 5, 5, 8]),
            "created_at": created.isoformat(),
            "updated_at": (created + timedelta(days=rng.randint(0, 20))).isoformat(),
        })
    return pd.DataFrame(rows)


def make_assignee_sprint(issues: pd.DataFrame) -> pd.DataFrame:
    detail = issues.dropna(subset=["assignee"])
    grouped = detail.groupby(["assignee", "sprint"])
    out = grouped.agg(
        issues=("issue_key", "count"),
        points=("story_points", "sum"),
        done_issues=("status", lambda s: int((s == "Done").sum())),
    ).reset_index()
    done_pts = (
        detail[detail["status"] == "Done"]
        .groupby(["assignee", "sprint"])["story_points"].sum()
    )
    out = out.set_index(["assignee", "sprint"])
    out["done_points"] = done_pts
    out["done_points"] = out["done_points"].fillna(0).astype(int)
    out["open_issues"] = out["issues"] - out["done_issues"]
    out["open_points"] = out["points"] - out["done_points"]
    return out.reset_index()


def make_counts(issues: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for sprint, sprint_df in issues.groupby("sprint"):
        for dim in ["status", "status_category", "issue_type", "priority"]:
            for value, count in sprint_df[dim].value_counts().items():
                rows.append({
                    "sprint": sprint, "dimension": dim,
                    "value": value, "count": int(count),
                })
    return pd.DataFrame(rows)


def main() -> None:
    DB_PATH.parent.mkdir(exist_ok=True)
    DB_PATH.unlink(missing_ok=True)
    conn = sqlite3.connect(DB_PATH)

    projects = make_projects()
    relationships = make_relationships(projects)
    issues = make_issue_detail()
    assignee_sprint = make_assignee_sprint(issues)
    counts = make_counts(issues)
    runs = pd.DataFrame([
        {
            "view_name": "project_view", "run_id": 131,
            "ran_at": datetime.now().isoformat(timespec="minutes"),
            "status": "success", "rows_written": len(projects) + len(relationships),
        },
        {
            "view_name": "resource_view", "run_id": 214,
            "ran_at": datetime.now().isoformat(timespec="minutes"),
            "status": "success", "rows_written": len(issues) + len(assignee_sprint),
        },
    ])

    for name, df in {
        "projects_current": projects,
        "project_relationships": relationships,
        "issue_detail_current": issues,
        "assignee_sprint_current": assignee_sprint,
        "counts_current": counts,
        "transform_runs": runs,
    }.items():
        df.to_sql(name, conn, index=False)
        print(f"  {name}: {len(df)} rows")

    conn.close()
    print(f"Seeded {DB_PATH}")


if __name__ == "__main__":
    main()
