import { Icon } from './Icon'

interface SidebarProps {
  open: boolean
  projectCount: number
  resourceCount: number
  activePage: 'projects' | 'resources'
  onClose: () => void
  onNavigate: (page: 'projects' | 'resources') => void
  onReset: () => void
}

export function Sidebar({ open, projectCount, resourceCount, activePage, onClose, onNavigate, onReset }: SidebarProps) {
  return (
    <>
      <button className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation">
        <div className="brand">
          <span className="brand-monogram">APA</span>
          <span><strong>APA Tracker</strong><small>Operations workspace</small></span>
        </div>
        <nav aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          <button className={`nav-item ${activePage === 'projects' ? 'active' : ''}`} type="button" aria-current={activePage === 'projects' ? 'page' : undefined} onClick={() => { onNavigate('projects'); onClose() }}>
            <Icon name="table" />
            <span>Projects</span>
            <em>{projectCount}</em>
          </button>
          <button className={`nav-item ${activePage === 'resources' ? 'active' : ''}`} type="button" aria-current={activePage === 'resources' ? 'page' : undefined} onClick={() => { onNavigate('resources'); onClose() }}>
            <Icon name="users" />
            <span>Resources</span>
            <em>{resourceCount}</em>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <button className="nav-item subtle" type="button" onClick={onReset}>
          <Icon name="reset" />
          <span>Reset demo data</span>
        </button>
      </aside>
    </>
  )
}
