import { useDeferredValue, useMemo, useState } from 'react'
import { AddFieldModal } from './components/AddFieldModal'
import { Icon } from './components/Icon'
import { PortfolioPulse } from './components/PortfolioPulse'
import { ProjectCards } from './components/ProjectCards'
import { ProjectDrawer } from './components/ProjectDrawer'
import { ProjectTable } from './components/ProjectTable'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { initialFields, initialProjects } from './data'
import type { FieldDefinition, Project } from './types'
import './styles.css'

function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [fields, setFields] = useState<FieldDefinition[]>(initialFields)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fieldModal, setFieldModal] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const deferredSearch = useDeferredValue(search)

  const filteredProjects = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesStatus = status === 'All' || project.status === status
      const haystack = `${project.name} ${project.key} ${project.owner} ${project.client}`.toLowerCase()
      return matchesStatus && (!query || haystack.includes(query))
    })
  }, [deferredSearch, projects, status])

  const selectedProject = projects.find((project) => project.key === selectedKey) ?? null
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2600) }
  const changeField = (key: string, field: string, value: string | number | boolean) => {
    setProjects((current) => current.map((project) => project.key === key ? { ...project, custom: { ...project.custom, [field]: value }, updatedAt: 'Just now' } : project))
    notify('Change saved to overlay')
  }
  const addField = (field: FieldDefinition) => {
    setFields((current) => [...current, field])
    setProjects((current) => current.map((project) => ({ ...project, custom: { ...project.custom, [field.id]: field.type === 'boolean' ? false : field.type === 'number' ? 0 : field.options?.[0] ?? '' } })))
    notify(`${field.label} column added`)
  }
  const updateNotes = (key: string, notes: string) => {
    setProjects((current) => current.map((project) => project.key === key ? { ...project, notes, updatedAt: 'Just now' } : project))
    notify('Notes saved with history')
  }

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>APA workspace</span><Icon name="chevron" size={13} /><strong>Portfolio</strong></div>
          <div className="top-actions"><button className="icon-button notification" aria-label="Notifications"><Icon name="bell" /><i /></button><div className="environment"><span className="live-dot" />Demo workspace</div></div>
        </header>
        <div className="workspace">
          <section className="page-heading">
            <div><span className="eyebrow">Portfolio control</span><h1>Project operations</h1><p>One live view of delivery, decisions and the work behind them.</p></div>
            <button className="button primary"><Icon name="plus" size={17} />New request</button>
          </section>
          <PortfolioPulse projects={projects} />
          <section className="records-panel">
            <div className="records-heading"><div><h2>All projects</h2><span>Base JIRA data + managed portal fields</span></div><div className="view-switch" aria-label="View options"><button className="active">Table</button><button>Board</button></div></div>
            <Toolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} onAddField={() => setFieldModal(true)} resultCount={filteredProjects.length} />
            {filteredProjects.length ? <><ProjectTable projects={filteredProjects} fields={fields} onSelect={(project) => setSelectedKey(project.key)} onFieldChange={changeField} /><ProjectCards projects={filteredProjects} fields={fields} onSelect={(project) => setSelectedKey(project.key)} /></> : <div className="empty-state"><span><Icon name="search" /></span><h3>No projects found</h3><p>Try a different search or clear the status filter.</p><button className="button secondary" onClick={() => { setSearch(''); setStatus('All') }}>Clear filters</button></div>}
            <footer className="table-footer"><span>Showing {filteredProjects.length} of {projects.length} projects</span><span><span className="live-dot" /> Last mart refresh today at 06:42 ET</span></footer>
          </section>
        </div>
      </main>
      <ProjectDrawer project={selectedProject} onClose={() => setSelectedKey(null)} onUpdateNotes={updateNotes} />
      <AddFieldModal open={fieldModal} onClose={() => setFieldModal(false)} onAdd={addField} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status"><span><Icon name="check" size={14} /></span>{toast}</div>
    </div>
  )
}

export default App
