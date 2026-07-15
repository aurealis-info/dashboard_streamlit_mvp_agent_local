import { useState } from 'react'
import type { FieldDefinition, FieldType } from '../types'
import { Icon } from './Icon'

interface AddFieldModalProps { open: boolean; onClose: () => void; onAdd: (field: FieldDefinition) => void }

export function AddFieldModal({ open, onClose, onAdd }: AddFieldModalProps) {
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState('Planned, In review, Approved')
  if (!open) return null

  const save = () => {
    const clean = label.trim()
    if (!clean) return
    onAdd({ id: clean.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label: clean, type, options: type === 'enum' ? options.split(',').map((item) => item.trim()).filter(Boolean) : undefined })
    setLabel(''); setType('text'); onClose()
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="field-title">
        <header><div><span className="eyebrow">Workspace field</span><h2 id="field-title">Add a column</h2><p>Create a typed field without changing the data warehouse schema.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
        <div className="form-stack">
          <label><span>Column name</span><input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Governance decision" /></label>
          <fieldset><legend>Data type</legend><div className="type-grid">{(['text', 'number', 'date', 'boolean', 'enum'] as FieldType[]).map((item) => <button type="button" className={type === item ? 'selected' : ''} onClick={() => setType(item)} key={item}>{item === 'boolean' ? 'Yes / no' : item}</button>)}</div></fieldset>
          {type === 'enum' ? <label><span>Options <small>comma-separated</small></span><input value={options} onChange={(e) => setOptions(e.target.value)} /></label> : null}
          <div className="schema-note"><Icon name="bolt" size={16} /><span><strong>Instantly available</strong><small>Values are stored in the app-owned overlay with full history.</small></span></div>
        </div>
        <footer><button className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" onClick={save} disabled={!label.trim()}><Icon name="plus" size={16} />Add column</button></footer>
      </section>
    </div>
  )
}
