import type { FieldDefinition, ManualMilestoneName, MilestoneUpdate, Project, ProjectUpdate } from '../types'

/**
 * The UI depends on this contract rather than on local demo storage. Replace the
 * implementation with fetch calls to /api/v1 when the Flask service is ready.
 */
export interface ProjectRepository {
  listProjects(): Promise<Project[]>
  updateProject(projectKey: string, changes: ProjectUpdate, version?: number): Promise<Project>
  updateField(projectKey: string, field: FieldDefinition, value: string | number | boolean, version?: number): Promise<Project>
  updateMilestone(projectKey: string, milestone: ManualMilestoneName, changes: MilestoneUpdate, version?: number): Promise<Project>
  listFieldDefinitions(): Promise<FieldDefinition[]>
  createFieldDefinition(field: FieldDefinition): Promise<FieldDefinition>
}

export const apiRoutes = {
  projects: '/api/v1/projects',
  projectOverrides: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/overrides`,
  projectMilestones: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/milestones`,
  projectMilestone: (projectKey: string, milestone: ManualMilestoneName) => `/api/v1/projects/${encodeURIComponent(projectKey)}/milestones/${encodeURIComponent(milestone)}`,
  projectEpics: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/epics`,
  fieldDefinitions: '/api/v1/field-definitions',
} as const
