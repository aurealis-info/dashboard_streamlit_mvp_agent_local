import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { Milestone, MilestoneName, MilestoneStatus, Project } from '../types'
import { formatDate } from '../utils'
import { Icon } from './Icon'

const DAY_MS = 86_400_000
const WEEK_WIDTH = 56
const DAY_WIDTH = WEEK_WIDTH / 7

const statusLabels: Record<MilestoneStatus, string> = {
  done: 'Done',
  in_progress: 'In progress',
  blocked: 'Blocked',
  not_started: 'Not started',
}

const shortMilestoneLabels: Record<MilestoneName, string> = {
  Assessment: 'Assessment',
  ARP: 'ARP',
  Funding: 'Funding',
  'Technical ARP': 'TARP',
  'Data Eng': 'Data Eng',
  'AA Dev': 'AA Dev',
  'E2E Testing': 'E2E',
  Deployment: 'Deploy',
}

const monthFormatter = new Intl.DateTimeFormat('en-CA', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const weekFormatter = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })

interface ProjectTimelineProps {
  projects: Project[]
  onSelect: (project: Project) => void
}

interface TimelineSegment {
  key: string
  label: string
  left: number
  width: number
}

interface TimelineScale {
  startMs: number
  endMs: number
  width: number
  weeks: TimelineSegment[]
  months: TimelineSegment[]
  todayLeft: number | null
}

function dateMs(value: string) {
  return Date.parse(`${value}T00:00:00Z`)
}

function startOfWeek(value: number) {
  const date = new Date(value)
  const day = date.getUTCDay()
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((day + 6) % 7))
}

function endOfWeek(value: number) {
  return startOfWeek(value) + (7 * DAY_MS) - 1
}

function positionFor(value: number, startMs: number) {
  return ((value - startMs) / DAY_MS) * DAY_WIDTH
}

function buildScale(projects: Project[], today: number): TimelineScale {
  const dates = projects.flatMap((project) => [
    project.targetDate,
    ...project.milestones.flatMap((milestone) => [milestone.startedAt, milestone.completedAt]),
  ]).filter((value): value is string => Boolean(value)).map(dateMs).filter(Number.isFinite)

  const earliest = dates.length ? Math.min(...dates, today) : today
  const latest = dates.length ? Math.max(...dates, today) : today + (12 * 7 * DAY_MS)
  const startMs = startOfWeek(earliest - (7 * DAY_MS))
  const endMs = endOfWeek(latest + (7 * DAY_MS))
  const endExclusive = endMs + 1
  const width = ((endExclusive - startMs) / DAY_MS) * DAY_WIDTH

  const weeks: TimelineSegment[] = []
  for (let cursor = startMs; cursor < endExclusive; cursor += 7 * DAY_MS) {
    weeks.push({
      key: new Date(cursor).toISOString(),
      label: weekFormatter.format(new Date(cursor)),
      left: positionFor(cursor, startMs),
      width: WEEK_WIDTH,
    })
  }

  const months: TimelineSegment[] = []
  const startDate = new Date(startMs)
  let monthCursor = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1)
  while (monthCursor < endExclusive) {
    const date = new Date(monthCursor)
    const nextMonth = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
    const segmentStart = Math.max(monthCursor, startMs)
    const segmentEnd = Math.min(nextMonth, endExclusive)
    months.push({
      key: date.toISOString(),
      label: monthFormatter.format(date),
      left: positionFor(segmentStart, startMs),
      width: ((segmentEnd - segmentStart) / DAY_MS) * DAY_WIDTH,
    })
    monthCursor = nextMonth
  }

  const todayLeft = today >= startMs && today <= endMs ? positionFor(today, startMs) : null
  return { startMs, endMs, width, weeks, months, todayLeft }
}

