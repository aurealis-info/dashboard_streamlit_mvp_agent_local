import { milestoneNames } from './types'
import type { Epic, FieldDefinition, LinkedIssue, Milestone, Project, ResourceIssue } from './types'

export const initialFields: FieldDefinition[] = []
export const initialResourceFields: FieldDefinition[] = []

const milestoneWindows = [
  ['2026-04-27', '2026-05-08'],
  ['2026-05-11', '2026-05-15'],
  ['2026-05-18', '2026-05-29'],
  ['2026-06-01', '2026-06-12'],
  ['2026-06-15', '2026-07-03'],
  ['2026-07-06', '2026-07-24'],
  ['2026-07-27', '2026-08-07'],
  ['2026-08-10', '2026-08-14'],
] as const

function shiftDate(value: string, offsetDays: number) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function milestones(activeIndex: number, blockedIndex = -1, offsetDays = 0): Milestone[] {
  return milestoneNames.map((name, index) => {
    const automatic = index === 0
    const [windowStart, windowEnd] = milestoneWindows[index]
    const startedAt = shiftDate(windowStart, offsetDays)
    const completedAt = shiftDate(windowEnd, offsetDays)
    return {
      name,
      status: index === blockedIndex ? 'blocked' : index < activeIndex ? 'done' : index === activeIndex ? 'in_progress' : 'not_started',
      startedAt: automatic && index > activeIndex ? undefined : startedAt,
      completedAt: automatic && index >= activeIndex ? undefined : completedAt,
      durationDays: automatic && activeIndex > 0 ? 11 : undefined,
      automatic,
    }
  })
}

function epicIssue(key: string, summary: string, status = 'In Progress'): LinkedIssue {
  return { key, linkType: 'implements', isEpic: true, status, summary }
}

const noCustomFields: Record<string, string | number | boolean> = {}

const claimsEpics: Epic[] = [
  { key: 'APA-E71', name: 'Document classification', progress: 78, stories: [
    { key: 'APA-1901', name: 'Classify inbound claim documents', points: 8, status: 'Done', assignee: 'Nora Ali', sprintName: 'APA 26.14' },
    { key: 'APA-1902', name: 'Route low-confidence documents', points: 5, status: 'In progress', assignee: 'Sam Roy', sprintName: 'APA 26.15' },
  ] },
  { key: 'APA-E84', name: 'Exception workbench', progress: 42, stories: [
    { key: 'APA-1930', name: 'Review queue and ownership', points: 8, status: 'In progress', assignee: 'Leo Kim', sprintName: 'APA 26.15' },
    { key: 'APA-1931', name: 'Audit event export', points: 3, status: 'To do', assignee: 'Maya Chen' },
  ] },
]

