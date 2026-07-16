export type MilestoneStatus = 'done' | 'in_progress' | 'not_started' | 'blocked'
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'enum'

export const milestoneNames = [
  'Assessment',
  'ARP',
  'Funding',
  'Technical ARP',
  'Data Eng',
  'AA Dev',
  'E2E Testing',
  'Deployment',
] as const

export type MilestoneName = (typeof milestoneNames)[number]
export type ManualMilestoneName = Exclude<MilestoneName, 'Assessment'>

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  options?: string[]
  visible: boolean
  active: boolean
}

export interface Milestone {
  name: MilestoneName
  status: MilestoneStatus
  startedAt?: string
  completedAt?: string
  durationDays?: number
  automatic: boolean
}

export interface LinkedIssue {
  key: string
  linkType: string
  isEpic: boolean
  status: string
  summary: string
}

export interface Story {
  key: string
  name: string
  points: number
  status: 'To do' | 'In progress' | 'Done' | 'Blocked'
  assignee: string
  sprintName?: string
}

export interface Epic {
  key: string
  name: string
  progress: number
  stories: Story[]
}

/**
 * Merged API read model: documented JIRA mart fields plus portal-owned fields.
 * The backend remains responsible for keeping the base fields read-only.
 */
export interface Project {
  key: string
  name: string
  sourceKey: string
  peatsNumber: string
  reporter: string
  account: string
  budgetCode: string
  cp4Name: string
  manager: string
  managerInitials: string
  quotedPrice: number
  developmentStatus: string
  linkedIssues: LinkedIssue[]
  milestones: Milestone[]
  epics: Epic[]
  portalStatus: string
  targetDate: string
  notes: string
  updatedAt: string
  custom: Record<string, string | number | boolean>
}

export interface ProjectUpdate {
  portalStatus?: string
  targetDate?: string
  notes?: string
}

export interface MilestoneUpdate {
  status: MilestoneStatus
  startedAt?: string
  completedAt?: string
}
