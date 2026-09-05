import type { Channel, DayPoint, MetricRow, MetricsResponse, Segment, SegmentPoint, Totals } from './types'
import { SEGMENTS } from './types'

export interface MetricsQuery {
  readonly from?: string
  readonly to?: string
  readonly segments?: readonly Segment[]
  readonly channels?: readonly Channel[]
  readonly q?: string
  /** Drill-down to one day, set by clicking a point on the daily chart. */
  readonly day?: string
}

function matches(row: MetricRow, query: MetricsQuery): boolean {
  if (query.from && row.date < query.from) return false
  if (query.to && row.date > query.to) return false
  if (query.segments?.length && !query.segments.includes(row.segment)) return false
  if (query.channels?.length && !query.channels.includes(row.channel)) return false
  if (query.q) {
    const needle = query.q.trim().toLowerCase()
    if (needle) {
      const haystack = `${row.channel} ${row.segment} ${row.country} ${row.device}`
      if (!haystack.includes(needle)) return false
    }
  }
  return true
}

function totalsOf(rows: readonly MetricRow[]): Totals {
  let sessions = 0
  let signups = 0
  let revenue = 0
  for (const row of rows) {
    sessions += row.sessions
    signups += row.signups
    revenue += row.revenue
  }
  return {
    rows: rows.length,
    sessions,
    signups,
    revenue,
    conversion: sessions === 0 ? 0 : signups / sessions,
  }
}

function byDayOf(rows: readonly MetricRow[]): DayPoint[] {
  const days = new Map<string, { sessions: number; signups: number; revenue: number }>()
  for (const row of rows) {
    const day = days.get(row.date) ?? { sessions: 0, signups: 0, revenue: 0 }
    day.sessions += row.sessions
    day.signups += row.signups
    day.revenue += row.revenue
    days.set(row.date, day)
  }
  return [...days.entries()]
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function bySegmentOf(rows: readonly MetricRow[]): SegmentPoint[] {
  return SEGMENTS.map((segment) => {
    const of = rows.filter((row) => row.segment === segment)
    const totals = totalsOf(of)
    return {
      segment,
      sessions: totals.sessions,
      signups: totals.signups,
      revenue: totals.revenue,
    }
  })
}

/**
 * The whole answer in one place: the table rows, both charts and the totals are
 * computed from the same filtered set, so they cannot disagree about a number.
 *
 * The day drill-down is applied last and only to the table side — the daily
 * chart keeps its full shape so you can see where you are.
 */
export function selectMetrics(all: readonly MetricRow[], query: MetricsQuery): MetricsResponse {
  const filtered = all.filter((row) => matches(row, query))
  const unfilteredDays = byDayOf(filtered)
  const rows = query.day ? filtered.filter((row) => row.date === query.day) : filtered

  return {
    rows,
    totals: totalsOf(rows),
    byDay: query.day ? byDayOf(rows) : unfilteredDays,
    bySegment: bySegmentOf(rows),
    unfilteredDays,
  }
}
