import { useEffect, useState } from 'react'
import type { NewProjectInput } from '../types'
import { Icon } from './Icon'

interface NewProjectModalProps {
  open: boolean
  owners: string[]
  onClose: () => void
  onCreate: (input: NewProjectInput) => void
}

const initialForm: NewProjectInput = { name: '', client: '', owner: '', targetDate: '2026-10-30', budget: 100000, priority: 'Medium' }

export function NewProjectModal({ open, owners, onClose, onCreate }: NewProjectModalProps) {
  const [form, setForm] = useState<NewProjectInput>(initialForm)
  const selectedOwner = form.owner || owners[0] || 'Maya Chen'

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, owners])

  if (!open) return null
  const canSave = form.name.trim().length > 2 && form.client.trim().length > 1 && Boolean(selectedOwner) && Boolean(form.targetDate)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    onCreate({ ...form, owner: selectedOwner, name: form.name.trim(), client: form.client.trim() })
    setForm(initialForm)
    onClose()
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form className="modal project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" onSubmit={submit}>
        <header><div><span className="eyebrow">New initiative</span><h2 id="project-modal-title">Add to the portfolio</h2><p>Create a local working record. JIRA request creation remains outside the MVP write path.</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
        <div className="form-stack form-grid">
          <label className="form-field span-two"><span>Initiative name</span><input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Customer dispute triage" /></label>
          <label className="form-field"><span>Business area</span><input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} placeholder="Customer operations" /></label>
          <label className="form-field"><span>Program owner</span><select value={selectedOwner} onChange={(event) => setForm({ ...form, owner: event.target.value })}>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
          <label className="form-field"><span>Target date</span><input type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></label>
          <label className="form-field"><span>Committed budget</span><div className="input-prefix"><span>$</span><input type="number" min="0" step="1000" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} /></div></label>
          <label className="form-field span-two"><span>Priority</span><div className="priority-options">{['Critical', 'High', 'Medium', 'Low'].map((priority) => <button type="button" className={form.priority === priority ? 'selected' : ''} onClick={() => setForm({ ...form, priority })} key={priority}>{priority}</button>)}</div></label>
          <div className="schema-note span-two"><span className="schema-icon"><Icon name="timeline" size={16} /></span><span><strong>Starts in Assessment</strong><small>The record enters the automatic first milestone with portal status set to On track.</small></span></div>
        </div>
        <footer><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button type="submit" className="button primary" disabled={!canSave}><Icon name="plus" size={16} />Add initiative</button></footer>
      </form>
    </div>
  )
}
