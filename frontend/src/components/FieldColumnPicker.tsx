import { useEffect, useRef, useState } from 'react'
import type { FieldDefinition } from '../types'
import { Icon } from './Icon'

interface FieldColumnPickerProps {
  fields: FieldDefinition[]
  description: string
  onFieldVisibility: (fieldId: string, visible: boolean) => void
  onAddField: () => void
}

export function FieldColumnPicker({ fields, description, onFieldVisibility, onAddField }: FieldColumnPickerProps) {
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="column-picker" ref={pickerRef}>
      <button type="button" className="button secondary" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Icon name="columns" size={15} />Columns<Icon name="down" size={12} />
      </button>
      {open ? <div className="column-picker-popover" role="dialog" aria-label="Workspace columns">
        <header><div><strong>Workspace columns</strong><small>{description}</small></div></header>
        <div className="column-picker-list">
          {fields.length ? fields.filter((field) => field.active).map((field) => (
            <label key={field.id}>
              <input type="checkbox" checked={field.visible} onChange={(event) => onFieldVisibility(field.id, event.target.checked)} />
              <span>{field.label}<small>{field.type}</small></span>
            </label>
          )) : <p>No custom columns yet.</p>}
        </div>
        <button className="column-picker-action" type="button" onClick={() => { setOpen(false); onAddField() }}>
          <Icon name="plus" size={14} />Create editable column
        </button>
      </div> : null}
    </div>
  )
}
