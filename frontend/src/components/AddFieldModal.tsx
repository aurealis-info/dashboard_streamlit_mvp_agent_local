import { useEffect, useMemo, useState } from 'react'
import type { FieldDefinition, FieldType } from '../types'
import { normalizeFieldId } from '../utils'
import { Icon } from './Icon'

interface AddFieldModalProps {
  open: boolean
  existingFields: FieldDefinition[]
  onClose: () => void
  onAdd: (field: FieldDefinition) => void
}

const fieldTypes: { value: FieldType; label: string; hint: string }[] = [
  { value: 'text', label: 'Text', hint: 'Names and notes' },
  { value: 'number', label: 'Number', hint: 'Scores and amounts' },
  { value: 'date', label: 'Date', hint: 'Deadlines' },
  { value: 'boolean', label: 'Yes / no', hint: 'Simple decisions' },
  { value: 'enum', label: 'Select', hint: 'Controlled options' },
]

export function AddFieldModal({ open, existingFields, onClose, onAdd }: AddFieldModalProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState('Planned, In review, Approved')
  const id = normalizeFieldId(label)
  const optionList = useMemo(() => options.split(',').map((item) => item.trim()).filter(Boolean), [options])
  const duplicate = existingFields.some((field) => field.id === id)
  const invalidEnum = type === 'enum' && optionList.length < 2
  const canSave = Boolean(id) && !duplicate && !invalidEnum

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const save = () => {
    if (!canSave) return
    onAdd({ id, label: label.trim(), type, options: type === 'enum' ? optionList : undefined, visible: true, active: true })
    setLabel(''); setType('text'); setOptions('Planned, In review, Approved'); onClose()
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal field-modal" role="dialog" aria-modal="true" aria-labelledby="field-title">
        <header><div><span className="eyebrow">Workspace schema</span><h2 id="field-title">Create a field</h2><p>Add a typed column without changing the JIRA marts or running a migration.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
        <div className="form-stack">
          <label className="form-field"><span>Field name</span><input autoFocus value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Governance decision" aria-describedby="field-id-hint" />{duplicate ? <small className="field-error">A field with this identifier already exists.</small> : <small id="field-id-hint">API identifier: <code>{id || 'field_name'}</code></small>}</label>
          <fieldset><legend>Data type</legend><div className="type-grid">{fieldTypes.map((item) => <button type="button" className={type === item.value ? 'selected' : ''} onClick={() => setType(item.value)} key={item.value}><span>{item.label}</span><small>{item.hint}</small></button>)}</div></fieldset>
          {type === 'enum' ? <label className="form-field"><span>Options <small>comma-separated</small></span><input value={options} onChange={(event) => setOptions(event.target.value)} />{invalidEnum ? <small className="field-error">Add at least two options.</small> : <small>{optionList.length} options will be available.</small>}</label> : null}
          <div className="schema-note"><span className="schema-icon"><Icon name="bolt" size={16} /></span><span><strong>Ready for the overlay</strong><small>The Flask API will register this in <code>APA_FIELD_DEFINITIONS</code>; values append to <code>APA_OVERRIDES</code>.</small></span></div>
        </div>
        <footer><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" onClick={save} disabled={!canSave}><Icon name="plus" size={16} />Create field</button></footer>
      </section>
    </div>
  )
}
