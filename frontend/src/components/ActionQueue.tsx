import type { Project } from '../types'
import { formatDate, statusClass } from '../utils'
import { Icon } from './Icon'

interface ActionQueueProps {
  projects: Project[]
  onSelect: (project: Project) => void
  onShowFocus: () => void
}

function reasonFor(project: Project) {
  if (project.status === 'Blocked') return 'Delivery blocker'
  if (project.status === 'At risk') return 'Health signal'
  return 'Upcoming commitment'
}

export function ActionQueue({ projects, onSelect, onShowFocus }: ActionQueueProps) {
  const priorityProjects = projects.slice(0, 3)

  return (
    <section className="action-queue" aria-labelledby="action-queue-title">
      <header className="action-queue-heading">
        <span className="queue-icon"><Icon name="sparkle" size={16} /></span>
        <div><span className="section-kicker">Smart worklist</span><h2 id="action-queue-title">Today&apos;s action queue</h2><p>Explainably ranked from health, registered priority, and due date.</p></div>
        <button type="button" className="text-action" onClick={onShowFocus}>View attention list <Icon name="arrow" size={14} /></button>
      </header>
      <div className="action-items">
        {priorityProjects.map((project, index) => (
          <button type="button" className="action-item" onClick={() => onSelect(project)} key={project.key}>
            <span className="action-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="action-copy">
              <span className="action-context"><i className={`health-dot ${statusClass(project.status)}`} />{reasonFor(project)} · {project.client}</span>
              <strong>{project.nextAction}</strong>
              <small>{project.name}</small>
            </span>
            <span className={project.nextActionDate <= '2026-07-18' ? 'action-due urgent' : 'action-due'}><small>Due</small><strong>{formatDate(project.nextActionDate)}</strong></span>
            <Icon name="chevron" size={15} />
          </button>
        ))}
      </div>
    </section>
  )
}
