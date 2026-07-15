import type { Project } from '../types'
import { Icon } from './Icon'

interface PortfolioPulseProps { projects: Project[] }

export function PortfolioPulse({ projects }: PortfolioPulseProps) {
  const active = projects.filter((p) => p.status !== 'Complete').length
  const atRisk = projects.filter((p) => p.status === 'At risk' || p.status === 'Blocked').length
  const investment = projects.reduce((total, p) => total + p.budget, 0)
  return (
    <section className="pulse" aria-label="Portfolio summary">
      <div className="pulse-intro">
        <span className="pulse-kicker"><Icon name="bolt" size={14} /> Portfolio pulse</span>
        <p><strong>{active} active initiatives</strong> across the automation portfolio</p>
      </div>
      <div className="pulse-stat"><small>Delivery health</small><strong>{Math.round(((active - atRisk) / active) * 100)}%</strong><span className="trend positive">+4.2%</span></div>
      <div className="pulse-stat"><small>Needs attention</small><strong>{atRisk}</strong><span className="trend risk">2 this week</span></div>
      <div className="pulse-stat"><small>Committed value</small><strong>${Math.round(investment / 1000)}k</strong><span className="trend">FY26 portfolio</span></div>
      <div className="pulse-stat pulse-delivery"><small>Milestones delivered</small><strong>41 <span>/ 64</span></strong><div className="mini-bar"><i style={{ width: '64%' }} /></div></div>
    </section>
  )
}
