const NUMBER = new Intl.NumberFormat('en-GB')
const COMPACT = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
const MONEY = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const PERCENT = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  maximumFractionDigits: 1,
})

export const formatNumber = (value: number) => NUMBER.format(value)
export const formatCompact = (value: number) => COMPACT.format(value)
export const formatMoney = (value: number) => MONEY.format(value)
export const formatPercent = (value: number) => PERCENT.format(value)

export function formatDay(iso: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', options)
}

/** `YYYY-MM-DD` for a day offset from today, in the local timezone. */
export function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - days)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
