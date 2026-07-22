import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AddFieldModal } from './components/AddFieldModal'
import { CommandMenu } from './components/CommandMenu'
import { Icon } from './components/Icon'
import { ProjectDrawer } from './components/ProjectDrawer'
import type { ProjectDrawerTab } from './components/ProjectDrawer'
import { ProjectGrid } from './components/ProjectGrid'
import { ProjectTimeline } from './components/ProjectTimeline'
import { ResourceWorkspace } from './components/ResourceWorkspace'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { initialFields, initialProjects, initialResourceFields, initialResourceIssues } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import type { FieldDefinition, ManualMilestoneName, MilestoneUpdate, Project, ProjectUpdate, ResourceIssue } from './types'
import { createDefaultValue } from './utils'
import './styles.css'

function App() {
  const [projects, setProjects] = usePersistentState<Project[]>('apa-tracker.projects', initialProjects)
  const [fields, setFields] = usePersistentState<FieldDefinition[]>('apa-tracker.fields', initialFields)
  const [resourceIssues, setResourceIssues] = usePersistentState<ResourceIssue[]>('apa-tracker.resources', initialResourceIssues)
  const [resourceFields, setResourceFields] = usePersistentState<FieldDefinition[]>('apa-tracker.resource-fields', initialResourceFields)
  const [activePage, setActivePage] = useState<'projects' | 'resources'>('projects')
  const [projectView, setProjectView] = useState<'table' | 'timeline'>('table')
  const [search, setSearch] = useState('')
  const [manager, setManager] = useState('All')
  const [account, setAccount] = useState('All')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [drawerTab, setDrawerTab] = useState<ProjectDrawerTab>('overview')
  const [fieldModalTarget, setFieldModalTarget] = useState<'project' | 'resource' | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const deferredSearch = useDeferredValue(search)

  const managers = useMemo(() => Array.from(new Set(projects.map((project) => project.manager))).sort(), [projects])
  const accounts = useMemo(() => Array.from(new Set(projects.map((project) => project.account))).sort(), [projects])
  const visibleFields = useMemo(() => fields.filter((field) => field.active && field.visible), [fields])
  const resourcePeopleCount = useMemo(() => new Set(resourceIssues.map((issue) => issue.assignee)).size, [resourceIssues])
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
    if (fieldModalTarget === 'resource') {
      setResourceFields((current) => [...current, field])
      setResourceIssues((current) => current.map((issue) => ({ ...issue, custom: { ...issue.custom, [field.id]: createDefaultValue(field) } })))
      notify(`${field.label} added to resource issues`)
      return
    }
    setFields((current) => [...current, field])
    setProjects((current) => current.map((project) => ({ ...project, custom: { ...project.custom, [field.id]: createDefaultValue(field) } })))
    notify(`${field.label} added to projects`)
  }

  const setFieldVisibility = (fieldId: string, visible: boolean) => {
    setFields((current) => current.map((field) => field.id === fieldId ? { ...field, visible } : field))
  }

  const setResourceFieldVisibility = (fieldId: string, visible: boolean) => {
    setResourceFields((current) => current.map((field) => field.id === fieldId ? { ...field, visible } : field))
  }

  const updateProject = (key: string, update: ProjectUpdate) => {
    setProjects((current) => current.map((project) => project.key === key ? { ...project, ...update, updatedAt: 'Just now' } : project))
    notify('Workspace fields saved')
  }

  const updateMilestone = (key: string, milestoneName: ManualMilestoneName, update: MilestoneUpdate) => {
    if (update.startedAt && update.completedAt && update.startedAt > update.completedAt) {
      notify('End date must be on or after the start date')
      return
    }
    setProjects((current) => current.map((project) => project.key === key ? {
      ...project,
      milestones: project.milestones.map((milestone) => milestone.name === milestoneName ? { ...milestone, ...update } : milestone),
      updatedAt: 'Just now',
    } : project))
    notify(`${milestoneName} saved`)
  }

  const changeResourceField = (sprintIssueKey: string, fieldId: string, value: string | number | boolean) => {
    setResourceIssues((current) => current.map((issue) => issue.sprintIssueKey === sprintIssueKey ? { ...issue, custom: { ...issue.custom, [fieldId]: value } } : issue))
    notify('Resource workspace value saved')
  }

  const openProject = useCallback((project: Project, tab: ProjectDrawerTab = 'overview') => {
    setDrawerTab(tab)
    setSelectedKey(project.key)
  }, [])

  const clearFilters = () => { setSearch(''); setManager('All'); setAccount('All') }
  const resetDemo = () => {
    if (!window.confirm('Reset local workspace edits and custom fields?')) return
    setProjects(initialProjects); setFields(initialFields); setResourceIssues(initialResourceIssues); setResourceFields(initialResourceFields); clearFilters(); setSelectedKey(null); notify('Demo workspace restored')
  }

  return (
    <div className="app-shell">
      <Sidebar open={navOpen} projectCount={projects.length} resourceCount={resourcePeopleCount} activePage={activePage} onNavigate={setActivePage} onClose={() => setNavOpen(false)} onReset={resetDemo} />
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
          <div className="breadcrumb"><span>APA Tracker</span><Icon name="chevron" size={12} /><strong>{activePage === 'projects' ? 'Projects' : 'Resources'}</strong></div>
          <div className="top-actions"><button className="top-search" type="button" onClick={() => setCommandOpen(true)}><Icon name="search" size={15} />Find a project<kbd>⌘K</kbd></button><span className="environment"><span className="live-dot" />Demo data</span></div>
        </header>
        <div className="workspace">
          <section className="records-panel" aria-labelledby="page-title">
            {activePage === 'projects' ? <>
              <header className="portfolio-header">
                <div><h1 id="page-title">Projects</h1><span>{filteredProjects.length === projects.length ? `${projects.length} projects` : `${filteredProjects.length} of ${projects.length} projects`} · 8 governed milestones</span></div>
                <div className="view-switch" role="group" aria-label="Project view">
                  <button type="button" aria-pressed={projectView === 'table'} onClick={() => setProjectView('table')}><Icon name="table" size={14} />Table</button>
                  <button type="button" aria-pressed={projectView === 'timeline'} onClick={() => setProjectView('timeline')}><Icon name="timeline" size={14} />Timeline</button>
                </div>
              </header>
              <Toolbar search={search} onSearch={setSearch} manager={manager} managers={managers} onManager={setManager} account={account} accounts={accounts} onAccount={setAccount} fields={fields} onFieldVisibility={setFieldVisibility} onAddField={() => setFieldModalTarget('project')} showColumns={projectView === 'table'} />
              {filteredProjects.length ? projectView === 'table'
                ? <ProjectGrid projects={filteredProjects} fields={visibleFields} onSelect={(project) => openProject(project)} onScheduleSelect={(project) => openProject(project, 'milestones')} onProjectChange={updateProject} onMilestoneChange={updateMilestone} onFieldChange={changeField} />
                : <ProjectTimeline projects={filteredProjects} onSelect={(project) => openProject(project, 'milestones')} />
              : <div className="empty-state"><Icon name="search" /><h3>No projects match these filters</h3><p>Clear the search, account, or manager filter.</p><button className="button secondary" type="button" onClick={clearFilters}>Clear filters</button></div>}
            </> : <>
              <header className="portfolio-header"><div><h1 id="page-title">Resources</h1><span>{resourcePeopleCount} assignees · {resourceIssues.length} sprint issues</span></div></header>
              <ResourceWorkspace issues={resourceIssues} fields={resourceFields} onFieldChange={changeResourceField} onFieldVisibility={setResourceFieldVisibility} onAddField={() => setFieldModalTarget('resource')} onOpenProject={(projectKey) => {
                const project = projects.find((item) => item.key === projectKey)
                if (project) openProject(project, 'work')
              }} />
            </>}
          </section>
        </div>
      </main>
      <ProjectDrawer key={`${selectedProject?.key ?? 'closed'}-${drawerTab}`} project={selectedProject} initialTab={drawerTab} onClose={() => setSelectedKey(null)} onUpdate={updateProject} onMilestoneUpdate={updateMilestone} />
      <AddFieldModal open={fieldModalTarget !== null} contextLabel={fieldModalTarget === 'resource' ? 'Resource issues' : 'Projects'} entityType={fieldModalTarget === 'resource' ? 'resource' : 'project'} existingFields={fieldModalTarget === 'resource' ? resourceFields : fields} onClose={() => setFieldModalTarget(null)} onAdd={addField} />
      <CommandMenu open={commandOpen} projects={projects} onClose={() => setCommandOpen(false)} onSelect={(project) => openProject(project)} />
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite"><span><Icon name="check" size={14} /></span>{toast}</div>
    </div>
  )
}

export default App
