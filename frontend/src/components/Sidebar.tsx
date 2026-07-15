import { Icon } from './Icon'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const nav = [
  { icon: 'grid' as const, label: 'Portfolio', active: true },
  { icon: 'folder' as const, label: 'Projects' },
  { icon: 'users' as const, label: 'Resources' },
  { icon: 'timeline' as const, label: 'Milestones', count: 3 },
  { icon: 'chart' as const, label: 'Reports' },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>APA</strong><small>Operations</small></div>
        </div>
        <nav aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {nav.map((item) => (
            <button className={`nav-item ${item.active ? 'active' : ''}`} key={item.label} onClick={onClose}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count ? <em>{item.count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sync-card">
          <div className="sync-top"><span className="live-dot" />Data current</div>
          <strong>Synced at 06:42 ET</strong>
          <small>JIRA semantic marts · daily</small>
        </div>
        <button className="profile">
          <span className="avatar avatar-light">SC</span>
          <span><strong>Simon C.</strong><small>Program manager</small></span>
          <Icon name="more" size={16} />
        </button>
      </aside>
    </>
  )
}
