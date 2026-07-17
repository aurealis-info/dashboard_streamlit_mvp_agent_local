import type { FieldDefinition } from '../types'
import { Icon } from './Icon'
import { FieldColumnPicker } from './FieldColumnPicker'
import { SelectMenu } from './SelectMenu'

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
  showColumns?: boolean
}

export function Toolbar({ search, onSearch, manager, managers, onManager, account, accounts, onAccount, fields, onFieldVisibility, onAddField, showColumns = true }: ToolbarProps) {
  return (
    <div className="register-toolbar">
      <label className="search-box">
        <Icon name="search" size={16} />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search project, PEATS, account or manager" aria-label="Search projects" />
      </label>
      <SelectMenu
        ariaLabel="Filter by manager"
        value={manager}
        options={[{ value: 'All', label: 'All managers' }, ...managers.map((name) => ({ value: name, label: name }))]}
        variant="filter"
        className="filter-select"
        prefix="Manager"
        onValueChange={onManager}
      />
      <SelectMenu
        ariaLabel="Filter by account"
        value={account}
        options={[{ value: 'All', label: 'All accounts' }, ...accounts.map((name) => ({ value: name, label: name }))]}
        variant="filter"
        className="filter-select"
        prefix="Account"
        onValueChange={onAccount}
      />
      <span className="toolbar-spacer" />
      {showColumns ? <FieldColumnPicker fields={fields} description="Editable project fields stored outside JIRA." onFieldVisibility={onFieldVisibility} onAddField={onAddField} /> : null}
    </div>
  )
}