export const initialProjects: Project[] = [
  {
    key: 'APA-1842', name: 'Claims intake automation', sourceKey: 'APA', peatsNumber: 'PEATS-10482', reporter: 'Iris Laurent', account: 'Customer Care', budgetCode: 'CC-4260', cp4Name: 'Claims Operations', manager: 'Maya Chen', managerInitials: 'MC', quotedPrice: 184000, developmentStatus: 'AA Dev',
    linkedIssues: [epicIssue('APA-E71', 'Document classification'), epicIssue('APA-E84', 'Exception workbench')], milestones: milestones(5, -1, 0), epics: claimsEpics,
    portalStatus: '', targetDate: '2026-08-28', notes: 'Confirm the UAT data set with Customer Care before the end-to-end testing window.', updatedAt: '8 min ago', custom: noCustomFields,
  },
  {
    key: 'APA-1816', name: 'Invoice exception routing', sourceKey: 'APA', peatsNumber: 'PEATS-10391', reporter: 'Ravi Singh', account: 'Finance Operations', budgetCode: 'FIN-2184', cp4Name: 'Invoice Operations', manager: 'Jon Bell', managerInitials: 'JB', quotedPrice: 96000, developmentStatus: 'Funding',
    linkedIssues: [epicIssue('APA-E62', 'Exception triage', 'Blocked')], milestones: milestones(2, -1, 28), epics: [{ key: 'APA-E62', name: 'Exception triage', progress: 35, stories: [{ key: 'APA-1878', name: 'Detect invoice exception type', points: 8, status: 'In progress', assignee: 'Eva Tran', sprintName: 'APA 26.15' }, { key: 'APA-1879', name: 'Assign resolution team', points: 5, status: 'Blocked', assignee: 'Jon Bell' }] }],
    portalStatus: '', targetDate: '2026-09-12', notes: 'Funding decision is scheduled for the July governance meeting.', updatedAt: '1 hr ago', custom: noCustomFields,
  },
  {
    key: 'APA-1799', name: 'Access provisioning', sourceKey: 'APA', peatsNumber: 'PEATS-10275', reporter: 'Avery Brooks', account: 'People & Culture', budgetCode: 'PC-1172', cp4Name: 'Employee Technology', manager: 'Leila Mora', managerInitials: 'LM', quotedPrice: 128000, developmentStatus: 'Funding',
    linkedIssues: [epicIssue('APA-E58', 'Identity workflow', 'Blocked')], milestones: milestones(2, 2, 49), epics: [{ key: 'APA-E58', name: 'Identity workflow', progress: 20, stories: [{ key: 'APA-1822', name: 'Create joiner request', points: 5, status: 'Done', assignee: 'Leila Mora' }, { key: 'APA-1823', name: 'Provision target systems', points: 13, status: 'Blocked', assignee: 'Omar Patel' }] }],
    portalStatus: '', targetDate: '2026-10-03', notes: 'Security architecture approval is required before Technical ARP can begin.', updatedAt: 'Yesterday', custom: noCustomFields,
  },
  {
    key: 'APA-1774', name: 'Network change validation', sourceKey: 'APA', peatsNumber: 'PEATS-10164', reporter: 'Camille Dubois', account: 'Network', budgetCode: 'NET-8841', cp4Name: 'Network Assurance', manager: 'Omar Patel', managerInitials: 'OP', quotedPrice: 210000, developmentStatus: 'E2E Testing',
    linkedIssues: [epicIssue('APA-E51', 'Validation orchestration')], milestones: milestones(6, -1, -14), epics: [{ key: 'APA-E51', name: 'Validation orchestration', progress: 86, stories: [{ key: 'APA-1780', name: 'Validate router configuration', points: 8, status: 'Done', assignee: 'Omar Patel' }, { key: 'APA-1781', name: 'Publish validation report', points: 5, status: 'In progress', assignee: 'Ava Roy', sprintName: 'APA 26.15' }] }],
    portalStatus: '', targetDate: '2026-07-31', notes: 'E2E cycle two is active. No critical defects remain open.', updatedAt: '2 days ago', custom: noCustomFields,
  },
  {
    key: 'APA-1748', name: 'Retail order reconciliation', sourceKey: 'APA', peatsNumber: 'PEATS-10042', reporter: 'Morgan Foster', account: 'Retail', budgetCode: 'RTL-3091', cp4Name: 'Order Management', manager: 'Nora Ali', managerInitials: 'NA', quotedPrice: 74000, developmentStatus: 'Deployment',
    linkedIssues: [epicIssue('APA-E47', 'Order matching', 'Done')], milestones: milestones(8, -1, -61), epics: [{ key: 'APA-E47', name: 'Order matching', progress: 100, stories: [{ key: 'APA-1755', name: 'Match order and payment', points: 8, status: 'Done', assignee: 'Nora Ali' }] }],
    portalStatus: '', targetDate: '2026-06-14', notes: 'Production verification is complete.', updatedAt: 'Jun 18', custom: noCustomFields,
  },
  {
    key: 'APA-1861', name: 'Contract renewal alerts', sourceKey: 'APA', peatsNumber: 'PEATS-10526', reporter: 'Taylor Nguyen', account: 'Enterprise Sales', budgetCode: 'SAL-5528', cp4Name: 'Retention', manager: 'Eva Tran', managerInitials: 'ET', quotedPrice: 112000, developmentStatus: 'Technical ARP',
    linkedIssues: [epicIssue('APA-E92', 'Renewal detection')], milestones: milestones(3, -1, 98), epics: [{ key: 'APA-E92', name: 'Renewal detection', progress: 45, stories: [{ key: 'APA-1974', name: 'Detect expiring contracts', points: 8, status: 'In progress', assignee: 'Eva Tran', sprintName: 'APA 26.15' }] }],
    portalStatus: '', targetDate: '2026-11-21', notes: 'Architecture package is prepared for review.', updatedAt: 'Jul 12', custom: noCustomFields,
  },
  {
    key: 'APA-1887', name: 'Field service dispatch', sourceKey: 'APA', peatsNumber: 'PEATS-10604', reporter: 'Dana Cole', account: 'Field Operations', budgetCode: 'FOP-6402', cp4Name: 'Dispatch', manager: 'Sam Roy', managerInitials: 'SR', quotedPrice: 156000, developmentStatus: 'ARP',
    linkedIssues: [epicIssue('APA-E98', 'Dispatch foundation', 'To Do')], milestones: milestones(1, -1, 112), epics: [{ key: 'APA-E98', name: 'Dispatch foundation', progress: 12, stories: [{ key: 'APA-2011', name: 'Model technician availability', points: 8, status: 'To do', assignee: 'Sam Roy' }] }],
    portalStatus: '', targetDate: '2026-12-05', notes: 'Discovery is complete and operations leaders have confirmed the initial scenarios.', updatedAt: 'Jul 14', custom: noCustomFields,
  },
  {
    key: 'APA-1894', name: 'Fraud case enrichment', sourceKey: 'APA', peatsNumber: 'PEATS-10641', reporter: 'Priya Rao', account: 'Risk & Compliance', budgetCode: 'RSK-7710', cp4Name: 'Fraud Operations', manager: 'Leo Kim', managerInitials: 'LK', quotedPrice: 238000, developmentStatus: 'Data Eng',
    linkedIssues: [epicIssue('APA-E101', 'Case context service', 'Blocked')], milestones: milestones(4, -1, 42), epics: [{ key: 'APA-E101', name: 'Case context service', progress: 48, stories: [{ key: 'APA-2032', name: 'Join customer identity signals', points: 13, status: 'In progress', assignee: 'Leo Kim', sprintName: 'APA 26.15' }, { key: 'APA-2033', name: 'Surface device risk history', points: 8, status: 'Blocked', assignee: 'Maya Chen' }] }],
    portalStatus: '', targetDate: '2026-09-26', notes: 'Two source systems still need approved data-sharing agreements.', updatedAt: '3 hrs ago', custom: noCustomFields,
  },
]

export const initialResourceIssues: ResourceIssue[] = initialProjects.flatMap((project) => project.epics.flatMap((epic) => epic.stories.map((story) => ({
  sprintIssueKey: `${story.sprintName ?? 'UNSCHEDULED'}:${story.key}`,
  issueKey: story.key,
  summary: story.name,
  status: story.status,
  assignee: story.assignee,
  sprintName: story.sprintName ?? 'Unscheduled',
  storyPoints: story.points,
  epicKey: epic.key,
  epicName: epic.name,
  projectKey: project.key,
  projectName: project.name,
  custom: noCustomFields,
}))))
