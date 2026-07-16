import { milestoneNames } from './types'
import type { FieldDefinition, Milestone, Project } from './types'

export const initialFields: FieldDefinition[] = [
  { id: 'priority', label: 'Priority', type: 'enum', options: ['Critical', 'High', 'Medium', 'Low'], visible: true, active: true },
  { id: 'sponsor', label: 'Executive sponsor', type: 'text', visible: true, active: true },
  { id: 'governance', label: 'Governance', type: 'enum', options: ['Not started', 'In review', 'Approved'], visible: true, active: true },
  { id: 'benefit_score', label: 'Benefit score', type: 'number', visible: false, active: true },
]

const milestones = (active: number, blocked = -1): Milestone[] => milestoneNames.map((name, index) => ({
  name,
  status: blocked === index ? 'blocked' : index < active ? 'done' : index === active ? 'in_progress' : 'not_started',
  date: index < active ? ['May 08', 'May 21', 'Jun 03', 'Jun 18', 'Jul 02', 'Jul 15', 'Jul 27', 'Aug 08'][index] : undefined,
  durationDays: index === 0 ? 6 : undefined,
  automatic: index === 0,
}))

export const initialProjects: Project[] = [
  {
    key: 'APA-1842', name: 'Claims intake automation', client: 'Customer care', owner: 'Maya Chen', ownerInitials: 'MC',
    status: 'On track', currentMilestone: 'AA Dev', targetDate: '2026-08-28', progress: 68, budget: 184000,
    notes: 'Development is tracking to plan. Confirm the UAT data set with Customer Care by Friday.', updatedAt: '8 min ago',
    nextAction: 'Confirm the UAT data set', nextActionDate: '2026-07-17', tags: ['Automation', 'Customer'],
    stakeholders: [{ name: 'Iris Laurent', role: 'Executive sponsor', initials: 'IL' }, { name: 'Nora Ali', role: 'Delivery lead', initials: 'NA' }],
    milestones: milestones(5), custom: { priority: 'High', sponsor: 'I. Laurent', governance: 'Approved', benefit_score: 88 },
    epics: [
      { key: 'APA-E71', name: 'Document classification', progress: 78, stories: [
        { key: 'APA-1901', name: 'Classify inbound claim documents', points: 8, status: 'Done', assignee: 'Nora Ali' },
        { key: 'APA-1902', name: 'Route low-confidence documents', points: 5, status: 'In progress', assignee: 'Sam Roy' },
      ]},
      { key: 'APA-E84', name: 'Exception workbench', progress: 42, stories: [
        { key: 'APA-1930', name: 'Review queue and ownership', points: 8, status: 'In progress', assignee: 'Leo Kim' },
        { key: 'APA-1931', name: 'Audit event export', points: 3, status: 'To do', assignee: 'Maya Chen' },
      ]},
    ],
  },
  {
    key: 'APA-1816', name: 'Invoice exception routing', client: 'Finance ops', owner: 'Jon Bell', ownerInitials: 'JB',
    status: 'At risk', currentMilestone: 'Funding', targetDate: '2026-09-12', progress: 32, budget: 96000,
    notes: 'Funding decision moved to the July governance meeting. Scope is otherwise stable.', updatedAt: '1 hr ago',
    nextAction: 'Secure governance funding decision', nextActionDate: '2026-07-16', tags: ['Finance', 'Governance'],
    stakeholders: [{ name: 'Ravi Singh', role: 'Executive sponsor', initials: 'RS' }, { name: 'Jon Bell', role: 'Program owner', initials: 'JB' }],
    milestones: milestones(2), custom: { priority: 'Critical', sponsor: 'R. Singh', governance: 'In review', benefit_score: 93 },
    epics: [{ key: 'APA-E62', name: 'Exception triage', progress: 35, stories: [
      { key: 'APA-1878', name: 'Detect invoice exception type', points: 8, status: 'In progress', assignee: 'Eva Tran' },
      { key: 'APA-1879', name: 'Assign resolution team', points: 5, status: 'Blocked', assignee: 'Jon Bell' },
    ]}],
  },
  {
    key: 'APA-1799', name: 'Access provisioning', client: 'People & culture', owner: 'Leila Mora', ownerInitials: 'LM',
    status: 'Blocked', currentMilestone: 'Funding', targetDate: '2026-10-03', progress: 24, budget: 128000,
    notes: 'Security architecture approval is required before technical ARP can begin.', updatedAt: 'Yesterday',
    nextAction: 'Resolve security architecture exception', nextActionDate: '2026-07-16', tags: ['Identity', 'Security'],
    stakeholders: [{ name: 'Avery Brooks', role: 'Executive sponsor', initials: 'AB' }, { name: 'Omar Patel', role: 'Technical lead', initials: 'OP' }],
    milestones: milestones(2, 2), custom: { priority: 'High', sponsor: 'A. Brooks', governance: 'In review', benefit_score: 76 },
    epics: [{ key: 'APA-E58', name: 'Identity workflow', progress: 20, stories: [
      { key: 'APA-1822', name: 'Create joiner request', points: 5, status: 'Done', assignee: 'Leila Mora' },
      { key: 'APA-1823', name: 'Provision target systems', points: 13, status: 'Blocked', assignee: 'Omar Patel' },
    ]}],
  },
  {
    key: 'APA-1774', name: 'Network change validation', client: 'Network', owner: 'Omar Patel', ownerInitials: 'OP',
    status: 'On track', currentMilestone: 'E2E Testing', targetDate: '2026-07-31', progress: 86, budget: 210000,
    notes: 'E2E cycle two begins Wednesday. No critical defects remain open.', updatedAt: '2 days ago',
    nextAction: 'Close cycle-two regression pack', nextActionDate: '2026-07-20', tags: ['Network', 'Quality'],
    stakeholders: [{ name: 'Camille Dubois', role: 'Executive sponsor', initials: 'CD' }, { name: 'Ava Roy', role: 'QA lead', initials: 'AR' }],
    milestones: milestones(6), custom: { priority: 'Medium', sponsor: 'C. Dubois', governance: 'Approved', benefit_score: 71 },
    epics: [{ key: 'APA-E51', name: 'Validation orchestration', progress: 86, stories: [
      { key: 'APA-1780', name: 'Validate router configuration', points: 8, status: 'Done', assignee: 'Omar Patel' },
      { key: 'APA-1781', name: 'Publish validation report', points: 5, status: 'In progress', assignee: 'Ava Roy' },
    ]}],
  },
  {
    key: 'APA-1748', name: 'Retail order reconciliation', client: 'Retail', owner: 'Nora Ali', ownerInitials: 'NA',
    status: 'Complete', currentMilestone: 'Deployment', targetDate: '2026-06-14', progress: 100, budget: 74000,
    notes: 'Production verification complete. Benefits tracking handed to Retail Operations.', updatedAt: 'Jun 18',
    nextAction: 'Review 30-day benefits realization', nextActionDate: '2026-07-21', tags: ['Retail', 'Live'],
    stakeholders: [{ name: 'Morgan Foster', role: 'Executive sponsor', initials: 'MF' }, { name: 'Nora Ali', role: 'Delivery lead', initials: 'NA' }],
    milestones: milestones(8), custom: { priority: 'Low', sponsor: 'M. Foster', governance: 'Approved', benefit_score: 82 },
    epics: [{ key: 'APA-E47', name: 'Order matching', progress: 100, stories: [
      { key: 'APA-1755', name: 'Match order and payment', points: 8, status: 'Done', assignee: 'Nora Ali' },
    ]}],
  },
  {
    key: 'APA-1861', name: 'Contract renewal alerts', client: 'Enterprise sales', owner: 'Eva Tran', ownerInitials: 'ET',
    status: 'On track', currentMilestone: 'Technical ARP', targetDate: '2026-11-21', progress: 44, budget: 112000,
    notes: 'Architecture package is prepared for review.', updatedAt: 'Jul 12',
    nextAction: 'Present architecture package', nextActionDate: '2026-07-22', tags: ['Sales', 'Retention'],
    stakeholders: [{ name: 'Taylor Nguyen', role: 'Executive sponsor', initials: 'TN' }, { name: 'Eva Tran', role: 'Program owner', initials: 'ET' }],
    milestones: milestones(3), custom: { priority: 'Medium', sponsor: 'T. Nguyen', governance: 'Approved', benefit_score: 79 },
    epics: [{ key: 'APA-E92', name: 'Renewal detection', progress: 45, stories: [
      { key: 'APA-1974', name: 'Detect expiring contracts', points: 8, status: 'In progress', assignee: 'Eva Tran' },
    ]}],
  },
  {
    key: 'APA-1887', name: 'Field service dispatch', client: 'Field operations', owner: 'Sam Roy', ownerInitials: 'SR',
    status: 'On track', currentMilestone: 'ARP', targetDate: '2026-12-05', progress: 18, budget: 156000,
    notes: 'Discovery complete. Operations leaders aligned on the initial dispatch scenarios.', updatedAt: 'Jul 14',
    nextAction: 'Approve the target-state process map', nextActionDate: '2026-07-24', tags: ['Field ops', 'Scheduling'],
    stakeholders: [{ name: 'Dana Cole', role: 'Executive sponsor', initials: 'DC' }, { name: 'Sam Roy', role: 'Program owner', initials: 'SR' }],
    milestones: milestones(1), custom: { priority: 'Medium', sponsor: 'D. Cole', governance: 'Not started', benefit_score: 84 },
    epics: [{ key: 'APA-E98', name: 'Dispatch foundation', progress: 12, stories: [
      { key: 'APA-2011', name: 'Model technician availability', points: 8, status: 'To do', assignee: 'Sam Roy' },
    ]}],
  },
  {
    key: 'APA-1894', name: 'Fraud case enrichment', client: 'Risk & compliance', owner: 'Leo Kim', ownerInitials: 'LK',
    status: 'At risk', currentMilestone: 'Data Eng', targetDate: '2026-09-26', progress: 53, budget: 238000,
    notes: 'Two source systems still need approved data-sharing agreements.', updatedAt: '3 hrs ago',
    nextAction: 'Escalate data-sharing agreement', nextActionDate: '2026-07-18', tags: ['Risk', 'Data'],
    stakeholders: [{ name: 'Priya Rao', role: 'Executive sponsor', initials: 'PR' }, { name: 'Leo Kim', role: 'Data lead', initials: 'LK' }],
    milestones: milestones(4), custom: { priority: 'Critical', sponsor: 'P. Rao', governance: 'Approved', benefit_score: 96 },
    epics: [{ key: 'APA-E101', name: 'Case context service', progress: 48, stories: [
      { key: 'APA-2032', name: 'Join customer identity signals', points: 13, status: 'In progress', assignee: 'Leo Kim' },
      { key: 'APA-2033', name: 'Surface device risk history', points: 8, status: 'Blocked', assignee: 'Maya Chen' },
    ]}],
  },
]

export const ownerOptions = Array.from(new Set(initialProjects.map((project) => project.owner))).sort()
