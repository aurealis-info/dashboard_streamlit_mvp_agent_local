export type ProjectStatus = 'On track' | 'At risk' | 'Blocked' | 'Complete'
export type MilestoneStatus = 'done' | 'in_progress' | 'not_started' | 'blocked'
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'enum'
export type ViewMode = 'table' | 'board'

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
  date?: string
  durationDays?: number
  automatic?: boolean
}

export interface Story {
  key: string
  name: string
  points: number
  status: 'To do' | 'In progress' | 'Done' | 'Blocked'
  assignee: string
}

export interface Epic {
  key: string
  name: string
  progress: number
  stories: Story[]
}

export interface Stakeholder {
  name: string
  role: string
  initials: string
}

export interface Project {
  key: string
  name: string
  client: string
  owner: string
  ownerInitials: string
  status: ProjectStatus
  currentMilestone: MilestoneName
  targetDate: string
  progress: number
  budget: number
  notes: string
  updatedAt: string
  nextAction: string
  nextActionDate: string
  tags: string[]
  stakeholders: Stakeholder[]
  milestones: Milestone[]
  epics: Epic[]
  custom: Record<string, string | number | boolean>
}

export interface ProjectUpdate {
  status?: ProjectStatus
  currentMilestone?: MilestoneName
  progress?: number
  targetDate?: string
  notes?: string
  nextAction?: string
  nextActionDate?: string
}

export interface NewProjectInput {
  name: string
  client: string
  owner: string
  targetDate: string
  budget: number
  priority: string
}
