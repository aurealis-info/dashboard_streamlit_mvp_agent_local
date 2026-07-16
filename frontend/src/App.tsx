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
    notify('Workspace value saved')
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
    notify('Workspace fields saved')
  }

  const updateMilestone = (key: string, milestoneName: ManualMilestoneName, update: MilestoneUpdate) => {
    setProjects((current) => current.map((project) => project.key === key ? {
      ...project,
      milestones: project.milestones.map((milestone) => milestone.name === milestoneName ? { ...milestone, ...update } : milestone),
      updatedAt: 'Just now',
    } : project))
    notify(`${milestoneName} saved`)
  }

  const clearFilters = () => { setSearch(''); setManager('All'); setAccount('All') }
  const resetDemo = () => {
    if (!window.confirm('Reset local project edits and custom fields?')) return
    setProjects(initialProjects); setFields(initialFields); clearFilters(); setSelectedKey(null); notify('Demo project register restored')
  }

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} projectCount={projects.length} onClose={() => setNavOpen(false)} onReset={resetDemo} />
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>APA Tracker</span><Icon name="chevron" size={12} /><strong>Projects</strong></div>
          <div className="top-actions"><button className="top-search" type="button" onClick={() => setCommandOpen(true)}><Icon name="search" size={15} />Find a project<kbd>⌘K</kbd></button><span className="environment"><span className="live-dot" />Demo data</span></div>
        </header>
        <div className="workspace">
          <section className="workspace-heading" aria-labelledby="page-title">
            <div><span className="section-kicker">APA operations</span><h1 id="page-title">Project register</h1><p>Manage every project across the eight architecture milestones, with JIRA facts and workspace edits in one view.</p></div>
            <div className="ownership-guide" aria-label="Field ownership"><span className="source"><Icon name="lock" size={13} />JIRA source</span><span className="editable"><Icon name="edit" size={13} />Workspace editable</span></div>
          </section>
          <section className="records-panel" aria-labelledby="projects-title">
            <header className="records-heading"><div><h2 id="projects-title">All projects</h2><p>Assessment comes from JIRA; the next seven milestone cells and workspace columns edit in place.</p></div><span className="editing-hint"><Icon name="edit" size={13} />Click editable cells to update</span></header>
            <Toolbar search={search} onSearch={setSearch} manager={manager} managers={managers} onManager={setManager} account={account} accounts={accounts} onAccount={setAccount} fields={fields} onFieldVisibility={setFieldVisibility} onAddField={() => setFieldModal(true)} resultCount={filteredProjects.length} />
            {filteredProjects.length ? <ProjectGrid projects={filteredProjects} fields={visibleFields} onSelect={(project) => setSelectedKey(project.key)} onProjectChange={updateProject} onMilestoneChange={updateMilestone} onFieldChange={changeField} /> : <div className="empty-state"><Icon name="search" /><h3>No projects match these filters</h3><p>Clear the search, account, or manager filter.</p><button className="button secondary" type="button" onClick={clearFilters}>Clear filters</button></div>}
            <footer className="records-footer"><span><Icon name="edit" size={13} />Workspace edits save immediately to the demo overlay.</span><span>Scroll horizontally for all lifecycle and JIRA detail columns.</span></footer>
          </section>
        </div>
      </main>
      <ProjectDrawer key={selectedProject?.key ?? 'closed'} project={selectedProject} onClose={() => setSelectedKey(null)} onUpdate={updateProject} onMilestoneUpdate={updateMilestone} />
      <AddFieldModal open={fieldModal} existingFields={fields} onClose={() => setFieldModal(false)} onAdd={addField} />
      <CommandMenu open={commandOpen} projects={projects} onClose={() => setCommandOpen(false)} onSelect={(project) => setSelectedKey(project.key)} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite"><span><Icon name="check" size={14} /></span>{toast}</div>
    </div>
  )
}

export default App
