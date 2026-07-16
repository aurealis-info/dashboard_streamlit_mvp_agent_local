import { useEffect, useRef, useState } from 'react'
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
  const [columnsOpen, setColumnsOpen] = useState(false)
  const columnsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!columnsOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!columnsRef.current?.contains(event.target as Node)) setColumnsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setColumnsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [columnsOpen])

  return (
    <div className="register-toolbar">
      <label className="search-box">
        <Icon name="search" size={16} />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search project, PEATS, account or manager" aria-label="Search projects" />
      </label>
      <label className="filter-select">
        <span>Manager</span>
        <select value={manager} onChange={(event) => onManager(event.target.value)}><option value="All">All managers</option>{managers.map((name) => <option key={name}>{name}</option>)}</select>
        <Icon name="down" size={13} />
      </label>
      <label className="filter-select">
        <span>Account</span>
        <select value={account} onChange={(event) => onAccount(event.target.value)}><option value="All">All accounts</option>{accounts.map((name) => <option key={name}>{name}</option>)}</select>
        <Icon name="down" size={13} />
      </label>
      <span className="toolbar-spacer" />
      <span className="result-count">{resultCount} {resultCount === 1 ? 'project' : 'projects'}</span>
      <div className="column-picker" ref={columnsRef}>
        <button type="button" className="button secondary" aria-haspopup="dialog" aria-expanded={columnsOpen} onClick={() => setColumnsOpen((current) => !current)}>
          <Icon name="columns" size={15} />Columns<Icon name="down" size={12} />
        </button>
        {columnsOpen ? <div className="column-picker-popover" role="dialog" aria-label="Workspace columns">
          <header><div><strong>Workspace columns</strong><small>Editable fields stored outside JIRA.</small></div></header>
          <div className="column-picker-list">
            {fields.length ? fields.filter((field) => field.active).map((field) => (
              <label key={field.id}>
                <input type="checkbox" checked={field.visible} onChange={(event) => onFieldVisibility(field.id, event.target.checked)} />
                <span>{field.label}<small>{field.type}</small></span>
              </label>
            )) : <p>No custom columns yet.</p>}
          </div>
          <button className="column-picker-action" type="button" onClick={() => { setColumnsOpen(false); onAddField() }}>
            <Icon name="plus" size={14} />Create editable column
          </button>
        </div> : null}
      </div>
    </div>
  )
}
