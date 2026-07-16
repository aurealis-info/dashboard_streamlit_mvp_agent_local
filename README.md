# APA Tracker — enterprise project register

APA Tracker is a frontend-first MVP for operating the APA automation portfolio. It presents the fields already defined by the JIRA semantic marts, all eight governed milestones, linked epic/story work, and workspace-owned context in one dense project register.

The application is intentionally useful before the Flask/BigQuery service exists. Demo writes use a versioned local browser overlay, while the shared model and repository boundary follow [architecture_guide.md](architecture_guide.md).

## What is included

- A governed project register with a pinned identity column and intentional horizontal scrolling.
- Architecture-backed columns for root issue key, PEATS number, account, manager, quoted price, budget code, CP4 name, reporter, source, and development status.
- Exactly eight milestone columns: Assessment, ARP, Funding, Technical ARP, Data Eng, AA Dev, E2E Testing, and Deployment.
- Sorting, text/number filters, resizing, pagination, and column movement through AG Grid Community.
- A project drawer for source fields, linked issues, milestone updates, epic/story work, and workspace-owned fields.
- First-click milestone dropdowns plus typed spreadsheet editors for every workspace-owned grid field.
- Dynamic typed columns backed by the field-definition and EAV overlay contract.
- Search by project, issue key, PEATS number, account, manager, reporter, and linked issue.
- A responsive application shell; the operational register remains horizontally scrollable on smaller screens.
- Versioned local persistence, deterministic synthetic data, and a one-click reset.
- A typed repository contract ready for Flask `/api/v1` endpoints.

There is no invented health score, action queue, ninth lifecycle stage, or fake project-creation flow. Those concepts are not present in the current source contract.

## Run the MVP

Requirements: Node.js 22.12 or later.

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). No Python service, credentials, JIRA connection, or model download is needed for the frontend demo.

Demo state is stored under versioned `apa-tracker.*` keys in browser local storage. Use **Reset demo data** in the sidebar to restore the shipped dataset.

## Verify it

```bash
cd frontend
npm run lint
npm test
npm run build
npm audit
```

The tests cover source-identifier filtering, the locked milestone contract, dynamic field creation, direct grid dropdown editing, source-field drilldown, and manual-versus-automatic milestone editing. The production build emits static assets to `frontend/dist/`.

## Preview in Docker

The frontend includes a standalone non-root Nginx image for UI review:

```bash
docker build -t apa-tracker-ui frontend
docker run --rm -p 8080:8080 apa-tracker-ui
```

Open [http://localhost:8080](http://localhost:8080); the health endpoint is `/health`. This preview image is not the final gateway topology. When connecting the backend, use the architecture guide’s single-service pattern: build React in a Node stage, copy `frontend/dist/` into the Flask image, and serve the API and assets from the same origin.

## Field ownership

| UI data | System of record | Frontend behavior |
|---|---|---|
| Project identity and commercial/ownership fields | `T_APA_PROJECT_CURRENT` | Read only |
| Assessment status and duration | `T_APA_PROJECT_MILESTONE_CURRENT` | Read only |
| Seven manual milestone statuses/dates | `APA_OVERRIDES` overlay | Editable |
| Portal status, target date, and notes | `APA_OVERRIDES` overlay | Editable |
| Dynamic field definitions | `APA_FIELD_DEFINITIONS` | Admin-governed creation |
| Dynamic project values | `APA_OVERRIDES` EAV rows | Editable by registered type |
| Project epics and stories | `T_APA_PROJECT_EPIC_STORY_CURRENT` | Read only |

The guide does not define a separate PID field. The UI therefore exposes `ROOT_ISSUE_KEY` and `PEATS #` without relabeling either one. Add PID as a new source field only if the upstream mart contract confirms it is distinct.

## Frontend architecture

| Path | Responsibility |
|---|---|
| `frontend/src/App.tsx` | Workspace orchestration, filters, and local demo mutations |
| `frontend/src/types.ts` | Merged project, milestone, issue, work, and field contracts |
| `frontend/src/data.ts` | Deterministic architecture-shaped demo records |
| `frontend/src/services/projectRepository.ts` | Backend-facing repository interface and canonical API paths |
| `frontend/src/hooks/usePersistentState.ts` | Versioned, failure-tolerant demo persistence |
| `frontend/src/config/workspaceFieldPolicy.ts` | Organization-approved portal-status dropdown vocabulary |
| `frontend/src/components/ProjectGrid.tsx` | Enterprise project register and eight-milestone column group |
| `frontend/src/components/ProjectDrawer.tsx` | Source, milestone, work, and workspace-field detail view |
| `frontend/src/components/AddFieldModal.tsx` | Typed custom-field definition workflow |
| `frontend/src/styles.css` | Neutral design tokens, application layout, states, and breakpoints |

AG Grid Community is pinned to `35.3.1`. Only the client row model, typed cell editors, text/number filters, tooltips, and pagination modules are registered; development-only validation catches missing module declarations. The Community package is MIT-licensed and supplies the mature grid behaviors this operating view needs.

## Connect the Flask and BigQuery backend

Follow §18.1 of [architecture_guide.md](architecture_guide.md) in order:

1. Add the Flask factory, validated configuration, health route, request IDs, and verified local identity stub.
2. Implement bounded, parameterized merged project reads with freshness metadata.
3. Load field definitions and serialize values by registered type.
4. Implement append-only overrides with authenticated audit identity and version checks.
5. Implement manual milestone writes; reject Assessment updates.
6. Implement bounded epic/story reads by project key.
7. Add an HTTP implementation of `ProjectRepository`, including loading, failure, and `409` rollback UX.
8. Build the frontend in the gateway container and let Flask serve `frontend/dist/` on the same origin.
9. Run contract tests against dev BigQuery in an isolated override namespace before infrastructure changes.

Important rules:

- Never write to `JIRA_SEMANTIC` or a `*_CURRENT` mart.
- Set `updated_by`, `updated_at_utc`, and the next version on the server.
- Derive editable-field allow-lists from active field definitions and validate by registered type.
- Return `409 Conflict` for stale versions with the latest canonical value.
- Use IAP or approved enterprise SSO in production; never trust a user-supplied audit identity.

## Repository note

The repository also contains an earlier Streamlit/SQLite prototype (`app.py`, `lib/`, and `dashboard_config.py`). It remains available for reference, and the root Docker configuration still targets it. The APA Tracker MVP is the React application in `frontend/`; its standalone Docker preview is isolated there so it does not change the legacy runtime.

Demo records are synthetic and safe to commit. Real company data, credentials, model weights, dependencies, and build output remain ignored.
