import type { FieldDefinition, Project } from './types'

const moneyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const compactMoneyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', notation: 'compact', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' })

export function formatMoney(value: number, compact = false) {
  return (compact ? compactMoneyFormatter : moneyFormatter).format(value)
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`))
}

export function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function normalizeFieldId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function attentionScore(project: Project) {
  const statusScore = project.status === 'Blocked' ? 4 : project.status === 'At risk' ? 3 : project.status === 'On track' ? 1 : 0
  const priority = String(project.custom.priority)
  const priorityScore = priority === 'Critical' ? 3 : priority === 'High' ? 2 : priority === 'Medium' ? 1 : 0
  return statusScore + priorityScore
}

export function createDefaultValue(field: FieldDefinition): string | number | boolean {
  if (field.type === 'boolean') return false
  if (field.type === 'number') return 0
  if (field.type === 'enum') return field.options?.[0] ?? ''
  return ''
}

export function isDueSoon(date: string) {
  return date <= '2026-07-18'
}
