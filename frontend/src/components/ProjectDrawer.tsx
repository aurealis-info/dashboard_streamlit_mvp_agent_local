import { useEffect, useState } from 'react'
import type { ManualMilestoneName, MilestoneStatus, MilestoneUpdate, Project, ProjectUpdate } from '../types'
import { formatDate, formatMoney, statusClass } from '../utils'
import { Icon } from './Icon'

interface ProjectDrawerProps {
  project: Project | null
  onClose: () => void
  onUpdate: (key: string, update: ProjectUpdate) => void
  onMilestoneUpdate: (key: string, milestone: ManualMilestoneName, update: MilestoneUpdate) => void
}

type DrawerTab = 'overview' | 'milestones' | 'work' | 'portal'
const milestoneLabel: Record<MilestoneStatus, string> = { done: 'Done', in_progress: 'In progress', not_started: 'Not started', blocked: 'Blocked' }
const editableStatuses: MilestoneStatus[] = ['not_started', 'in_progress', 'done', 'blocked']

export function ProjectDrawer({ project, onClose, onUpdate, onMilestoneUpdate }: ProjectDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [notes, setNotes] = useState(project?.notes ?? '')
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? '')
  const [portalStatus, setPortalStatus] = useState(project?.portalStatus ?? '')

  useEffect(() => {
    if (!project) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [project, onClose])

  if (!project) return null
  const storyCount = project.epics.reduce((sum, epic) => sum + epic.stories.length, 0)

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
          {([['overview', 'Overview'], ['milestones', 'Milestones · 8'], ['work', `Epics & stories · ${storyCount}`], ['portal', 'Portal fields']] as [DrawerTab, string][]).map(([value, label]) => <button role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} key={value}>{label}</button>)}
        </div>
        <div className="drawer-body">
          {tab === 'overview' ? <>
            <section className="record-section">
              <div className="section-heading"><div><span className="eyebrow">T_APA_PROJECT_CURRENT</span><h3>Source fields</h3></div><span className="read-only-label">Read only</span></div>
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
              <div className="section-heading"><div><span className="eyebrow">LINKED_ISSUES</span><h3>Linked issues</h3></div><small>{project.linkedIssues.length} records</small></div>
              <div className="linked-issue-list">{project.linkedIssues.length ? project.linkedIssues.map((issue) => <article key={issue.key}><span><code>{issue.key}</code><strong>{issue.summary}</strong></span><span>{issue.linkType}</span><em className={statusClass(issue.status)}>{issue.status}</em></article>) : <p>No linked issues are available from the current mart snapshot.</p>}</div>
            </section>
          </> : null}

          {tab === 'milestones' ? <section className="record-section milestone-section">
            <div className="section-heading"><div><span className="eyebrow">T_APA_PROJECT_MILESTONE_CURRENT + overlay</span><h3>Project milestones</h3></div><small>Assessment is JIRA-derived</small></div>
            <div className="milestone-table" role="table" aria-label="Project milestones">
              <div className="milestone-table-head" role="row"><span>Milestone</span><span>Status</span><span>Started</span><span>Completed</span><span>Source</span></div>
              {project.milestones.map((milestone) => {
                const manualName = milestone.name as ManualMilestoneName
                return <div className="milestone-table-row" role="row" key={milestone.name}>
                  <strong>{milestone.name}</strong>
                  {milestone.automatic
                    ? <span className={`milestone-status ${milestone.status}`}><i />{milestoneLabel[milestone.status]}</span>
                    : <label><span className="sr-only">{milestone.name} status</span><select value={milestone.status} onChange={(event) => onMilestoneUpdate(project.key, manualName, { status: event.target.value as MilestoneStatus, startedAt: milestone.startedAt, completedAt: milestone.completedAt })}>{editableStatuses.map((status) => <option value={status} key={status}>{milestoneLabel[status]}</option>)}</select></label>}
                  {milestone.automatic
                    ? <span>{milestone.startedAt ? formatDate(milestone.startedAt) : '—'}</span>
                    : <label className="milestone-date-field"><span className="sr-only">{milestone.name} start date</span><input type="date" value={milestone.startedAt ?? ''} onChange={(event) => onMilestoneUpdate(project.key, manualName, { status: milestone.status, startedAt: event.target.value || undefined, completedAt: milestone.completedAt })} /></label>}
                  {milestone.automatic
                    ? <span>{milestone.completedAt ? formatDate(milestone.completedAt) : '—'}{milestone.durationDays ? <small>{milestone.durationDays} days</small> : null}</span>
                    : <label className="milestone-date-field"><span className="sr-only">{milestone.name} completion date</span><input type="date" value={milestone.completedAt ?? ''} onChange={(event) => onMilestoneUpdate(project.key, manualName, { status: milestone.status, startedAt: milestone.startedAt, completedAt: event.target.value || undefined })} /></label>}
                  <span className="source-type">{milestone.automatic ? 'JIRA' : 'Portal'}</span>
                </div>
              })}
            </div>
          </section> : null}

          {tab === 'work' ? <section className="record-section work-section">
            <div className="section-heading"><div><span className="eyebrow">T_APA_PROJECT_EPIC_STORY_CURRENT</span><h3>Epics and stories</h3></div><small>{project.epics.length} epics · {storyCount} stories</small></div>
            {project.epics.length ? <div className="epic-list">{project.epics.map((epic) => <details open key={epic.key}><summary><span><code>{epic.key}</code><strong>{epic.name}</strong></span><span className="epic-progress">{epic.progress}%</span></summary><div>{epic.stories.map((story) => <article className="story" key={story.key}><span className={`story-state ${statusClass(story.status)}`} /><span><strong>{story.name}</strong><small><code>{story.key}</code> · {story.points} points · {story.assignee}{story.sprintName ? ` · ${story.sprintName}` : ''}</small></span><em className={statusClass(story.status)}>{story.status}</em></article>)}</div></details>)}</div> : <div className="drawer-empty"><strong>No linked epics</strong><p>Project-to-epic coverage is partial in the current source data.</p></div>}
          </section> : null}

          {tab === 'portal' ? <section className="record-section portal-fields-section">
            <div className="section-heading"><div><span className="eyebrow">APA_PORTAL overlay</span><h3>Editable project context</h3></div><span className="audit-safe"><Icon name="check" size={12} />Append-only history</span></div>
            <div className="portal-form">
              <label><span>Target date</span><input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} /></label>
              <label><span>Portal status</span><input value={portalStatus} onChange={(event) => setPortalStatus(event.target.value)} placeholder="Not set" /></label>
              <label className="span-two"><span>Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={7} /></label>
            </div>
            <div className="portal-form-footer"><span>Last changed {project.updatedAt}</span><button className="button primary" type="button" onClick={savePortalFields}>Save portal fields</button></div>
          </section> : null}
        </div>
      </aside>
    </div>
  )
}
