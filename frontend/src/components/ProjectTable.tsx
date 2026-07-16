import { memo } from 'react'
import type { FieldDefinition, Project } from '../types'
import { formatDate, statusClass } from '../utils'
import { EditableCell } from './EditableCell'
import { Icon } from './Icon'

interface ProjectTableProps {
  projects: Project[]
  fields: FieldDefinition[]
  onSelect: (project: Project) => void
  onFieldChange: (key: string, field: string, value: string | number | boolean) => void
}

interface ProjectRowProps extends ProjectTableProps { project: Project }

const ProjectRow = memo(function ProjectRow({ project, fields, onSelect, onFieldChange }: ProjectRowProps) {
  return (
    <tr>
      <td className="project-cell sticky-cell">
        <button className="project-link" onClick={() => onSelect(project)}>
          <span className={`project-signal ${statusClass(project.status)}`} />
          <span><strong>{project.name}</strong><small><code>{project.key}</code><i>·</i>{project.client}</small></span>
        </button>
      </td>
      <td><span className="owner"><span className="avatar">{project.ownerInitials}</span><span>{project.owner}<small>Program owner</small></span></span></td>
      <td><span className={`status-pill ${statusClass(project.status)}`}><i />{project.status}</span></td>
      <td><button className="milestone-link" onClick={() => onSelect(project)}>{project.currentMilestone}<Icon name="chevron" size={13} /></button></td>
      <td><div className="progress-cell"><span><i style={{ width: `${project.progress}%` }} /></span><small>{project.progress}%</small></div></td>
      <td className="date-cell"><strong>{formatDate(project.targetDate)}</strong><small>FY26</small></td>
      <td className="next-action-cell"><button type="button" onClick={() => onSelect(project)}><strong>{project.nextAction}</strong><small>Due {formatDate(project.nextActionDate)}</small></button></td>
      {fields.map((field) => <td key={field.id}><EditableCell field={field} value={project.custom[field.id] ?? ''} onChange={(value) => onFieldChange(project.key, field.id, value)} /></td>)}
      <td className="row-action"><button className="icon-button" aria-label={`Open ${project.name}`} onClick={() => onSelect(project)}><Icon name="arrow" size={16} /></button></td>
    </tr>
  )
})

export function ProjectTable(props: ProjectTableProps) {
  return (
    <div className="table-scroll">
      <table className="project-table">
        <thead><tr><th className="sticky-cell">Initiative</th><th>Owner</th><th>Health</th><th>Current stage</th><th>Progress</th><th>Target</th><th>Next action</th>{props.fields.map((field) => <th key={field.id}>{field.label}<small>{field.type}</small></th>)}<th><span className="sr-only">Open</span></th></tr></thead>
        <tbody>{props.projects.map((project) => <ProjectRow key={project.key} {...props} project={project} />)}</tbody>
      </table>
    </div>
  )
}
