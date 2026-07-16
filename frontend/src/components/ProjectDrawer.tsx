import { useEffect, useState } from 'react'
import { developmentStages } from '../types'
import type { DevelopmentStage, Project, ProjectStatus, ProjectUpdate } from '../types'
import { formatDate, formatMoney, statusClass } from '../utils'
import { Icon } from './Icon'

interface ProjectDrawerProps {
  project: Project | null
  onClose: () => void
  onUpdate: (key: string, update: ProjectUpdate) => void
}

type DrawerTab = 'overview' | 'work' | 'people' | 'activity'
const milestoneLabel: Record<string, string> = { done: 'Complete', in_progress: 'In progress', not_started: 'Not started', blocked: 'Blocked' }
const statuses: ProjectStatus[] = ['On track', 'At risk', 'Blocked', 'Complete']

export function ProjectDrawer({ project, onClose, onUpdate }: ProjectDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [nextAction, setNextAction] = useState(project?.nextAction ?? '')

  useEffect(() => {
    if (!project) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, onClose])

  if (!project) return null
  const storyCount = project.epics.reduce((sum, epic) => sum + epic.stories.length, 0)
  const completedStories = project.epics.reduce((sum, epic) => sum + epic.stories.filter((story) => story.status === 'Done').length, 0)

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <header className="drawer-head">
          <div className="drawer-toolbar"><span className="source-badge"><span className="live-dot" />JIRA + overlay</span><button className="icon-button" onClick={onClose} aria-label="Close project"><Icon name="close" /></button></div>
          <div className="record-id"><code>{project.key}</code><span>{project.client}</span></div>
          <h2 id="project-title">{project.name}</h2>
          <div className="record-controls">
            <label className={`status-control ${statusClass(project.status)}`}><span className="sr-only">Health status</span><i /><select value={project.status} onChange={(event) => onUpdate(project.key, { status: event.target.value as ProjectStatus })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><Icon name="down" size={12} /></label>
            <label className="stage-control"><Icon name="timeline" size={14} /><span className="sr-only">Current stage</span><select value={project.currentMilestone} onChange={(event) => onUpdate(project.key, { currentMilestone: event.target.value as DevelopmentStage })}>{developmentStages.map((milestone) => <option key={milestone}>{milestone}</option>)}</select><Icon name="down" size={12} /></label>
          </div>
          <div className="record-progress"><span><i style={{ width: `${project.progress}%` }} /></span><strong>{project.progress}%</strong><small>overall delivery</small></div>
        </header>
        <div className="tabs" role="tablist" aria-label="Project details">
          {([['overview', 'Overview'], ['work', `Work · ${storyCount}`], ['people', `People · ${project.stakeholders.length}`], ['activity', 'Activity']] as [DrawerTab, string][]).map(([value, label]) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}>{label}</button>)}
        </div>
        <div className="drawer-body">
          {tab === 'overview' ? <>
            <section className="record-section next-signal-section">
              <div className="section-heading"><div><span className="eyebrow">Next signal</span><h3>Keep momentum visible</h3></div><span className={project.nextActionDate <= '2026-07-18' ? 'due-badge urgent' : 'due-badge'}>Due {formatDate(project.nextActionDate)}</span></div>
              <label className="next-action-editor"><Icon name="target" size={17} /><input value={nextAction} onChange={(event) => setNextAction(event.target.value)} onBlur={() => { if (nextAction.trim() && nextAction !== project.nextAction) onUpdate(project.key, { nextAction: nextAction.trim() }) }} /><Icon name="check" size={15} /></label>
            </section>
            <section className="record-section">
              <div className="record-facts">
                <div><span>Program owner</span><strong className="owner compact"><span className="avatar">{project.ownerInitials}</span>{project.owner}</strong></div>
                <div><span>Target date</span><strong>{formatDate(project.targetDate)}, 2026</strong></div>
                <div><span>Committed budget</span><strong>{formatMoney(project.budget)}</strong></div>
                <div><span>Story delivery</span><strong>{completedStories} / {storyCount} complete</strong></div>
              </div>
            </section>
            <section className="record-section">
              <div className="section-heading"><div><span className="eyebrow">Delivery path</span><h3>Lifecycle milestones</h3></div><small>1 automatic · 7 managed</small></div>
              <ol className="milestone-rail">{project.milestones.map((milestone, index) => <li className={milestone.status} key={milestone.name}>
                <span className="milestone-node">{milestone.status === 'done' ? <Icon name="check" size={13} /> : index + 1}</span>
                <span className="milestone-copy"><strong>{milestone.name}{milestone.automatic ? <em>JIRA</em> : null}</strong><small>{milestoneLabel[milestone.status]}{milestone.date ? ` · ${milestone.date}` : ''}{milestone.durationDays ? ` · ${milestone.durationDays} days` : ''}</small></span>
                {milestone.status === 'in_progress' ? <span className="now-label">Now</span> : null}
              </li>)}</ol>
            </section>
            <section className="record-section">
              <div className="section-heading"><div><span className="eyebrow">Portal overlay</span><h3>Working notes</h3></div><span className="audit-safe"><Icon name="check" size={12} />History on</span></div>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => { if (notes !== project.notes) onUpdate(project.key, { notes }) }} rows={5} />
              <div className="note-footer"><span>Last updated {project.updatedAt}</span><button onClick={() => onUpdate(project.key, { notes })}>Save notes</button></div>
            </section>
          </> : null}
          {tab === 'work' ? <section className="record-section work-section"><div className="section-heading"><div><span className="eyebrow">JIRA drill-down</span><h3>Epics and stories</h3></div><small>{project.epics.length} epics · {storyCount} stories</small></div>
            <div className="epic-list">{project.epics.map((epic) => <details open key={epic.key}><summary><span><code>{epic.key}</code><strong>{epic.name}</strong></span><span className="epic-progress">{epic.progress}%</span></summary><div>{epic.stories.map((story) => <article className="story" key={story.key}><span className={`story-state ${statusClass(story.status)}`} /><span><strong>{story.name}</strong><small><code>{story.key}</code> · {story.points} points · {story.assignee}</small></span><em className={statusClass(story.status)}>{story.status}</em></article>)}</div></details>)}</div>
          </section> : null}
          {tab === 'people' ? <section className="record-section people-section"><div className="section-heading"><div><span className="eyebrow">Relationship map</span><h3>Key stakeholders</h3></div><button className="text-button" type="button"><Icon name="plus" size={14} />Add person</button></div>
            <div className="stakeholder-list">{project.stakeholders.map((person, index) => <article key={person.name}><span className="avatar large">{person.initials}</span><span><strong>{person.name}</strong><small>{person.role}</small></span><span className={index === 0 ? 'relationship strong' : 'relationship'}>{index === 0 ? 'Sponsor' : 'Core team'}</span><button className="icon-button" aria-label={`More options for ${person.name}`}><Icon name="more" size={16} /></button></article>)}</div>
            <div className="relationship-note"><Icon name="sparkle" size={16} /><p><strong>Relationship signal</strong><span>Executive sponsorship is active. The next governance touchpoint is linked to the current action.</span></p></div>
          </section> : null}
          {tab === 'activity' ? <section className="record-section activity-section"><div className="section-heading"><div><span className="eyebrow">Append-only audit</span><h3>Recent activity</h3></div><span className="source-badge"><span className="live-dot" />Traceable</span></div><div className="activity-list">
            <article><span className="activity-icon"><Icon name="check" size={15} /></span><div><strong>{project.owner} updated project context</strong><p>“{project.notes.slice(0, 100)}{project.notes.length > 100 ? '…' : ''}”</p><small>{project.updatedAt}</small></div></article>
            <article><span className="activity-icon system"><Icon name="timeline" size={15} /></span><div><strong>Milestone status synchronized</strong><p>Assessment lifecycle was refreshed from the JIRA changelog.</p><small>Today at 06:42</small></div></article>
            <article><span className="activity-icon"><Icon name="columns" size={15} /></span><div><strong>Priority set to {String(project.custom.priority)}</strong><p>Portal overlay · version 4</p><small>Jul 12 at 14:18</small></div></article>
          </div></section> : null}
        </div>
      </aside>
    </div>
  )
}
