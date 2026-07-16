import { Icon } from './Icon'

interface SidebarProps {
  open: boolean
  projectCount: number
  onClose: () => void
  onReset: () => void
}

export function Sidebar({ open, projectCount, onClose, onReset }: SidebarProps) {
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
          <button className="nav-item active" type="button" aria-current="page" onClick={onClose}>
            <Icon name="table" />
            <span>Projects</span>
            <em>{projectCount}</em>
          </button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="source-summary">
          <span><Icon name="check" size={14} />JIRA connected</span>
          <strong>Daily snapshot</strong>
          <small>Source fields are read only</small>
        </div>
        <button className="nav-item subtle" type="button" onClick={onReset}>
          <Icon name="reset" />
          <span>Reset demo data</span>
        </button>
        <div className="profile"><span className="avatar">SC</span><span><strong>Simon C.</strong><small>Program manager</small></span></div>
      </aside>
    </>
  )
}
