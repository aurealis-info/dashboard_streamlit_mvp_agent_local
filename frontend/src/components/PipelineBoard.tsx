import { useState } from 'react'
import { milestoneNames } from '../types'
import type { MilestoneName, Project } from '../types'
import { formatDate, formatMoney, statusClass } from '../utils'
import { Icon } from './Icon'

interface PipelineBoardProps {
  projects: Project[]
  onSelect: (project: Project) => void
  onMove: (projectKey: string, milestone: MilestoneName) => void
}

export function PipelineBoard({ projects, onSelect, onMove }: PipelineBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<MilestoneName | null>(null)

  return (
    <div className="board-scroll" aria-label="Lifecycle board">
      <div className="pipeline-board">
        {milestoneNames.map((milestone, index) => {
          const laneProjects = projects.filter((project) => project.currentMilestone === milestone)
          const laneValue = laneProjects.reduce((sum, project) => sum + project.budget, 0)
          return (
            <section
              className={`board-lane ${dragOver === milestone ? 'drag-over' : ''}`}
              key={milestone}
              onDragOver={(event) => { event.preventDefault(); setDragOver(milestone) }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOver(null) }}
              onDrop={(event) => { event.preventDefault(); if (dragging) onMove(dragging, milestone); setDragging(null); setDragOver(null) }}
            >
              <header><span className="lane-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{milestone}</strong><small>{laneProjects.length} {laneProjects.length === 1 ? 'initiative' : 'initiatives'} · {formatMoney(laneValue, true)}</small></div></header>
              <div className="lane-cards">
                {laneProjects.map((project) => (
                  <article className={`board-card ${dragging === project.key ? 'dragging' : ''}`} key={project.key} draggable onDragStart={() => setDragging(project.key)} onDragEnd={() => { setDragging(null); setDragOver(null) }}>
                    <div className="board-card-top"><span className={`status-pill ${statusClass(project.status)}`}><i />{project.status}</span><span className="drag-handle" aria-hidden="true"><Icon name="grip" size={16} /></span></div>
                    <button type="button" className="board-card-main" onClick={() => onSelect(project)}><small><code>{project.key}</code> · {project.client}</small><strong>{project.name}</strong></button>
                    <div className="board-progress"><span><i style={{ width: `${project.progress}%` }} /></span><small>{project.progress}%</small></div>
                    <div className="board-next"><span><Icon name="target" size={14} />Next signal</span><strong>{project.nextAction}</strong><small>Due {formatDate(project.nextActionDate)}</small></div>
                    <footer><span className="owner compact"><span className="avatar">{project.ownerInitials}</span>{project.owner}</span><label><span className="sr-only">Move {project.name}</span><select value={project.currentMilestone} onChange={(event) => onMove(project.key, event.target.value as MilestoneName)}>{milestoneNames.map((stage) => <option key={stage}>{stage}</option>)}</select></label></footer>
                  </article>
                ))}
                {laneProjects.length === 0 ? <div className="empty-lane"><span /><p>Drop an initiative here</p></div> : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
