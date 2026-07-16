import type { FieldDefinition, MilestoneName, NewProjectInput, Project, ProjectUpdate } from '../types'

/**
 * The UI depends on this contract rather than on local demo storage. Replace the
 * implementation with fetch calls to /api/v1 when the Flask service is ready.
 */
export interface ProjectRepository {
  listProjects(): Promise<Project[]>
  updateProject(projectKey: string, changes: ProjectUpdate, version?: number): Promise<Project>
  updateField(projectKey: string, field: FieldDefinition, value: string | number | boolean, version?: number): Promise<Project>
  // Deliberately excludes the derived Intake stage; this method maps to the
  // governed manual-milestone endpoint in architecture_guide.md.
  moveProject(projectKey: string, milestone: MilestoneName, version?: number): Promise<Project>
  createProject(input: NewProjectInput): Promise<Project>
  listFieldDefinitions(): Promise<FieldDefinition[]>
  createFieldDefinition(field: FieldDefinition): Promise<FieldDefinition>
}

export const apiRoutes = {
  projects: '/api/v1/projects',
  projectOverrides: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/overrides`,
  projectMilestones: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/milestones`,
  projectEpics: (projectKey: string) => `/api/v1/projects/${encodeURIComponent(projectKey)}/epics`,
  fieldDefinitions: '/api/v1/field-definitions',
} as const
