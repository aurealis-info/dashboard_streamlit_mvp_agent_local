import type { Project } from '../types'
import { formatMoney } from '../utils'

interface PortfolioPulseProps { projects: Project[] }

export function PortfolioPulse({ projects }: PortfolioPulseProps) {
  const active = projects.filter((project) => project.status !== 'Complete')
  const attention = active.filter((project) => project.status === 'At risk' || project.status === 'Blocked')
  const investment = projects.reduce((total, project) => total + project.budget, 0)
  const deliveredMilestones = projects.reduce((total, project) => total + project.milestones.filter((milestone) => milestone.status === 'done').length, 0)
  const totalMilestones = projects.length * 8
  const health = active.length ? Math.round(((active.length - attention.length) / active.length) * 100) : 100

  return (
    <section className="portfolio-ledger" aria-label="Portfolio summary">
      <div className="ledger-intro">
        <span className="eyebrow">Portfolio pulse</span>
        <strong>{active.length} active initiatives</strong>
        <small>Updated from the semantic marts</small>
      </div>
      <div className="ledger-stat"><span>Delivery health</span><strong>{health}%</strong><small className="positive-copy">↑ 4.2 points this month</small></div>
      <div className="ledger-stat"><span>Needs attention</span><strong>{attention.length}</strong><small>{attention.filter((project) => project.status === 'Blocked').length} currently blocked</small></div>
      <div className="ledger-stat"><span>Committed value</span><strong>{formatMoney(investment, true)}</strong><small>FY26 portfolio</small></div>
      <div className="ledger-stat milestone-stat">
        <span>Milestones delivered</span><strong>{deliveredMilestones}<i> / {totalMilestones}</i></strong>
        <div className="mini-bar" aria-label={`${Math.round((deliveredMilestones / totalMilestones) * 100)} percent delivered`}><i style={{ width: `${(deliveredMilestones / totalMilestones) * 100}%` }} /></div>
      </div>
    </section>
  )
}
