export type ProjectStatus = 'On track' | 'At risk' | 'Blocked' | 'Complete'
export type MilestoneStatus = 'done' | 'in_progress' | 'not_started' | 'blocked'
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'enum'

export interface FieldDefinition {
  id: string
  label: string
  type: FieldType
  options?: string[]
}

export interface Milestone {
  name: string
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

export interface Project {
  key: string
  name: string
  client: string
  owner: string
  ownerInitials: string
  status: ProjectStatus
  currentMilestone: string
  targetDate: string
  progress: number
  budget: number
  notes: string
  updatedAt: string
  milestones: Milestone[]
  epics: Epic[]
  custom: Record<string, string | number | boolean>
}
