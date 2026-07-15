import { Icon } from './Icon'

interface ToolbarProps {
  search: string; onSearch: (value: string) => void
  status: string; onStatus: (value: string) => void
  onAddField: () => void; resultCount: number
}

export function Toolbar({ search, onSearch, status, onStatus, onAddField, resultCount }: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-box"><Icon name="search" size={17} /><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search projects, owners or keys" aria-label="Search projects" /><kbd>⌘ K</kbd></div>
      <div className="toolbar-actions">
        <label className="filter-select"><Icon name="filter" size={15} /><span className="sr-only">Status</span><select value={status} onChange={(e) => onStatus(e.target.value)}><option value="All">All status</option><option>On track</option><option>At risk</option><option>Blocked</option><option>Complete</option></select></label>
        <span className="result-count">{resultCount} records</span>
        <button className="button secondary add-field" onClick={onAddField}><Icon name="columns" size={16} />Add column</button>
      </div>
    </div>
  )
}
