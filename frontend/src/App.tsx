import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AddFieldModal } from './components/AddFieldModal'
import { CommandMenu } from './components/CommandMenu'
import { Icon } from './components/Icon'
import { ProjectDrawer } from './components/ProjectDrawer'
import { ProjectGrid } from './components/ProjectGrid'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { initialFields, initialProjects } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import type { FieldDefinition, ManualMilestoneName, MilestoneUpdate, Project, ProjectUpdate } from './types'
import { createDefaultValue } from './utils'
import './styles.css'

function App() {
  const [projects, setProjects] = usePersistentState<Project[]>('apa-tracker.projects', initialProjects)
  const [fields, setFields] = usePersistentState<FieldDefinition[]>('apa-tracker.fields', initialFields)
  const [search, setSearch] = useState('')
  const [manager, setManager] = useState('All')
  const [account, setAccount] = useState('All')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fieldModal, setFieldModal] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('command')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const deferredSearch = useDeferredValue(search)

  const managers = useMemo(() => Array.from(new Set(projects.map((project) => project.manager))).sort(), [projects])
  const accounts = useMemo(() => Array.from(new Set(projects.map((project) => project.account))).sort(), [projects])
  const visibleFields = useMemo(() => fields.filter((field) => field.active && field.visible), [fields])
  const filteredProjects = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return projects.filter((project) => {
      if (manager !== 'All' && project.manager !== manager) return false
      if (account !== 'All' && project.account !== account) return false
      if (!query) return true
      const linkedIssues = project.linkedIssues.map((issue) => `${issue.key} ${issue.summary}`).join(' ')
      const customValues = Object.values(project.custom).join(' ')
      return `${project.name} ${project.key} ${project.peatsNumber} ${project.account} ${project.manager} ${project.reporter} ${project.budgetCode} ${project.cp4Name} ${project.developmentStatus} ${linkedIssues} ${customValues}`.toLowerCase().includes(query)
    })
  }, [account, deferredSearch, manager, projects])
  const selectedProject = projects.find((project) => project.key === selectedKey) ?? null

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current) }, [])
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true) }
      if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); setCommandOpen(true) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const changeField = (key: string, fieldId: string, value: string | number | boolean) => {
    setProjects((current) => current.map((project) => project.key === key ? { ...project, custom: { ...project.custom, [fieldId]: value }, updatedAt: 'Just now' } : project))
    notify('Portal field saved in the demo overlay')
  }

  const addField = (field: FieldDefinition) => {
    setFields((current) => [...current, field])
    setProjects((current) => current.map((project) => ({ ...project, custom: { ...project.custom, [field.id]: createDefaultValue(field) } })))
    notify(`${field.label} added to the project register`)
  }

  const setFieldVisibility = (fieldId: string, visible: boolean) => {
    setFields((current) => current.map((field) => field.id === fieldId ? { ...field, visible } : field))
  }

  const updateProject = (key: string, update: ProjectUpdate) => {
    setProjects((current) => current.map((project) => project.key === key ? { ...project, ...update, updatedAt: 'Just now' } : project))
    notify('Portal-owned project fields saved')
  }

  const updateMilestone = (key: string, milestoneName: ManualMilestoneName, update: MilestoneUpdate) => {
    setProjects((current) => current.map((project) => project.key === key ? {
      ...project,
      milestones: project.milestones.map((milestone) => milestone.name === milestoneName ? { ...milestone, ...update } : milestone),
      updatedAt: 'Just now',
    } : project))
    notify(`${milestoneName} updated in the demo overlay`)
  }

  const navigate = (destination: string) => {
    if (destination === 'fields') { setFieldModal(true); return }
    if (destination === 'resources') { notify('Resource records connect through T_APA_RESOURCE_ISSUE_CURRENT in the backend phase'); return }
    setActiveNav(destination)
    document.querySelector('.records-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearFilters = () => { setSearch(''); setManager('All'); setAccount('All') }
  const resetDemo = () => {
    if (!window.confirm('Reset local project edits and custom fields?')) return
    setProjects(initialProjects); setFields(initialFields); clearFilters(); setSelectedKey(null); notify('Demo project register restored')
  }

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} active={activeNav} projectCount={projects.length} onClose={() => setNavOpen(false)} onNavigate={navigate} onOpenCommand={() => setCommandOpen(true)} onReset={resetDemo} />
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>APA Tracker</span><Icon name="chevron" size={12} /><strong>Command center</strong></div>
          <div className="top-actions"><button className="top-search" type="button" onClick={() => setCommandOpen(true)}><Icon name="search" size={15} />Find a project<kbd>⌘K</kbd></button><span className="environment"><span className="live-dot" />Demo data</span></div>
        </header>
        <div className="workspace">
          <section className="page-heading" aria-labelledby="page-title">
            <div><span className="section-kicker">APA project register</span><h1 id="page-title">Project command center</h1><p>Review JIRA project fields, all eight milestone states, linked work, and portal-owned context in one working view.</p></div>
            <button className="button primary" type="button" onClick={() => setFieldModal(true)}><Icon name="plus" size={15} />Add custom field</button>
          </section>
          <section className="source-bar" aria-label="Project data sources"><span><strong>{projects.length}</strong> projects</span><span><strong>Base</strong> JIRA semantic marts</span><span><strong>Milestones</strong> 1 JIRA-derived · 7 portal-managed</span><span><strong>Refresh</strong> Daily snapshot</span></section>
          <section className="records-panel" aria-labelledby="projects-title">
            <header className="records-heading"><div><h2 id="projects-title">Projects</h2><p>Sort, filter, resize, and horizontally scroll through the complete project record.</p></div><span className="read-only-label">Base fields are read only</span></header>
            <Toolbar search={search} onSearch={setSearch} manager={manager} managers={managers} onManager={setManager} account={account} accounts={accounts} onAccount={setAccount} fields={fields} onFieldVisibility={setFieldVisibility} onAddField={() => setFieldModal(true)} resultCount={filteredProjects.length} />
            {filteredProjects.length ? <ProjectGrid projects={filteredProjects} fields={visibleFields} onSelect={(project) => setSelectedKey(project.key)} onFieldChange={changeField} /> : <div className="empty-state"><Icon name="search" /><h3>No projects match these filters</h3><p>Clear the search, account, or manager filter.</p><button className="button secondary" type="button" onClick={clearFilters}>Clear filters</button></div>}
            <footer className="records-footer"><div className="milestone-legend"><span><i className="done"><Icon name="check" size={10} /></i>Done</span><span><i className="in-progress"><b /></i>In progress</span><span><i className="blocked"><Icon name="warning" size={10} /></i>Blocked</span><span><i>—</i>Not started</span></div><span>Assessment is read-only from JIRA; manual milestones write to the portal overlay.</span></footer>
          </section>
        </div>
      </main>
      <ProjectDrawer key={selectedProject?.key ?? 'closed'} project={selectedProject} onClose={() => setSelectedKey(null)} onUpdate={updateProject} onMilestoneUpdate={updateMilestone} />
      <AddFieldModal open={fieldModal} existingFields={fields} onClose={() => setFieldModal(false)} onAdd={addField} />
      <CommandMenu open={commandOpen} projects={projects} onClose={() => setCommandOpen(false)} onSelect={(project) => setSelectedKey(project.key)} onAddField={() => setFieldModal(true)} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite"><span><Icon name="check" size={14} /></span>{toast}</div>
    </div>
  )
}

export default App
