import type { EditableEntityType, FieldDefinition, ManualMilestoneName, MilestoneUpdate, Project, ProjectUpdate, ResourceIssue } from '../types'

export {
  manualMilestoneTokens,
  milestoneOverrideAttributes,
  milestoneOverrideFieldName,
  milestoneOverrideFieldNames,
} from './milestoneSchema'
export type { MilestoneOverrideAttribute } from './milestoneSchema'

/**
 * The UI depends on this contract rather than on local demo storage. Replace the
 * implementation with fetch calls to /api/v1 when the Flask service is ready.
 */
export interface ProjectRepository {
  listProjects(): Promise<Project[]>
  listResources(): Promise<ResourceIssue[]>
  updateProject(projectKey: string, changes: ProjectUpdate, version?: number): Promise<Project>
  updateField(projectKey: string, field: FieldDefinition, value: string | number | boolean, version?: number): Promise<Project>
  updateResourceField(sprintIssueKey: string, field: FieldDefinition, value: string | number | boolean, version?: number): Promise<ResourceIssue>
  updateMilestone(projectKey: string, milestone: ManualMilestoneName, changes: MilestoneUpdate, version?: number): Promise<Project>
  listFieldDefinitions(entityType: EditableEntityType): Promise<FieldDefinition[]>
  createFieldDefinition(field: FieldDefinition): Promise<FieldDefinition>
}

export const apiRoutes = {
  projects: '/api/v1/projects',
  projectOverrides: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/overrides`,
  projectMilestones: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/milestones`,
  projectMilestone: (projectKey: string, milestone: ManualMilestoneName) => `/api/v1/projects/${encodeURIComponent(projectKey)}/milestones/${encodeURIComponent(milestone)}`,
  projectEpics: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/epics`,
  resources: '/api/v1/resources',
  resourceOverrides: (sprintIssueKey: string) => `/api/v1/resources/${encodeURIComponent(sprintIssueKey)}/overrides`,
  fieldDefinitions: '/api/v1/field-definitions',
} as const
