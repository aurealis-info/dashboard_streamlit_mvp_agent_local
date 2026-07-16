import type { DevelopmentStage, FieldDefinition, ProjectStatus, ViewMode } from '../types'
import { Icon } from './Icon'

interface ToolbarProps {
  search: string
  onSearch: (value: string) => void
  status: ProjectStatus | 'All'
  onStatus: (value: ProjectStatus | 'All') => void
  owner: string
  owners: string[]
  onOwner: (value: string) => void
  focusOnly: boolean
  onFocusOnly: (value: boolean) => void
  onAddField: () => void
  resultCount: number
  view: ViewMode
  onView: (view: ViewMode) => void
  fields: FieldDefinition[]
  onFieldVisibility: (fieldId: string, visible: boolean) => void
  stage: DevelopmentStage | 'All'
  onClearStage: () => void
}

export function Toolbar({ search, onSearch, status, onStatus, owner, owners, onOwner, focusOnly, onFocusOnly, onAddField, resultCount, view, onView, fields, onFieldVisibility, stage, onClearStage }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-primary">
        {stage !== 'All' ? <button type="button" className="active-filter" onClick={onClearStage}><Icon name="timeline" size={14} />{stage}<Icon name="close" size={13} /></button> : null}
        <label className="search-box"><Icon name="search" size={17} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search projects, owners or keys" aria-label="Search projects" /><kbd>⌘K</kbd></label>
        <label className="filter-select"><span className="sr-only">Health status</span><select value={status} onChange={(event) => onStatus(event.target.value as ProjectStatus | 'All')}><option value="All">All health</option><option>On track</option><option>At risk</option><option>Blocked</option><option>Complete</option></select><Icon name="down" size={13} /></label>
        <label className="filter-select owner-filter"><span className="sr-only">Owner</span><select value={owner} onChange={(event) => onOwner(event.target.value)}><option value="All">All owners</option>{owners.map((name) => <option key={name}>{name}</option>)}</select><Icon name="down" size={13} /></label>
        <button type="button" className={`focus-filter ${focusOnly ? 'active' : ''}`} aria-pressed={focusOnly} onClick={() => onFocusOnly(!focusOnly)}><Icon name="sparkle" size={15} />Needs attention</button>
      </div>
      <div className="toolbar-secondary">
        <span className="result-count">{resultCount} {resultCount === 1 ? 'record' : 'records'}</span>
        <details className="columns-menu">
          <summary className="icon-text-button"><Icon name="columns" size={16} />Fields<Icon name="down" size={12} /></summary>
          <div className="columns-popover">
            <div><strong>Visible fields</strong><small>Workspace columns are saved locally.</small></div>
            {fields.filter((field) => field.active).map((field) => (
              <label key={field.id}><input type="checkbox" checked={field.visible} onChange={(event) => onFieldVisibility(field.id, event.target.checked)} /><span>{field.label}<small>{field.type}</small></span></label>
            ))}
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onAddField() }}><Icon name="plus" size={15} />Create workspace field</button>
          </div>
        </details>
        <div className="view-switch" role="group" aria-label="Portfolio view">
          <button type="button" className={view === 'table' ? 'active' : ''} aria-label="Table view" aria-pressed={view === 'table'} onClick={() => onView('table')}><Icon name="table" size={15} /><span>Table</span></button>
          <button type="button" className={view === 'board' ? 'active' : ''} aria-label="Board view" aria-pressed={view === 'board'} onClick={() => onView('board')}><Icon name="board" size={15} /><span>Board</span></button>
        </div>
      </div>
    </div>
  )
}
