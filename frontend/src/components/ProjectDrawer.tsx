import { useState } from 'react'
import type { Project } from '../types'
import { Icon } from './Icon'

interface ProjectDrawerProps { project: Project | null; onClose: () => void; onUpdateNotes: (key: string, notes: string) => void }

const milestoneLabel: Record<string, string> = { done: 'Complete', in_progress: 'In progress', not_started: 'Not started', blocked: 'Blocked' }

export function ProjectDrawer({ project, onClose, onUpdateNotes }: ProjectDrawerProps) {
  const [tab, setTab] = useState<'overview' | 'work' | 'activity'>('overview')
  const [notes, setNotes] = useState(project?.notes ?? '')
  if (!project) return null
  const storyCount = project.epics.reduce((sum, epic) => sum + epic.stories.length, 0)

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <header className="drawer-head">
          <button className="icon-button" onClick={onClose} aria-label="Close project"><Icon name="close" /></button>
          <div className="record-id"><span>{project.key}</span><span className={`status-pill ${project.status.toLowerCase().replace(' ', '-')}`}>{project.status}</span></div>
          <h2 id="project-title">{project.name}</h2>
          <p>{project.client} · Owned by {project.owner}</p>
          <div className="record-progress"><span><i style={{ width: `${project.progress}%` }} /></span><strong>{project.progress}%</strong><small>overall delivery</small></div>
        </header>
        <div className="tabs" role="tablist">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
          <button className={tab === 'work' ? 'active' : ''} onClick={() => setTab('work')}>Work <em>{storyCount}</em></button>
          <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>Activity</button>
        </div>
        <div className="drawer-body">
          {tab === 'overview' ? <>
            <section className="record-section"><div className="section-heading"><div><span className="eyebrow">Delivery path</span><h3>Milestones</h3></div><small>1 automatic · 7 managed</small></div>
              <ol className="milestone-rail">{project.milestones.map((milestone, index) => <li className={milestone.status} key={milestone.name}>
                <span className="milestone-node">{milestone.status === 'done' ? <Icon name="check" size={13} /> : index + 1}</span>
                <span className="milestone-copy"><strong>{milestone.name}{milestone.automatic ? <em>JIRA</em> : null}</strong><small>{milestoneLabel[milestone.status]}{milestone.date ? ` · ${milestone.date}` : ''}{milestone.durationDays ? ` · ${milestone.durationDays} days` : ''}</small></span>
                {milestone.status === 'in_progress' ? <span className="now-label">Now</span> : null}
              </li>)}</ol>
            </section>
            <section className="record-section"><div className="section-heading"><div><span className="eyebrow">Portal overlay</span><h3>Working notes</h3></div><span className="audit-safe"><Icon name="check" size={12} /> History on</span></div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onUpdateNotes(project.key, notes)} rows={4} />
              <div className="note-footer"><span>Last updated {project.updatedAt}</span><button onClick={() => onUpdateNotes(project.key, notes)}>Save notes</button></div>
            </section>
          </> : null}
          {tab === 'work' ? <section className="record-section"><div className="section-heading"><div><span className="eyebrow">JIRA drill-down</span><h3>Epics and stories</h3></div><small>{project.epics.length} epics · {storyCount} stories</small></div>
            <div className="epic-list">{project.epics.map((epic) => <details open key={epic.key}><summary><span><small>{epic.key}</small><strong>{epic.name}</strong></span><span className="epic-progress">{epic.progress}%</span></summary><div>{epic.stories.map((story) => <article className="story" key={story.key}><span className={`story-state ${story.status.toLowerCase().replace(' ', '-')}`} /><span><strong>{story.name}</strong><small>{story.key} · {story.points} points · {story.assignee}</small></span><em>{story.status}</em></article>)}</div></details>)}</div>
          </section> : null}
          {tab === 'activity' ? <section className="record-section"><div className="section-heading"><div><span className="eyebrow">Append-only audit</span><h3>Recent activity</h3></div></div><div className="activity-list">
            <article><span className="activity-icon"><Icon name="check" size={15} /></span><div><strong>{project.owner} updated project notes</strong><p>“{project.notes.slice(0, 82)}…”</p><small>{project.updatedAt}</small></div></article>
            <article><span className="activity-icon system"><Icon name="timeline" size={15} /></span><div><strong>Milestone status synchronized</strong><p>Assessment lifecycle was refreshed from the JIRA changelog.</p><small>Today at 06:42</small></div></article>
            <article><span className="activity-icon"><Icon name="columns" size={15} /></span><div><strong>Priority set to {String(project.custom.priority)}</strong><p>Portal overlay · version 4</p><small>Jul 12 at 14:18</small></div></article>
          </div></section> : null}
        </div>
      </aside>
    </div>
  )
}
