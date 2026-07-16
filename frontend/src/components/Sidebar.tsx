import { Icon } from './Icon'
import type { IconName } from './Icon'
import { developmentStages } from '../types'

interface SidebarProps {
  open: boolean
  active: string
  onClose: () => void
  onNavigate: (destination: string) => void
  onOpenCommand: () => void
  onReset: () => void
}

const nav: { id: string; icon: IconName; label: string; count?: number }[] = [
  { id: 'command', icon: 'grid', label: 'Command center' },
  { id: 'portfolio', icon: 'folder', label: 'Portfolio' },
  { id: 'lifecycle', icon: 'timeline', label: 'Lifecycle', count: developmentStages.length },
  { id: 'people', icon: 'users', label: 'Stakeholders' },
  { id: 'reports', icon: 'chart', label: 'Reports' },
]

export function Sidebar({ open, active, onClose, onNavigate, onOpenCommand, onReset }: SidebarProps) {
  return (
    <>
      <button className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><strong>Relay</strong><small>Aurealis · APA</small></div>
        </div>
        <button className="workspace-switcher" type="button">
          <span className="workspace-avatar">AO</span>
          <span><strong>Automation office</strong><small>Production workspace</small></span>
          <Icon name="down" size={14} />
        </button>
        <button className="quick-find" type="button" onClick={onOpenCommand}>
          <Icon name="search" size={16} /><span>Quick find</span><kbd>⌘K</kbd>
        </button>
        <nav aria-label="Main navigation">
          <p className="nav-label">Operate</p>
          {nav.map((item) => (
            <button className={`nav-item ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => { onNavigate(item.id); onClose() }}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.count ? <em>{item.count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sync-card">
          <div className="sync-top"><span className="live-dot" />Marts synchronized</div>
          <strong>Data current to 06:42 ET</strong>
          <small>JIRA semantic layer · daily</small>
        </div>
        <button className="nav-item subtle" type="button" onClick={onReset}><Icon name="reset" /><span>Reset demo data</span></button>
        <button className="profile" type="button">
          <span className="avatar avatar-light">SC</span>
          <span><strong>Simon C.</strong><small>Program manager</small></span>
          <Icon name="more" size={16} />
        </button>
      </aside>
    </>
  )
}
