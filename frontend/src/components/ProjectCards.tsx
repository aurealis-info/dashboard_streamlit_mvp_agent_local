import type { FieldDefinition, Project } from '../types'
import { Icon } from './Icon'

interface ProjectCardsProps { projects: Project[]; fields: FieldDefinition[]; onSelect: (project: Project) => void }

export function ProjectCards({ projects, fields, onSelect }: ProjectCardsProps) {
  return <div className="project-cards">{projects.map((project) => (
    <button className="project-card" key={project.key} onClick={() => onSelect(project)}>
      <span className="card-head"><span><small>{project.key}</small><strong>{project.name}</strong></span><Icon name="arrow" /></span>
      <span className="card-meta"><span className={`status-pill ${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span><span>{project.owner}</span></span>
      <span className="card-progress"><span><i style={{ width: `${project.progress}%` }} /></span><small>{project.progress}% · {project.currentMilestone}</small></span>
      <span className="card-fields">{fields.slice(0, 2).map((field) => <span key={field.id}><small>{field.label}</small><strong>{String(project.custom[field.id] ?? '—')}</strong></span>)}</span>
    </button>
  ))}</div>
}
