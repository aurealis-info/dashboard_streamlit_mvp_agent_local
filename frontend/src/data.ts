import type { FieldDefinition, Project } from './types'

export const initialFields: FieldDefinition[] = [
  { id: 'priority', label: 'Priority', type: 'enum', options: ['Critical', 'High', 'Medium', 'Low'] },
  { id: 'sponsor', label: 'Sponsor', type: 'text' },
]

const milestones = (active: number, blocked = -1) => [
  { name: 'Assessment', status: 'done' as const, date: 'May 08', durationDays: 6, automatic: true },
  { name: 'ARP', status: active === 1 ? 'in_progress' as const : active > 1 ? 'done' as const : 'not_started' as const, date: active >= 1 ? 'May 21' : undefined },
  { name: 'Funding', status: blocked === 2 ? 'blocked' as const : active === 2 ? 'in_progress' as const : active > 2 ? 'done' as const : 'not_started' as const },
  { name: 'Technical ARP', status: active === 3 ? 'in_progress' as const : active > 3 ? 'done' as const : 'not_started' as const },
  { name: 'Data Eng', status: active === 4 ? 'in_progress' as const : active > 4 ? 'done' as const : 'not_started' as const },
  { name: 'AA Dev', status: active === 5 ? 'in_progress' as const : active > 5 ? 'done' as const : 'not_started' as const },
  { name: 'E2E Testing', status: active === 6 ? 'in_progress' as const : active > 6 ? 'done' as const : 'not_started' as const },
  { name: 'Deployment', status: active === 7 ? 'in_progress' as const : active > 7 ? 'done' as const : 'not_started' as const },
]

export const initialProjects: Project[] = [
  {
    key: 'APA-1842', name: 'Claims intake automation', client: 'Customer care', owner: 'Maya Chen', ownerInitials: 'MC',
    status: 'On track', currentMilestone: 'AA Dev', targetDate: '2026-08-28', progress: 68, budget: 184000,
    notes: 'Development is tracking to plan. Confirm the UAT data set with Customer Care by Friday.', updatedAt: '8 min ago',
    milestones: milestones(5), custom: { priority: 'High', sponsor: 'I. Laurent' },
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
    milestones: milestones(2), custom: { priority: 'Critical', sponsor: 'R. Singh' },
    epics: [{ key: 'APA-E62', name: 'Exception triage', progress: 35, stories: [
      { key: 'APA-1878', name: 'Detect invoice exception type', points: 8, status: 'In progress', assignee: 'Eva Tran' },
      { key: 'APA-1879', name: 'Assign resolution team', points: 5, status: 'Blocked', assignee: 'Jon Bell' },
    ]}],
  },
  {
    key: 'APA-1799', name: 'Access provisioning', client: 'People & culture', owner: 'Leila Mora', ownerInitials: 'LM',
    status: 'Blocked', currentMilestone: 'Funding', targetDate: '2026-10-03', progress: 24, budget: 128000,
    notes: 'Security architecture approval is required before technical ARP can begin.', updatedAt: 'Yesterday',
    milestones: milestones(2, 2), custom: { priority: 'High', sponsor: 'A. Brooks' },
    epics: [{ key: 'APA-E58', name: 'Identity workflow', progress: 20, stories: [
      { key: 'APA-1822', name: 'Create joiner request', points: 5, status: 'Done', assignee: 'Leila Mora' },
      { key: 'APA-1823', name: 'Provision target systems', points: 13, status: 'Blocked', assignee: 'Omar Patel' },
    ]}],
  },
  {
    key: 'APA-1774', name: 'Network change validation', client: 'Network', owner: 'Omar Patel', ownerInitials: 'OP',
    status: 'On track', currentMilestone: 'E2E Testing', targetDate: '2026-07-31', progress: 86, budget: 210000,
    notes: 'E2E cycle two begins Wednesday. No critical defects remain open.', updatedAt: '2 days ago',
    milestones: milestones(6), custom: { priority: 'Medium', sponsor: 'C. Dubois' },
    epics: [{ key: 'APA-E51', name: 'Validation orchestration', progress: 86, stories: [
      { key: 'APA-1780', name: 'Validate router configuration', points: 8, status: 'Done', assignee: 'Omar Patel' },
      { key: 'APA-1781', name: 'Publish validation report', points: 5, status: 'In progress', assignee: 'Ava Roy' },
    ]}],
  },
  {
    key: 'APA-1748', name: 'Retail order reconciliation', client: 'Retail', owner: 'Nora Ali', ownerInitials: 'NA',
    status: 'Complete', currentMilestone: 'Deployment', targetDate: '2026-06-14', progress: 100, budget: 74000,
    notes: 'Production verification complete. Benefits tracking handed to Retail Operations.', updatedAt: 'Jun 18',
    milestones: milestones(8), custom: { priority: 'Low', sponsor: 'M. Foster' },
    epics: [{ key: 'APA-E47', name: 'Order matching', progress: 100, stories: [
      { key: 'APA-1755', name: 'Match order and payment', points: 8, status: 'Done', assignee: 'Nora Ali' },
    ]}],
  },
  {
    key: 'APA-1861', name: 'Contract renewal alerts', client: 'Enterprise sales', owner: 'Eva Tran', ownerInitials: 'ET',
    status: 'On track', currentMilestone: 'Technical ARP', targetDate: '2026-11-21', progress: 44, budget: 112000,
    notes: 'Architecture package is prepared for review.', updatedAt: 'Jul 12',
    milestones: milestones(3), custom: { priority: 'Medium', sponsor: 'T. Nguyen' },
    epics: [{ key: 'APA-E92', name: 'Renewal detection', progress: 45, stories: [
      { key: 'APA-1974', name: 'Detect expiring contracts', points: 8, status: 'In progress', assignee: 'Eva Tran' },
    ]}],
  },
]
