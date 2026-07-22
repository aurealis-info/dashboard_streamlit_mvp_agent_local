import { useEffect, useState } from 'react'
import { portalStatusOptions } from '../config/workspaceFieldPolicy'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import type { ManualMilestoneName, MilestoneUpdate, Project, ProjectUpdate } from '../types'
import { formatMoney, statusClass } from '../utils'
import { Icon } from './Icon'
import { MilestoneSchedule } from './MilestoneSchedule'
import { SelectMenu } from './SelectMenu'

interface ProjectDrawerProps {
  project: Project | null
  initialTab?: ProjectDrawerTab
  onClose: () => void
  onUpdate: (key: string, update: ProjectUpdate) => void
  onMilestoneUpdate: (key: string, milestone: ManualMilestoneName, update: MilestoneUpdate) => void
}

export type ProjectDrawerTab = 'overview' | 'milestones' | 'work' | 'portal'

export function ProjectDrawer({ project, initialTab = 'overview', onClose, onUpdate, onMilestoneUpdate }: ProjectDrawerProps) {
  const [tab, setTab] = useState<ProjectDrawerTab>(initialTab)
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? '')
  const [portalStatus, setPortalStatus] = useState(project?.portalStatus ?? '')
  useBodyScrollLock(Boolean(project))

  useEffect(() => {
    if (!project) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, onClose])

  if (!project) return null
  const storyCount = project.epics.reduce((sum, epic) => sum + epic.stories.length, 0)
  const resourceSummary = Array.from(project.epics.reduce((rows, epic) => {
    epic.stories.forEach((story) => {
      const current = rows.get(story.assignee) ?? { assignee: story.assignee, sprints: new Set<string>(), issues: 0, openPoints: 0, donePoints: 0 }
      current.sprints.add(story.sprintName ?? 'Unscheduled')
      current.issues += 1
      if (story.status === 'Done') current.donePoints += story.points
      else current.openPoints += story.points
      rows.set(story.assignee, current)
    })
    return rows
  }, new Map<string, { assignee: string; sprints: Set<string>; issues: number; openPoints: number; donePoints: number }>()).values())
    .sort((left, right) => right.openPoints - left.openPoints || left.assignee.localeCompare(right.assignee))

  const savePortalFields = () => {
    onUpdate(project.key, { notes, targetDate, portalStatus })
  }

  return (
    <div className="drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <header className="drawer-head">
          <div className="drawer-toolbar"><span className="source-badge"><Icon name="check" size={13} />JIRA project record</span><button className="icon-button" onClick={onClose} aria-label="Close project"><Icon name="close" /></button></div>
          <div className="record-id"><code>{project.key}</code><span>{project.peatsNumber}</span></div>
          <h2 id="project-title">{project.name}</h2>
          <div className="drawer-summary"><span><small>Account</small><strong>{project.account}</strong></span><span><small>Manager</small><strong>{project.manager}</strong></span><span><small>Quoted price</small><strong>{formatMoney(project.quotedPrice)}</strong></span><span><small>Development status</small><strong>{project.developmentStatus}</strong></span></div>
        </header>
        <div className="tabs" role="tablist" aria-label="Project details">
          {([['overview', 'Overview'], ['milestones', 'Milestones · 8'], ['work', `Work · ${storyCount}`], ['portal', 'Workspace fields']] as [ProjectDrawerTab, string][]).map(([value, label]) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}>{label}</button>)}
        </div>
        <div className="drawer-body">
          {tab === 'overview' ? <>
            <section className="record-section">
              <div className="section-heading"><div><h3>JIRA source fields</h3></div><span className="read-only-label">Read only</span></div>
              <dl className="source-field-grid">
                <div><dt>Root issue key</dt><dd><code>{project.key}</code></dd></div>
                <div><dt>Source key</dt><dd>{project.sourceKey}</dd></div>
                <div><dt>PEATS #</dt><dd>{project.peatsNumber}</dd></div>
                <div><dt>Reporter</dt><dd>{project.reporter}</dd></div>
                <div><dt>Account</dt><dd>{project.account}</dd></div>
                <div><dt>Manager</dt><dd>{project.manager}</dd></div>
                <div><dt>Budget code</dt><dd>{project.budgetCode}</dd></div>
                <div><dt>CP4 name</dt><dd>{project.cp4Name}</dd></div>
                <div><dt>Quoted price</dt><dd>{formatMoney(project.quotedPrice)}</dd></div>
                <div><dt>Development status</dt><dd>{project.developmentStatus}</dd></div>
              </dl>
            </section>
            <section className="record-section">
              <div className="section-heading"><div><h3>Linked issues</h3></div><small>{project.linkedIssues.length} records</small></div>
              <div className="linked-issue-list">{project.linkedIssues.length ? project.linkedIssues.map((issue) => <article key={issue.key}><span><code>{issue.key}</code><strong>{issue.summary}</strong></span><span>{issue.linkType}</span><em className={statusClass(issue.status)}>{issue.status}</em></article>) : <p>No linked issues are available from the current mart snapshot.</p>}</div>
            </section>
          </> : null}

          {tab === 'milestones' ? <MilestoneSchedule projectKey={project.key} milestones={project.milestones} targetDate={project.targetDate} onMilestoneUpdate={onMilestoneUpdate} /> : null}

          {tab === 'work' ? <section className="record-section work-section">
            <div className="section-heading"><div><h3>Delivery resources</h3></div><small>JIRA story assignments</small></div>
            {resourceSummary.length ? <div className="project-resource-table" role="table" aria-label="Project resource workload">
              <div className="project-resource-head" role="row"><span>Assignee</span><span>Sprint</span><span>Issues</span><span>Open pts</span><span>Done pts</span></div>
              {resourceSummary.map((resource) => <div className="project-resource-row" role="row" key={resource.assignee}>
                <strong><span className="avatar">{resource.assignee.split(/\s+/).map((part) => part[0]).join('').slice(0, 2)}</span>{resource.assignee}</strong>
                <span>{Array.from(resource.sprints).join(', ')}</span><span>{resource.issues}</span><span>{resource.openPoints}</span><span>{resource.donePoints}</span>
              </div>)}
            </div> : null}
            <div className="work-subheading"><div><h3>Project → epic → story</h3><small>{project.epics.length} epics · {storyCount} stories</small></div></div>
            {project.epics.length ? <div className="epic-list">{project.epics.map((epic) => <details open key={epic.key}><summary><span><code>{epic.key}</code><strong>{epic.name}</strong></span><span className="epic-progress">{epic.progress}%</span></summary><div>{epic.stories.map((story) => <article className="story" key={story.key}><span className={`story-state ${statusClass(story.status)}`} /><span><strong>{story.name}</strong><small><code>{story.key}</code> · {story.points} points · {story.assignee}{story.sprintName ? ` · ${story.sprintName}` : ''}</small></span><em className={statusClass(story.status)}>{story.status}</em></article>)}</div></details>)}</div> : <div className="drawer-empty"><strong>No linked epics</strong><p>Project-to-epic coverage is partial in the current source data.</p></div>}
          </section> : null}

          {tab === 'portal' ? <section className="record-section portal-fields-section">
            <div className="section-heading"><div><h3>Workspace fields</h3></div><span className="audit-safe"><Icon name="check" size={12} />Append-only history</span></div>
            <div className="portal-form">
              <label><span>Target date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
              {portalStatusOptions.length ? <div className="portal-form-field"><span>Portal status</span><SelectMenu ariaLabel="Portal status" value={portalStatus} options={[{ value: '', label: 'Not set' }, ...portalStatusOptions.map((option) => ({ value: option, label: option }))]} onValueChange={setPortalStatus} /></div> : <label><span>Portal status</span><input value={portalStatus} onChange={(event) => setPortalStatus(event.target.value)} placeholder="Not set" /></label>}
              <label className="span-two"><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} /></label>
            </div>
            <div className="portal-form-footer"><span>Last changed {project.updatedAt}</span><button className="button primary" type="button" onClick={savePortalFields}>Save workspace fields</button></div>
          </section> : null}
        </div>
      </aside>
    </div>
  )
}
