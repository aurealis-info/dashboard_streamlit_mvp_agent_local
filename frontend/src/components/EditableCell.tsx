import { useState } from 'react'
import type { FieldDefinition } from '../types'

interface EditableCellProps {
  field: FieldDefinition
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
}

export function EditableCell({ field, value, onChange }: EditableCellProps) {
  const [editing, setEditing] = useState(false)
  const commit = (next: string | number | boolean) => { onChange(next); setEditing(false) }

  if (!editing) {
    const display = field.type === 'boolean' ? (value ? 'Yes' : 'No') : String(value || '—')
    return <button className="editable-cell" onClick={() => setEditing(true)} title={`Edit ${field.label}`}>{display}</button>
  }

  if (field.type === 'enum') {
    return <select autoFocus className="cell-input" value={String(value)} onChange={(e) => commit(e.target.value)} onBlur={() => setEditing(false)}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
  }
  if (field.type === 'boolean') {
    return <select autoFocus className="cell-input" value={String(value)} onChange={(e) => commit(e.target.value === 'true')} onBlur={() => setEditing(false)}><option value="true">Yes</option><option value="false">No</option></select>
  }
  return <input autoFocus className="cell-input" type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} defaultValue={String(value)} onBlur={(e) => commit(field.type === 'number' ? Number(e.target.value) : e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(false) }} />
}
