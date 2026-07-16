import { Icon } from './Icon'
import type { IconName } from './Icon'

interface SidebarProps {
  open: boolean
  active: string
  projectCount: number
  onClose: () => void
  onNavigate: (destination: string) => void
  onOpenCommand: () => void
  onReset: () => void
}

const nav: { id: string; icon: IconName; label: string }[] = [
  { id: 'command', icon: 'grid', label: 'Command center' },
  { id: 'projects', icon: 'folder', label: 'Projects' },
  { id: 'resources', icon: 'users', label: 'Resources' },
  { id: 'fields', icon: 'columns', label: 'Field definitions' },
]

export function Sidebar({ open, active, projectCount, onClose, onNavigate, onOpenCommand, onReset }: SidebarProps) {
  return (
    <>
      <button className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation">
        <div className="brand"><span className="brand-monogram">APA</span><span><strong>APA Tracker</strong><small>JIRA Operations</small></span></div>
        <button className="quick-find" type="button" onClick={onOpenCommand}><Icon name="search" size={16} /><span>Find project</span><kbd>⌘K</kbd></button>
        <nav aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {nav.map((item) => <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => { onNavigate(item.id); onClose() }}><Icon name={item.icon} /><span>{item.label}</span>{item.id === 'projects' ? <em>{projectCount}</em> : null}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="source-summary"><span><Icon name="check" size={14} />JIRA semantic marts</span><strong>Daily snapshot</strong><small>Read-only base + portal overlay</small></div>
        <button className="nav-item subtle" type="button" onClick={onReset}><Icon name="reset" /><span>Reset demo data</span></button>
        <div className="profile"><span className="avatar">SC</span><span><strong>Simon C.</strong><small>Program manager</small></span></div>
      </aside>
    </>
  )
}
