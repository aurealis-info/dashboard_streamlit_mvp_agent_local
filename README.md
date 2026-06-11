# Work management dashboard

A config-driven Streamlit dashboard for Jira pipeline data. Pages, tables,
drill-downs, KPIs, filters and charts are all declared in
**`dashboard_config.py`** — plugging in new data means describing it there,
not writing UI code.

## Quick start (macOS / Linux)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed_data.py              # creates data/dashboard.db with demo data
streamlit run app.py
```

## Quick start (Windows, no Docker)

Works on a corporate laptop without virtualization or admin-heavy tooling.
Needs Python 3.11 or 3.12 from [python.org](https://www.python.org/downloads/)
(tick **"Add python.exe to PATH"** in the installer).

In PowerShell, from the project folder:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_data.py
streamlit run app.py             # opens http://localhost:8501
```

If `Activate.ps1` is blocked by execution policy, either run
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use
`.venv\Scripts\activate.bat` from `cmd` instead.

**If `llama-cpp-python` fails to install** (it compiles C++ by default and
corporate laptops rarely have Visual Studio Build Tools), install the
prebuilt CPU wheel instead — no compiler needed:

```powershell
pip install llama-cpp-python --prefer-binary `
  --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

Worst case, skip it entirely: the dashboard runs fully without it, with AI
features in labeled demo mode.

**Getting the model file without a working scripted download:** open
<https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF/resolve/main/gemma-3-4b-it-Q4_K_M.gguf>
in the browser, save it, and drop it into the `models\` folder. That's all
`download_model.py` does. Any `*.gguf` file in `models\` is picked up
automatically — the largest file wins, `GGUF_MODEL_PATH` overrides. On a
weak laptop, `python download_model.py small` fetches Gemma 3 **1B**
(~0.8 GB) — several times faster, lower answer quality.

### Corporate proxy notes

- `pip` honors the standard env vars: `$env:HTTPS_PROXY = "http://proxy:port"`.
  If the proxy intercepts SSL, add
  `--trusted-host pypi.org --trusted-host files.pythonhosted.org`.
- `download_model.py` also honors `HTTPS_PROXY`; the browser route above is
  the fallback that always works.
- The Figtree font loads from Google Fonts when allowed and silently falls
  back to Segoe UI when blocked — no action needed.
- Expect the first AI answer after startup to take ~30–60 s on laptop CPU
  while the model loads into memory; warm it up with one question before
  presenting.

## Pointing at real pipeline data

1. `export DASHBOARD_DB_PATH=/path/to/transformed_views.db`
2. Edit `dashboard_config.py`: set each page's `table`, `key`, and the
   `detail.join_on` mapping to your real table/column names.

That's it — tables, the column picker, filters and formatting adapt to
whatever columns the tables contain. Conventions the shell relies on:

- Columns ending `_at` / `_date` are parsed as dates.
- `filters: "auto"` builds dropdowns from low-cardinality text columns.
- Columns in `PILL_COLUMNS` render as colored pills (stable auto colors,
  fixed overrides in `PILL_OVERRIDES`).
- A drill-down is any table reachable by equality join from the selected
  row (`join_on: {detail_col: main_col}`; use `"@scope"` to join on the
  page's scope picker, e.g. the selected sprint).
- `FRESHNESS_TABLE` (run metadata) powers the sidebar freshness badges.

## Architecture

| File | Role |
|---|---|
| `dashboard_config.py` | THE file you edit — pages, tables, joins, KPIs, charts |
| `lib/render.py` | generic page renderer (never assumes column names) |
| `lib/tables.py` | dynamic tables: picker, auto-format, auto pills, row select |
| `lib/queries.py` | generic `load_table()` with allowlist + date convention |
| `lib/derived.py` | empty plug-in registry for future business logic (health rules, utilization) |
| `lib/agent.py` | AI panel: pandas-powered demo summary; `answer()` is the LLM integration point |
| `lib/db.py` | SQLite location (`DASHBOARD_DB_PATH`); swap for BigQuery later |
| `seed_data.py` | deterministic demo data mirroring the real pipeline's table shapes |

## AI assistant (fully local, in-process)

The model runs **inside the app process** via `llama-cpp-python` reading one
GGUF weights file — no server, no daemon, no open port, nothing leaves the
machine. Default model: **Google Gemma 3 4B instruct** (Q4_K_M, ~2.5 GB).

```bash
python download_model.py        # fetch Gemma 3 4B into ./models/
streamlit run app.py            # assistant activates automatically
```

Any `*.gguf` in `./models/` works (first one found), or set
`GGUF_MODEL_PATH`. A bigger model (e.g. Gemma 3 12B) improves SQL quality
with zero code changes. Without a model everything degrades to clearly
labeled pandas templates.

Surfaces:

- **Assistant page** — chat where the agent answers by running read-only SQL
  against the dashboard tables, showing every query and its result before the
  answer. Safety is structural: read-only connection (`mode=ro`), single
  SELECT statements only, max 3 queries per question, and the final answer is
  regenerated from *only* the query results to prevent invented numbers.
- **Generate briefing** — in any drill-down panel: narrative summary of the
  selected row and its linked rows.
- **Summarize current view** — per page, grounded in the filtered table.

Steering the agent when you plug in real data: add one-line table hints in
`TABLE_DESCRIPTIONS` (dashboard_config.py) — they're injected into the
agent's schema context along with each text column's distinct values.

## Docker

```bash
python download_model.py        # once — weights stay outside the image
docker compose up --build       # http://localhost:8501
```

The image contains code only; `./models` (weights) and `./data` (SQLite) are
volume mounts, so the same image moves from laptop to server unchanged. With
no database mounted the container seeds demo data; mount the real pipeline
file at `/data` to go live. Healthcheck included for orchestrators.

## Roadmap hooks already in place

- **Business logic** (health, utilization): register a function in
  `lib/derived.py` — new columns appear in tables automatically.
- **Assign action**: `show_assign_stub: True` on a page shows the disabled
  button where write-back will live.

## Notes

- The model runs on CPU by default (stable everywhere, matches corporate
  laptops). On capable machines, `GGUF_GPU_LAYERS=-1` enables GPU offload —
  faster, but exposed to a known llama.cpp Metal teardown bug.

- `data/`, `*.db` and secrets are gitignored — never commit company data.
- Queries cache for 5 minutes; sidebar "Refresh data" clears the cache.
- Streamlit gotcha: edits to `lib/*.py` need a server restart (page scripts
  hot-reload, imported modules don't).
