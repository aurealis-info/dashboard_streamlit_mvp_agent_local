import type { ManualMilestoneName } from '../types'

export const milestoneOverrideAttributes = ['status', 'started_at', 'completed_at'] as const
export type MilestoneOverrideAttribute = (typeof milestoneOverrideAttributes)[number]

export const manualMilestoneTokens = {
  ARP: 'ARP',
  Funding: 'FUNDING',
  'Technical ARP': 'TARP',
  'Data Eng': 'DATA_ENG',
  'AA Dev': 'AA_DEV',
  'E2E Testing': 'E2E_TESTING',
  Deployment: 'DEPLOYMENT',
} as const satisfies Record<ManualMilestoneName, string>

/** Stable APA_OVERRIDES.field_name used by the future Flask/BigQuery adapter. */
export function milestoneOverrideFieldName(
  milestone: ManualMilestoneName,
  attribute: MilestoneOverrideAttribute,
) {
  return `${manualMilestoneTokens[milestone]}.${attribute}`
}

export function milestoneOverrideFieldNames(milestone: ManualMilestoneName) {
  return milestoneOverrideAttributes.map((attribute) => milestoneOverrideFieldName(milestone, attribute))
}
