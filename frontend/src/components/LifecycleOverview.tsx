import { useRef } from 'react'
import { developmentStages } from '../types'
import type { DevelopmentStage, Project } from '../types'
import { attentionScore, formatMoney } from '../utils'
import { Icon } from './Icon'

interface LifecycleOverviewProps {
  projects: Project[]
  selectedStage: DevelopmentStage | 'All'
  onSelectStage: (stage: DevelopmentStage | 'All') => void
}

export function LifecycleOverview({ projects, selectedStage, onSelectStage }: LifecycleOverviewProps) {
  const stageScroller = useRef<HTMLDivElement>(null)

  const moveRibbon = (direction: -1 | 1) => {
    stageScroller.current?.scrollBy({ left: direction * 520, behavior: 'smooth' })
  }

  return (
    <section className="lifecycle-overview" aria-labelledby="lifecycle-title">
      <header className="section-header compact">
        <div>
          <span className="section-kicker">Portfolio flow</span>
          <h2 id="lifecycle-title">Development lifecycle</h2>
          <p>Nine operating stages. Select one to narrow the initiative workspace.</p>
        </div>
        <div className="lifecycle-controls">
          {selectedStage !== 'All' ? <button className="clear-stage" type="button" onClick={() => onSelectStage('All')}>Clear stage filter</button> : null}
          <span className="ribbon-nav" aria-label="Scroll lifecycle stages">
            <button type="button" onClick={() => moveRibbon(-1)} aria-label="Scroll stages left"><Icon name="chevron" size={15} /></button>
            <button type="button" onClick={() => moveRibbon(1)} aria-label="Scroll stages right"><Icon name="chevron" size={15} /></button>
          </span>
        </div>
      </header>
      <div className="stage-ribbon" ref={stageScroller} role="group" aria-label="Development stage metrics">
        {developmentStages.map((stage, index) => {
          const stageProjects = projects.filter((project) => project.currentMilestone === stage)
          const investment = stageProjects.reduce((sum, project) => sum + project.budget, 0)
          const attention = stageProjects.filter((project) => attentionScore(project) >= 5).length
          const averageProgress = stageProjects.length
            ? Math.round(stageProjects.reduce((sum, project) => sum + project.progress, 0) / stageProjects.length)
            : 0
          const selected = selectedStage === stage

          return (
            <button
              type="button"
              className={`stage-metric ${selected ? 'selected' : ''}`}
              aria-pressed={selected}
              aria-label={`${stage}: ${stageProjects.length} ${stageProjects.length === 1 ? 'initiative' : 'initiatives'}, ${formatMoney(investment, true)} committed`}
              onClick={() => onSelectStage(selected ? 'All' : stage)}
              key={stage}
            >
              <span className="stage-topline"><code>{String(index + 1).padStart(2, '0')}</code>{index === 0 ? <em>Derived</em> : index === 1 ? <em className="automatic">JIRA</em> : <span>{attention ? `${attention} attention` : 'Healthy'}</span>}</span>
              <span className="stage-name">{stage}</span>
              <span className="stage-volume"><strong>{stageProjects.length}</strong><small>{stageProjects.length === 1 ? 'initiative' : 'initiatives'}</small></span>
              <span className="stage-details"><span><small>Committed</small><strong>{formatMoney(investment, true)}</strong></span><span><small>Avg. progress</small><strong>{averageProgress}%</strong></span></span>
              <span className="stage-progress" aria-hidden="true"><i style={{ width: `${averageProgress}%` }} /></span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
