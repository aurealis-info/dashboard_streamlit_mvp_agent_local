import { memo } from 'react'
import type { FieldDefinition, Project } from '../types'
import { EditableCell } from './EditableCell'
import { Icon } from './Icon'

interface ProjectTableProps {
  projects: Project[]
  fields: FieldDefinition[]
  onSelect: (project: Project) => void
  onFieldChange: (key: string, field: string, value: string | number | boolean) => void
}

const statusClass = (status: Project['status']) => status.toLowerCase().replace(' ', '-')

const ProjectRow = memo(function ProjectRow({ project, fields, onSelect, onFieldChange }: ProjectTableProps & { project: Project }) {
  return (
    <tr>
      <td className="project-cell">
        <button className="project-link" onClick={() => onSelect(project)}>
          <span className={`project-signal ${statusClass(project.status)}`} />
          <span><strong>{project.name}</strong><small>{project.key} · {project.client}</small></span>
        </button>
      </td>
      <td><span className="owner"><span className="avatar">{project.ownerInitials}</span>{project.owner}</span></td>
      <td><span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span></td>
      <td><button className="milestone-link" onClick={() => onSelect(project)}>{project.currentMilestone}<Icon name="chevron" size={14} /></button></td>
      <td><div className="progress-cell"><span><i style={{ width: `${project.progress}%` }} /></span><small>{project.progress}%</small></div></td>
      <td className="date-cell">{new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' }).format(new Date(`${project.targetDate}T12:00:00`))}</td>
      {fields.map((field) => <td key={field.id}><EditableCell field={field} value={project.custom[field.id] ?? ''} onChange={(value) => onFieldChange(project.key, field.id, value)} /></td>)}
      <td><button className="icon-button" aria-label={`Open ${project.name}`} onClick={() => onSelect(project)}><Icon name="arrow" size={16} /></button></td>
    </tr>
  )
})

export function ProjectTable(props: ProjectTableProps) {
  return (
    <div className="table-scroll">
      <table className="project-table">
        <thead><tr><th>Project</th><th>Owner</th><th>Status</th><th>Current milestone</th><th>Progress</th><th>Target</th>{props.fields.map((field) => <th key={field.id}>{field.label}</th>)}<th><span className="sr-only">Open</span></th></tr></thead>
        <tbody>{props.projects.map((project) => <ProjectRow key={project.key} {...props} project={project} />)}</tbody>
      </table>
    </div>
  )
}
