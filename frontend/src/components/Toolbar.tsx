import type { FieldDefinition } from '../types'
import { Icon } from './Icon'

interface ToolbarProps {
  search: string
  onSearch: (value: string) => void
  manager: string
  managers: string[]
  onManager: (value: string) => void
  account: string
  accounts: string[]
  onAccount: (value: string) => void
  fields: FieldDefinition[]
  onFieldVisibility: (fieldId: string, visible: boolean) => void
  onAddField: () => void
  resultCount: number
}

export function Toolbar({ search, onSearch, manager, managers, onManager, account, accounts, onAccount, fields, onFieldVisibility, onAddField, resultCount }: ToolbarProps) {
  return (
    <div className="register-toolbar">
      <label className="search-box"><Icon name="search" size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search projects, PEATS, account or manager" aria-label="Search projects" /></label>
      <label className="filter-select"><span className="sr-only">Manager</span><select value={manager} onChange={(event) => onManager(event.target.value)}><option value="All">All managers</option>{managers.map((name) => <option key={name}>{name}</option>)}</select><Icon name="down" size={13} /></label>
      <label className="filter-select"><span className="sr-only">Account</span><select value={account} onChange={(event) => onAccount(event.target.value)}><option value="All">All accounts</option>{accounts.map((name) => <option key={name}>{name}</option>)}</select><Icon name="down" size={13} /></label>
      <span className="toolbar-spacer" />
      <span className="result-count">{resultCount} {resultCount === 1 ? 'project' : 'projects'}</span>
      <details className="columns-menu">
        <summary className="icon-text-button"><Icon name="columns" size={15} />Custom fields<Icon name="down" size={12} /></summary>
        <div className="columns-popover">
          <div><strong>Portal fields</strong><small>Backed by APA_FIELD_DEFINITIONS.</small></div>
          {fields.length ? fields.filter((field) => field.active).map((field) => <label key={field.id}><input type="checkbox" checked={field.visible} onChange={(event) => onFieldVisibility(field.id, event.target.checked)} /><span>{field.label}<small>{field.type}</small></span></label>) : <p>No custom fields created.</p>}
          <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); onAddField() }}><Icon name="plus" size={14} />Create custom field</button>
        </div>
      </details>
      <button type="button" className="button secondary" onClick={onAddField}><Icon name="plus" size={15} />Add field</button>
    </div>
  )
}
