import { useMemo, useState } from 'react'
import type { FieldDefinition, ResourceIssue } from '../types'
import { statusClass } from '../utils'
import { FieldColumnPicker } from './FieldColumnPicker'
import { Icon } from './Icon'
import { SelectMenu } from './SelectMenu'

interface ResourceWorkspaceProps {
  issues: ResourceIssue[]
  fields: FieldDefinition[]
  onFieldChange: (sprintIssueKey: string, fieldId: string, value: string | number | boolean) => void
  onFieldVisibility: (fieldId: string, visible: boolean) => void
  onAddField: () => void
  onOpenProject: (projectKey: string) => void
}

interface Workload {
  assignee: string
  issues: number
  points: number
  openPoints: number
  donePoints: number
}

function workloadRows(issues: ResourceIssue[]) {
  const rows = new Map<string, Workload>()
  issues.forEach((issue) => {
    const current = rows.get(issue.assignee) ?? { assignee: issue.assignee, issues: 0, points: 0, openPoints: 0, donePoints: 0 }
    current.issues += 1
    current.points += issue.storyPoints
    if (issue.status === 'Done') current.donePoints += issue.storyPoints
    else current.openPoints += issue.storyPoints
    rows.set(issue.assignee, current)
  })
  return Array.from(rows.values()).sort((left, right) => right.openPoints - left.openPoints || left.assignee.localeCompare(right.assignee))
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function ResourceInputCell({ issue, field, onFieldChange }: { issue: ResourceIssue; field: FieldDefinition; onFieldChange: ResourceWorkspaceProps['onFieldChange'] }) {
  const stored = issue.custom[field.id]
  const [value, setValue] = useState(String(stored ?? ''))

  if (field.type === 'enum' || field.type === 'boolean') {
    const options = field.type === 'boolean' ? ['Yes', 'No'] : field.options ?? []
    const selected = field.type === 'boolean' ? (stored === true ? 'Yes' : 'No') : String(stored ?? options[0] ?? '')
    return <SelectMenu
      ariaLabel={`${field.label} for ${issue.issueKey}`}
      value={selected}
      options={options.map((option) => ({ value: option, label: option }))}
      variant="cell"
      onValueChange={(next) => onFieldChange(issue.sprintIssueKey, field.id, field.type === 'boolean' ? next === 'Yes' : next)}
    />
  }

  const commit = () => {
    const next = field.type === 'number' ? (value === '' ? 0 : Number(value)) : value
    if (typeof next === 'number' && !Number.isFinite(next)) return
    if (next !== stored) onFieldChange(issue.sprintIssueKey, field.id, next)
  }

  return <input
    className="resource-cell-input"
    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
    value={value}
    aria-label={`${field.label} for ${issue.issueKey}`}
    onChange={(event) => setValue(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
  />
}

export function ResourceWorkspace({ issues, fields, onFieldChange, onFieldVisibility, onAddField, onOpenProject }: ResourceWorkspaceProps) {
  const [sprint, setSprint] = useState(() => {
    const scheduled = Array.from(new Set(issues.map((issue) => issue.sprintName).filter((name) => name !== 'Unscheduled'))).sort()
    return scheduled[scheduled.length - 1] ?? 'All'
  })
  const [selectedAssignee, setSelectedAssignee] = useState('All')
  const [search, setSearch] = useState('')
  const sprints = useMemo(() => Array.from(new Set(issues.map((issue) => issue.sprintName))).sort(), [issues])
  const sprintIssues = useMemo(() => issues.filter((issue) => sprint === 'All' || issue.sprintName === sprint), [issues, sprint])
  const workloads = useMemo(() => workloadRows(sprintIssues), [sprintIssues])
  const activeAssignee = selectedAssignee === 'All' || workloads.some((row) => row.assignee === selectedAssignee) ? selectedAssignee : 'All'
  const visibleFields = fields.filter((field) => field.active && field.visible)
  const visibleIssues = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sprintIssues.filter((issue) => {
      if (activeAssignee !== 'All' && issue.assignee !== activeAssignee) return false
      if (!query) return true
      return `${issue.issueKey} ${issue.summary} ${issue.assignee} ${issue.sprintName} ${issue.epicKey} ${issue.epicName} ${issue.projectKey} ${issue.projectName}`.toLowerCase().includes(query)
    })
  }, [activeAssignee, search, sprintIssues])

  const totalOpenPoints = workloads.reduce((sum, row) => sum + row.openPoints, 0)

  return (
    <div className="resource-workspace">
      <div className="resource-toolbar">
        <SelectMenu
          ariaLabel="Filter resources by sprint"
          value={sprint}
          options={[{ value: 'All', label: 'All sprints' }, ...sprints.map((name) => ({ value: name, label: name }))]}
          variant="filter"
          className="filter-select"
          prefix="Sprint"
          onValueChange={setSprint}
        />
        <label className="search-box resource-search"><Icon name="search" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issue, assignee, epic or project" aria-label="Search resource issues" /></label>
        <span className="toolbar-spacer" />
        <FieldColumnPicker fields={fields} description="Editable resource fields stored outside JIRA." onFieldVisibility={onFieldVisibility} onAddField={onAddField} />
      </div>

      <div className="resource-master-detail">
        <aside className="resource-roster" aria-label="Assignee workload">
          <header><div><strong>Assignee workload</strong><span>{sprintIssues.length} issues · {totalOpenPoints} open points</span></div></header>
          <button type="button" className={activeAssignee === 'All' ? 'active' : ''} onClick={() => setSelectedAssignee('All')}>
            <span className="avatar"><Icon name="users" size={13} /></span>
            <span><strong>All assignees</strong><small>{workloads.length} people</small></span>
            <em>{sprintIssues.length}</em>
          </button>
          {workloads.map((row) => <button type="button" key={row.assignee} className={activeAssignee === row.assignee ? 'active' : ''} onClick={() => setSelectedAssignee(row.assignee)}>
            <span className="avatar">{initials(row.assignee)}</span>
            <span><strong>{row.assignee}</strong><small>{row.openPoints} open · {row.donePoints} done points</small></span>
            <em>{row.issues}</em>
          </button>)}
        </aside>

        <section className="resource-issues" aria-labelledby="resource-issues-title">
          <header className="resource-issues-heading"><div><h2 id="resource-issues-title">{activeAssignee === 'All' ? 'Resource issues' : activeAssignee}</h2><span>{visibleIssues.length} {visibleIssues.length === 1 ? 'issue' : 'issues'} · JIRA source with workspace columns</span></div></header>
          <div className="resource-table-scroll">
            <table className="resource-table" style={{ minWidth: 1030 + (visibleFields.length * 170) }}>
              <thead><tr><th>Issue</th><th>Status</th><th>Sprint</th><th>Points</th><th>Epic</th><th>Project</th>{visibleFields.map((field) => <th className="editable" key={field.id}>{field.label}<small>Workspace</small></th>)}</tr></thead>
              <tbody>
                {visibleIssues.map((issue) => <tr key={issue.sprintIssueKey}>
                  <td><button type="button" className="resource-issue-link" onClick={() => onOpenProject(issue.projectKey)}><strong>{issue.summary}</strong><small><code>{issue.issueKey}</code> · {issue.assignee}</small></button></td>
                  <td><span className={`resource-status ${statusClass(issue.status)}`}>{issue.status}</span></td>
                  <td>{issue.sprintName}</td>
                  <td className="number">{issue.storyPoints}</td>
                  <td><span className="resource-relation"><code>{issue.epicKey}</code><small>{issue.epicName}</small></span></td>
                  <td><button type="button" className="resource-project-link" onClick={() => onOpenProject(issue.projectKey)}><code>{issue.projectKey}</code><span>{issue.projectName}</span></button></td>
                  {visibleFields.map((field) => <td className="editable-cell" key={field.id}><ResourceInputCell key={`${field.id}:${String(issue.custom[field.id] ?? '')}`} issue={issue} field={field} onFieldChange={onFieldChange} /></td>)}
                </tr>)}
              </tbody>
            </table>
            {!visibleIssues.length ? <div className="resource-empty">No resource issues match this selection.</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
