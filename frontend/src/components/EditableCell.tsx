import { useRef, useState } from 'react'
import type { FieldDefinition } from '../types'
import { formatDate, statusClass } from '../utils'

interface EditableCellProps {
  field: FieldDefinition
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
}

export function EditableCell({ field, value, onChange }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const cancelled = useRef(false)
  const commit = (next: string | number | boolean) => { onChange(next); setEditing(false) }
  const cancel = () => { cancelled.current = true; setEditing(false) }

  if (!editing) {
    const display = field.type === 'boolean' ? (value ? 'Yes' : 'No') : field.type === 'date' && value ? formatDate(String(value)) : String(value || '—')
    const content = field.type === 'enum' && value ? <span className={`field-chip ${statusClass(String(value))}`}>{display}</span> : display
    return <button className={`editable-cell ${field.type}`} onClick={() => setEditing(true)} title={`Edit ${field.label}`}>{content}</button>
  }

  if (field.type === 'enum' || field.type === 'boolean') {
    const options = field.type === 'boolean' ? ['true', 'false'] : field.options ?? []
    return (
      <select autoFocus className="cell-input" value={String(value)} onChange={(event) => commit(field.type === 'boolean' ? event.target.value === 'true' : event.target.value)} onBlur={() => setEditing(false)}>
        {options.map((option) => <option value={option} key={option}>{field.type === 'boolean' ? (option === 'true' ? 'Yes' : 'No') : option}</option>)}
      </select>
    )
  }

  return (
    <input
      autoFocus
      className="cell-input"
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      defaultValue={String(value)}
      onBlur={(event) => {
        if (cancelled.current) { cancelled.current = false; return }
        commit(field.type === 'number' ? Number(event.target.value) : event.target.value)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') cancel()
      }}
    />
  )
}
