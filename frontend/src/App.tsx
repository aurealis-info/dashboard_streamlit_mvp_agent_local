import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { ActionQueue } from './components/ActionQueue'
import { AddFieldModal } from './components/AddFieldModal'
import { CommandMenu } from './components/CommandMenu'
import { Icon } from './components/Icon'
import { LifecycleOverview } from './components/LifecycleOverview'
import { NewProjectModal } from './components/NewProjectModal'
import { PipelineBoard } from './components/PipelineBoard'
import { ProjectCards } from './components/ProjectCards'
import { ProjectDrawer } from './components/ProjectDrawer'
import { ProjectTable } from './components/ProjectTable'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { initialFields, initialProjects } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import { developmentStages, milestoneNames } from './types'
import type { DevelopmentStage, FieldDefinition, MilestoneName, NewProjectInput, Project, ProjectStatus, ProjectUpdate, ViewMode } from './types'
import { attentionScore, createDefaultValue } from './utils'
import './styles.css'

function App() {
  const [projects, setProjects] = usePersistentState<Project[]>('relay.projects', initialProjects)
  const [fields, setFields] = usePersistentState<FieldDefinition[]>('relay.fields', initialFields)
  const [view, setView] = usePersistentState<ViewMode>('relay.view', 'table')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All')
  const [owner, setOwner] = useState('All')
  const [stage, setStage] = useState<DevelopmentStage | 'All'>('All')
  const [focusOnly, setFocusOnly] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [fieldModal, setFieldModal] = useState(false)
  const [projectModal, setProjectModal] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(view === 'board' ? 'lifecycle' : 'portfolio')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const deferredSearch = useDeferredValue(search)

  const owners = useMemo(() => Array.from(new Set(projects.map((project) => project.owner))).sort(), [projects])
  const visibleFields = useMemo(() => fields.filter((field) => field.active && field.visible), [fields])
  const filteredProjects = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesStatus = status === 'All' || project.status === status
      const matchesOwner = owner === 'All' || project.owner === owner
      const matchesStage = stage === 'All' || project.currentMilestone === stage
      const matchesFocus = !focusOnly || attentionScore(project) >= 5
      const customValues = Object.values(project.custom).join(' ')
      const haystack = `${project.name} ${project.key} ${project.owner} ${project.client} ${project.nextAction} ${project.tags.join(' ')} ${customValues}`.toLowerCase()
      return matchesStatus && matchesOwner && matchesStage && matchesFocus && (!query || haystack.includes(query))
    })
  }, [deferredSearch, focusOnly, owner, projects, stage, status])
  const attentionProjects = useMemo(() => [...projects].filter((project) => project.status !== 'Complete').sort((a, b) => attentionScore(b) - attentionScore(a) || a.nextActionDate.localeCompare(b.nextActionDate)), [projects])
  const selectedProject = projects.find((project) => project.key === selectedKey) ?? null

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
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
    notify('Field update saved to the demo overlay')
  }

  const addField = (field: FieldDefinition) => {
    setFields((current) => [...current, field])
    setProjects((current) => current.map((project) => ({ ...project, custom: { ...project.custom, [field.id]: createDefaultValue(field) } })))
    notify(`${field.label} is now available across the portfolio`)
  }

  const setFieldVisibility = (fieldId: string, visible: boolean) => {
    setFields((current) => current.map((field) => field.id === fieldId ? { ...field, visible } : field))
  }

  const updateProject = (key: string, update: ProjectUpdate) => {
    setProjects((current) => current.map((project) => {
      if (project.key !== key) return project
      const next = { ...project, ...update, updatedAt: 'Just now' }
      if (update.currentMilestone) {
        const developmentIndex = developmentStages.indexOf(update.currentMilestone)
        const milestoneIndex = milestoneNames.indexOf(update.currentMilestone as MilestoneName)
        next.milestones = project.milestones.map((milestone, index) => ({ ...milestone, status: milestoneIndex < 0 ? 'not_started' : index < milestoneIndex ? 'done' : index === milestoneIndex ? 'in_progress' : 'not_started' }))
        next.progress = Math.max(project.progress, Math.round((developmentIndex / (developmentStages.length - 1)) * 100))
      }
      if (update.status === 'Complete') next.progress = 100
      return next
    }))
    if (update.currentMilestone) notify(`Moved to ${update.currentMilestone}`)
    else if (update.status) notify(`Health changed to ${update.status}`)
    else notify('Project context saved with history')
  }

  const createProject = (input: NewProjectInput) => {
    const nextNumber = projects.reduce((maximum, project) => Math.max(maximum, Number(project.key.replace(/\D/g, '')) || 0), 1800) + 1
    const initials = input.owner.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    const project: Project = {
      key: `APA-${nextNumber}`,
      name: input.name,
      client: input.client,
      owner: input.owner,
      ownerInitials: initials,
      status: 'On track',
      currentMilestone: 'Intake',
      targetDate: input.targetDate,
      progress: 2,
      budget: input.budget,
      notes: 'New portal working record. Add delivery context and link the JIRA root issue when the backend is connected.',
      updatedAt: 'Just now',
      nextAction: 'Triage the request and confirm an owner',
      nextActionDate: '2026-07-23',
      tags: ['New request'],
      stakeholders: [{ name: input.owner, role: 'Program owner', initials }],
      milestones: milestoneNames.map((name, index) => ({ name, status: 'not_started', automatic: index === 0 })),
      epics: [],
      custom: Object.fromEntries(fields.filter((field) => field.active).map((field) => [field.id, field.id === 'priority' ? input.priority : createDefaultValue(field)])),
    }
    setProjects((current) => [project, ...current])
    setSelectedKey(project.key)
    notify(`${project.key} added to the working portfolio`)
  }

  const changeView = (nextView: ViewMode) => {
    setView(nextView)
    setActiveNav(nextView === 'board' ? 'lifecycle' : 'portfolio')
  }

  const navigate = (destination: string) => {
    setActiveNav(destination)
    if (destination === 'portfolio') { setView('table'); document.querySelector('.records-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
    else if (destination === 'lifecycle') { setView('board'); document.querySelector('.records-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
    else if (destination === 'command') window.scrollTo({ top: 0, behavior: 'smooth' })
    else notify(`${destination === 'people' ? 'Stakeholder intelligence' : 'Reporting'} is mapped for the connected backend phase`)
  }

  const clearFilters = () => { setSearch(''); setStatus('All'); setOwner('All'); setStage('All'); setFocusOnly(false) }
  const showFocus = () => { setFocusOnly(true); setStatus('All'); setOwner('All'); setStage('All'); setView('table'); setActiveNav('portfolio'); document.querySelector('.records-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const resetDemo = () => {
    if (!window.confirm('Reset all local demo edits, custom fields, and added initiatives?')) return
    setProjects(initialProjects); setFields(initialFields); setView('table'); clearFilters(); setSelectedKey(null); notify('Demo workspace restored')
  }

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} active={activeNav} onClose={() => setNavOpen(false)} onNavigate={navigate} onOpenCommand={() => setCommandOpen(true)} onReset={resetDemo} />
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Automation office</span><Icon name="chevron" size={12} /><strong>APA portfolio</strong></div>
          <div className="top-actions">
            <button className="top-search" type="button" onClick={() => setCommandOpen(true)}><Icon name="search" size={15} />Find anything<kbd>⌘K</kbd></button>
            <span className="environment"><span className="live-dot" />Demo overlay</span>
            <button className="icon-button notification" aria-label="Notifications"><Icon name="bell" /><i /></button>
          </div>
        </header>
        <div className="workspace">
          <section className="page-heading" aria-labelledby="page-title">
            <div><span className="section-kicker">Portfolio workspace</span><h1 id="page-title">APA development portfolio</h1><p>Track every request from intake to deployment, with JIRA facts and accountable working context in one place.</p></div>
            <div className="page-actions"><span className="freshness"><span className="live-dot" /><span><strong>Data refreshed</strong><small>Today, 06:42 ET</small></span></span><button className="button primary" onClick={() => setProjectModal(true)}><Icon name="plus" size={16} />New initiative</button></div>
          </section>
          <ActionQueue projects={attentionProjects} onSelect={(project) => setSelectedKey(project.key)} onShowFocus={showFocus} />
          <LifecycleOverview projects={projects} selectedStage={stage} onSelectStage={setStage} />
          <section className="records-panel" aria-labelledby="portfolio-title">
            <div className="records-heading">
              <div><span className="section-kicker">Initiative registry</span><h2 id="portfolio-title">All initiatives</h2><p>Scan health, ownership, stage, and the next committed action.</p></div>
              <span className="record-summary"><strong>{filteredProjects.length}</strong><small>of {projects.length} records</small></span>
            </div>
            <Toolbar search={search} onSearch={setSearch} status={status} onStatus={setStatus} owner={owner} owners={owners} onOwner={setOwner} focusOnly={focusOnly} onFocusOnly={setFocusOnly} onAddField={() => setFieldModal(true)} resultCount={filteredProjects.length} view={view} onView={changeView} fields={fields} onFieldVisibility={setFieldVisibility} stage={stage} onClearStage={() => setStage('All')} />
            {filteredProjects.length ? (
              view === 'table'
                ? <><ProjectTable projects={filteredProjects} fields={visibleFields} onSelect={(project) => setSelectedKey(project.key)} onFieldChange={changeField} /><ProjectCards projects={filteredProjects} fields={visibleFields} onSelect={(project) => setSelectedKey(project.key)} /></>
                : <PipelineBoard projects={filteredProjects} onSelect={(project) => setSelectedKey(project.key)} onMove={(key, milestone: DevelopmentStage) => updateProject(key, { currentMilestone: milestone })} />
            ) : <div className="empty-state"><span><Icon name="search" /></span><h3>No initiatives match this view</h3><p>Clear a filter or search for a different owner, business area, or issue key.</p><button className="button secondary" onClick={clearFilters}>Clear all filters</button></div>}
            <footer className="table-footer"><span>Showing {filteredProjects.length} of {projects.length} initiatives</span><span><span className="live-dot" />Semantic marts refreshed today at 06:42 ET</span></footer>
          </section>
          <section className="connection-strip" aria-label="Backend connection status">
            <div><span className="connection-icon"><Icon name="bolt" /></span><span><strong>Integration-ready demo</strong><small>All interactive changes persist in a versioned local overlay until the Flask API is connected.</small></span></div>
            <ul><li><Icon name="check" size={13} />Read-only marts</li><li><Icon name="check" size={13} />Typed custom fields</li><li><Icon name="check" size={13} />Append-only contract</li></ul>
            <a href="https://github.com/aurealis-info/dashboard_streamlit_mvp_agent_local" target="_blank" rel="noreferrer">Architecture <Icon name="external" size={14} /></a>
          </section>
        </div>
      </main>
      <ProjectDrawer key={selectedProject?.key ?? 'closed'} project={selectedProject} onClose={() => setSelectedKey(null)} onUpdate={updateProject} />
      <AddFieldModal open={fieldModal} existingFields={fields} onClose={() => setFieldModal(false)} onAdd={addField} />
      <NewProjectModal open={projectModal} owners={owners} onClose={() => setProjectModal(false)} onCreate={createProject} />
      <CommandMenu open={commandOpen} projects={projects} onClose={() => setCommandOpen(false)} onSelect={(project) => setSelectedKey(project.key)} onNewProject={() => setProjectModal(true)} onAddField={() => setFieldModal(true)} onView={changeView} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite"><span><Icon name="check" size={14} /></span>{toast}</div>
    </div>
  )
}

export default App
