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
