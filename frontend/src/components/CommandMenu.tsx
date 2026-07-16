import { useEffect, useMemo, useState } from 'react'
import type { Project, ViewMode } from '../types'
import { statusClass } from '../utils'
import { Icon } from './Icon'

interface CommandMenuProps {
  open: boolean
  projects: Project[]
  onClose: () => void
  onSelect: (project: Project) => void
  onNewProject: () => void
  onAddField: () => void
  onView: (view: ViewMode) => void
}

export function CommandMenu({ open, projects, onClose, onSelect, onNewProject, onAddField, onView }: CommandMenuProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return projects.slice(0, 4)
    return projects.filter((project) => `${project.name} ${project.key} ${project.client} ${project.owner}`.toLowerCase().includes(clean)).slice(0, 6)
  }, [projects, query])

  const close = () => { setQuery(''); onClose() }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setQuery(''); onClose() } }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  const run = (action: () => void) => { action(); close() }

  return (
    <div className="command-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <section className="command-menu" role="dialog" aria-modal="true" aria-label="Quick find">
        <label className="command-search"><Icon name="search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a project or run an action…" /><kbd>esc</kbd></label>
        {!query ? <div className="command-actions"><span className="command-label">Quick actions</span><div><button onClick={() => run(onNewProject)}><span><Icon name="plus" /></span><strong>New initiative</strong><small>N</small></button><button onClick={() => run(onAddField)}><span><Icon name="columns" /></span><strong>Create field</strong><small>F</small></button><button onClick={() => run(() => onView('board'))}><span><Icon name="board" /></span><strong>Open lifecycle</strong><small>B</small></button></div></div> : null}
        <div className="command-results"><span className="command-label">{query ? 'Matching records' : 'Recently viewed'}</span>{results.length ? results.map((project) => <button key={project.key} onClick={() => run(() => onSelect(project))}><span className={`project-signal ${statusClass(project.status)}`} /><span><strong>{project.name}</strong><small><code>{project.key}</code> · {project.client} · {project.owner}</small></span><span className={`status-pill ${statusClass(project.status)}`}><i />{project.status}</span><Icon name="arrow" size={15} /></button>) : <div className="command-empty"><Icon name="search" /><strong>No matching records</strong><small>Try a project key, business area, or owner.</small></div>}</div>
        <footer><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span>JIRA marts + portal overlay</span></footer>
      </section>
    </div>
  )
}
