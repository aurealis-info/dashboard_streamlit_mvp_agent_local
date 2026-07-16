import { useEffect, useMemo, useState } from 'react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { Project } from '../types'
import { Icon } from './Icon'

interface CommandMenuProps {
  open: boolean
  projects: Project[]
  onClose: () => void
  onSelect: (project: Project) => void
}

export function CommandMenu({ open, projects, onClose, onSelect }: CommandMenuProps) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const clean = query.trim().toLowerCase()
    const candidates = clean ? projects.filter((project) => `${project.name} ${project.key} ${project.peatsNumber} ${project.account} ${project.manager}`.toLowerCase().includes(clean)) : projects
    return candidates.slice(0, 7)
  }, [projects, query])
  const close = () => { setQuery(''); onClose() }
  useBodyScrollLock(open)

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
      <section className="command-menu" role="dialog" aria-modal="true" aria-label="Find a project">
        <label className="command-search"><Icon name="search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) { event.preventDefault(); run(() => onSelect(results[0])) } }} placeholder="Search project, issue key, PEATS, account or manager" /><kbd>esc</kbd></label>
        <div className="command-results"><span className="command-label">{query ? 'Matching projects' : 'Projects'}</span>{results.length ? results.map((project) => <button key={project.key} onClick={() => run(() => onSelect(project))}><span><strong>{project.name}</strong><small><code>{project.key}</code> · {project.peatsNumber} · {project.account}</small></span><span>{project.manager}</span><Icon name="arrow" size={15} /></button>) : <div className="command-empty"><Icon name="search" /><strong>No matching projects</strong><small>Try an issue key, PEATS number, account, or manager.</small></div>}</div>
        <footer><span>Enter to open a project</span><span>Esc to close</span></footer>
      </section>
    </div>
  )
}
