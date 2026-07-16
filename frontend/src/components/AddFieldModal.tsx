import { useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { FieldDefinition, FieldType } from '../types'
import { normalizeFieldId } from '../utils'
import { Icon } from './Icon'
import { SelectMenu } from './SelectMenu'
import type { SelectMenuOption } from './SelectMenu'

interface AddFieldModalProps {
  open: boolean
  existingFields: FieldDefinition[]
  onClose: () => void
  onAdd: (field: FieldDefinition) => void
}

const fieldTypes: SelectMenuOption<FieldType>[] = [
  { value: 'text', label: 'Text', description: 'Free-form text' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'date', label: 'Date', description: 'Calendar date' },
  { value: 'boolean', label: 'Yes / no', description: 'Boolean choice' },
  { value: 'enum', label: 'Dropdown', description: 'Controlled options' },
]

export function AddFieldModal({ open, existingFields, onClose, onAdd }: AddFieldModalProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState('')
  const id = normalizeFieldId(label)
  const optionList = useMemo(() => options.split(',').map((item) => item.trim()).filter(Boolean), [options])
  const duplicate = existingFields.some((field) => field.id === id)
  const invalidEnum = type === 'enum' && optionList.length < 2
  const canSave = Boolean(id) && !duplicate && !invalidEnum
  useBodyScrollLock(open)

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
    setLabel('')
    setType('text')
    setOptions('')
    onClose()
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form className="modal field-modal" role="dialog" aria-modal="true" aria-labelledby="field-title" onSubmit={(event) => { event.preventDefault(); save() }}>
        <header>
          <div><span className="eyebrow">Project register</span><h2 id="field-title">Create editable column</h2><p>Add a workspace-owned column. JIRA source fields remain locked.</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </header>
        <div className="form-stack">
          <label className="form-field">
            <span>Column name</span>
            <input autoFocus value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Governance decision" aria-describedby="field-id-hint" />
            {duplicate ? <small className="field-error">A column with this identifier already exists.</small> : <small id="field-id-hint">Field key: <code>{id || 'column_name'}</code></small>}
          </label>
          <div className="form-field">
            <span>Data type</span>
            <SelectMenu ariaLabel="Data type" value={type} options={fieldTypes} onValueChange={setType} />
          </div>
          {type === 'enum' ? <label className="form-field">
            <span>Dropdown options <small>comma-separated</small></span>
            <input value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Option A, Option B" />
            {invalidEnum ? <small className="field-error">Add at least two options.</small> : <small>{optionList.length} options will be available.</small>}
          </label> : null}
          <div className="schema-note"><Icon name="edit" size={16} /><span><strong>Editable immediately</strong><small>Values are saved to the append-only APA workspace overlay, never to JIRA.</small></span></div>
        </div>
        <footer><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={!canSave}>Create column</button></footer>
      </form>
    </div>
  )
}
