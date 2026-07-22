import type { ManualMilestoneName, Milestone, MilestoneStatus, MilestoneUpdate } from '../types'
import { dateRangeDays, formatDate, formatDateRange } from '../utils'
import { Icon } from './Icon'
import { SelectMenu } from './SelectMenu'
import type { SelectMenuOption } from './SelectMenu'

const milestoneLabel: Record<MilestoneStatus, string> = {
  done: 'Done',
  in_progress: 'In progress',
  not_started: 'Not started',
  blocked: 'Blocked',
}

const milestoneStatusOptions: SelectMenuOption<MilestoneStatus>[] = (
  ['not_started', 'in_progress', 'done', 'blocked'] as MilestoneStatus[]
).map((status) => ({ value: status, label: milestoneLabel[status], tone: status }))

interface MilestoneScheduleProps {
  projectKey: string
  milestones: Milestone[]
  targetDate?: string
  onMilestoneUpdate: (key: string, milestone: ManualMilestoneName, update: MilestoneUpdate) => void
}

interface MilestoneDateFieldProps {
  milestone: Milestone
  boundary: 'start' | 'end'
  onChange: (value?: string) => void
}

function MilestoneDateField({ milestone, boundary, onChange }: MilestoneDateFieldProps) {
  const isStart = boundary === 'start'
  const value = isStart ? milestone.startedAt : milestone.completedAt
  const constraint = isStart ? { max: milestone.completedAt } : { min: milestone.startedAt }
  const label = `${milestone.name} ${boundary} date`

  return (
    <label className={`milestone-date-field ${value ? '' : 'empty'}`.trim()}>
      <Icon name="calendar" size={13} />
      <span className="sr-only">{label}</span>
      <input
        type="date"
        value={value ?? ''}
        aria-label={label}
        {...constraint}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </label>
  )
}

function scheduleBoundary(milestones: Milestone[], boundary: 'startedAt' | 'completedAt') {
  const dates = milestones.map((milestone) => milestone[boundary]).filter((value): value is string => Boolean(value)).sort()
  return boundary === 'startedAt' ? dates[0] : dates[dates.length - 1]
}

export function MilestoneSchedule({ projectKey, milestones, targetDate, onMilestoneUpdate }: MilestoneScheduleProps) {
  const manualMilestones = milestones.filter((milestone) => !milestone.automatic)
  const scheduledCount = manualMilestones.filter((milestone) => milestone.startedAt && milestone.completedAt).length
  const scheduleStart = scheduleBoundary(milestones, 'startedAt')
  const scheduleEnd = scheduleBoundary(milestones, 'completedAt')

  const updateManualMilestone = (milestone: Milestone, changes: Partial<MilestoneUpdate>) => {
    onMilestoneUpdate(projectKey, milestone.name as ManualMilestoneName, {
      status: milestone.status,
      startedAt: milestone.startedAt,
      completedAt: milestone.completedAt,
      ...changes,
    })
  }

  return (
    <section className="record-section milestone-section">
      <div className="section-heading milestone-section-heading">
        <div>
          <h3>Lifecycle schedule</h3>
          <p>Set the planned start and end date for every workspace-managed stage.</p>
        </div>
        <span className="read-only-label"><Icon name="lock" size={11} />Assessment syncs from JIRA</span>
      </div>

      <div className="schedule-context" aria-label="Project schedule summary">
        <span><Icon name="calendar" size={15} /><span><small>Project window</small><strong>{formatDateRange(scheduleStart, scheduleEnd, 'Dates not set')}</strong></span></span>
        <span><span><small>Manual coverage</small><strong>{scheduledCount} of {manualMilestones.length} stages dated</strong></span></span>
        <span><span><small>Target date</small><strong>{targetDate ? formatDate(targetDate) : 'Not set'}</strong></span></span>
      </div>

      <div className="milestone-table" role="table" aria-label="Project milestone schedule" aria-rowcount={milestones.length + 1}>
        <div className="milestone-table-head" role="row">
          <span role="columnheader">Stage</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Start date</span>
          <span role="columnheader">End date</span>
          <span role="columnheader">Source</span>
        </div>
        {milestones.map((milestone, index) => {
          const duration = dateRangeDays(milestone.startedAt, milestone.completedAt)
          return <div className={`milestone-table-row ${milestone.automatic ? 'automatic' : 'manual'}`} role="row" key={milestone.name}>
            <div className="milestone-name-cell" role="cell">
              <span className="milestone-order">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{milestone.name}</strong><small>{duration ? `${duration} calendar ${duration === 1 ? 'day' : 'days'}` : 'Dates required'}</small></span>
            </div>
            <div role="cell">
              {milestone.automatic
                ? <span className={`milestone-status ${milestone.status}`}><span className={`select-menu-status tone-${milestone.status}`}>{milestone.status === 'done' ? <Icon name="check" size={9} /> : null}</span>{milestoneLabel[milestone.status]}</span>
                : <SelectMenu
                    ariaLabel={`${milestone.name} status`}
                    value={milestone.status}
                    options={milestoneStatusOptions}
                    className="milestone-inline-select"
                    onValueChange={(status) => updateManualMilestone(milestone, { status })}
                  />}
            </div>
            <div role="cell">
              {milestone.automatic
                ? <span className="milestone-source-date"><Icon name="lock" size={11} />{milestone.startedAt ? formatDate(milestone.startedAt) : '—'}</span>
                : <MilestoneDateField milestone={milestone} boundary="start" onChange={(startedAt) => updateManualMilestone(milestone, { startedAt })} />}
            </div>
            <div role="cell">
              {milestone.automatic
                ? <span className="milestone-source-date"><Icon name="lock" size={11} />{milestone.completedAt ? formatDate(milestone.completedAt) : '—'}</span>
                : <MilestoneDateField milestone={milestone} boundary="end" onChange={(completedAt) => updateManualMilestone(milestone, { completedAt })} />}
            </div>
            <span className={`source-type ${milestone.automatic ? 'jira' : 'manual'}`} role="cell">{milestone.automatic ? 'JIRA' : 'Manual'}</span>
          </div>
        })}
      </div>
      <p className="schedule-footnote"><Icon name="clock" size={12} />Dates save immediately. Stages may overlap; only an end date before its own start date is blocked.</p>
    </section>
  )
}