function startOfDay(value: number) {
  const date = new Date(value)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function scheduleRange(milestone: Milestone, today: number) {
  if (!milestone.startedAt) return null
  const start = dateMs(milestone.startedAt)
  const end = milestone.completedAt ? dateMs(milestone.completedAt) : milestone.automatic ? today : Number.NaN
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
  return { start, end }
}

function scheduleIssueCount(project: Project) {
  return project.milestones.filter((milestone) => {
    if (milestone.automatic) return false
    if (!milestone.startedAt || !milestone.completedAt) return true
    return dateMs(milestone.completedAt) < dateMs(milestone.startedAt)
  }).length
}

export function ProjectTimeline({ projects, onSelect }: ProjectTimelineProps) {
  const [today] = useState(() => startOfDay(Date.now()))
  const scale = useMemo(() => buildScale(projects, today), [projects, today])
  const timelineStyle = { '--timeline-width': `${scale.width}px` } as CSSProperties

  return (
    <section className="project-timeline" role="region" aria-label="Project timeline">
      <div className="timeline-keybar">
        <span className="timeline-range"><Icon name="calendar" size={14} />{monthFormatter.format(new Date(scale.startMs))} – {monthFormatter.format(new Date(scale.endMs))}</span>
        <div className="timeline-legend" aria-label="Timeline legend">
          {(Object.keys(statusLabels) as MilestoneStatus[]).map((status) => <span key={status}><i className={`timeline-status-dot ${status}`} />{statusLabels[status]}</span>)}
          <span><i className="timeline-target-key" />Target date</span>
        </div>
      </div>
      <div className="timeline-scroll" tabIndex={0} aria-label="Scrollable project timeline">
        <div className="timeline-grid" style={timelineStyle}>
          <div className="timeline-header-row">
            <div className="timeline-project-header"><strong>Project</strong><span>Owner · schedule coverage</span></div>
            <div className="timeline-scale-header">
              <div className="timeline-month-scale">
                {scale.months.map((month) => <span key={month.key} style={{ left: month.left, width: month.width }}>{month.label}</span>)}
              </div>
              <div className="timeline-week-scale">
                {scale.weeks.map((week) => <span key={week.key} style={{ left: week.left, width: week.width }} title={`Week of ${week.label}`}>{week.label}</span>)}
              </div>
              {scale.todayLeft !== null ? <span className="timeline-today-label" style={{ left: scale.todayLeft }}>Today</span> : null}
            </div>
          </div>

          {projects.map((project) => {
            const issues = scheduleIssueCount(project)
            return <div className="timeline-row" key={project.key}>
              <button type="button" className="timeline-project" onClick={() => onSelect(project)} aria-label={`Edit milestone schedule for ${project.name}`}>
                <span className="timeline-project-copy"><strong>{project.name}</strong><small><code>{project.key}</code> · {project.manager}</small></span>
                <span className={issues ? 'timeline-coverage incomplete' : 'timeline-coverage complete'}>{issues ? `${issues} ${issues === 1 ? 'milestone needs' : 'milestones need'} dates` : 'Schedule complete'}</span>
                <Icon name="chevron" size={13} />
              </button>
              <div className="timeline-track">
                {scale.todayLeft !== null ? <span className="timeline-today-line" style={{ left: scale.todayLeft }} /> : null}
                {project.milestones.map((milestone) => {
                  const range = scheduleRange(milestone, today)
                  if (!range) return null
                  const left = positionFor(range.start, scale.startMs)
                  const width = Math.max(((range.end - range.start) / DAY_MS + 1) * DAY_WIDTH, 20)
                  const endLabel = milestone.completedAt ? formatDate(milestone.completedAt) : 'Today'
                  const label = `${project.name}, ${milestone.name}: ${statusLabels[milestone.status]}, ${formatDate(milestone.startedAt!)} to ${endLabel}`
                  return <button
                    key={milestone.name}
                    type="button"
                    className={`timeline-bar ${milestone.status} ${milestone.automatic ? 'automatic' : ''}`}
                    style={{ left, width }}
                    title={`${milestone.name} · ${statusLabels[milestone.status]} · ${formatDate(milestone.startedAt!)}–${endLabel}${milestone.automatic ? ' · JIRA' : ''}`}
                    aria-label={label}
                    onClick={() => onSelect(project)}
                  ><span>{shortMilestoneLabels[milestone.name]}</span></button>
                })}
                {project.targetDate ? <span className="timeline-target" style={{ left: positionFor(dateMs(project.targetDate), scale.startMs) }} title={`Target date · ${formatDate(project.targetDate)}`}><i /></span> : null}
              </div>
            </div>
          })}
        </div>
      </div>
    </section>
  )
}
