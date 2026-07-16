import type { Project } from '../types'
import { formatDate, statusClass } from '../utils'
import { Icon } from './Icon'

interface DecisionDocketProps {
  projects: Project[]
  onSelect: (project: Project) => void
  onShowFocus: () => void
}

export function DecisionDocket({ projects, onSelect, onShowFocus }: DecisionDocketProps) {
  const priorityProjects = projects.slice(0, 3)

  return (
    <section className="decision-docket" aria-labelledby="docket-title">
      <div className="docket-lead">
        <span className="eyebrow light"><Icon name="sparkle" size={14} /> Thursday briefing</span>
        <h1 id="docket-title"><span>{priorityProjects.length}</span> decisions need your signal.</h1>
        <p>Relay ranked the work by delivery health, priority, and the next committed action.</p>
        <button className="text-button light" type="button" onClick={onShowFocus}>Open focused view <Icon name="arrow" size={15} /></button>
      </div>
      <div className="signal-line" aria-hidden="true"><i /><i /><i /></div>
      <div className="docket-list">
        {priorityProjects.map((project, index) => (
          <button type="button" className="docket-item" key={project.key} onClick={() => onSelect(project)}>
            <span className="docket-index">0{index + 1}</span>
            <span className="docket-copy">
              <span><i className={`health-dot ${statusClass(project.status)}`} />{project.status} · {project.client}</span>
              <strong>{project.nextAction}</strong>
              <small>{project.name} · due {formatDate(project.nextActionDate)}</small>
            </span>
            <Icon name="arrow" size={17} />
          </button>
        ))}
      </div>
    </section>
  )
}
