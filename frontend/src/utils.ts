import type { FieldDefinition } from './types'

const moneyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const compactMoneyFormatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', notation: 'compact', maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric' })

export function formatMoney(value: number, compact = false) {
  return (compact ? compactMoneyFormatter : moneyFormatter).format(value)
}

export function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`))
}

export function formatDateRange(start?: string, end?: string, emptyLabel = 'Set dates') {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`
  if (start) return `Starts ${formatDate(start)}`
  if (end) return `Ends ${formatDate(end)}`
  return emptyLabel
}

export function dateRangeDays(start?: string, end?: string) {
  if (!start || !end) return null
  const startMs = Date.parse(`${start}T00:00:00Z`)
  const endMs = Date.parse(`${end}T00:00:00Z`)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return null
  return Math.floor((endMs - startMs) / 86_400_000) + 1
}

export function statusClass(status: string) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function normalizeFieldId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export function createDefaultValue(field: FieldDefinition): string | number | boolean {
  if (field.type === 'boolean') return false
  if (field.type === 'number') return 0
  if (field.type === 'enum') return field.options?.[0] ?? ''
  return ''
}
