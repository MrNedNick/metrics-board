import type {
  Channel,
  ChannelPoint,
  Comparison,
  DayPoint,
  MetricRow,
  MetricsResponse,
  Segment,
  SegmentPoint,
  Totals,
} from './types'
import { CHANNELS, SEGMENTS } from './types'

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

function byChannelOf(rows: readonly MetricRow[]): ChannelPoint[] {
  return CHANNELS.map((channel) => {
    const totals = totalsOf(rows.filter((row) => row.channel === channel))
    return {
      channel,
      sessions: totals.sessions,
      signups: totals.signups,
      revenue: totals.revenue,
    }
  })
}

/** `YYYY-MM-DD` moved by whole days; UTC so a daylight-saving switch cannot skip one. */
export function shiftDay(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function daysInclusive(from: string, to: string): number {
  const [a, b] = [from, to].map((iso) => {
    const [year, month, day] = iso.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  })
  return Math.round((b - a) / 86_400_000) + 1
}

function totalsIn(rows: readonly MetricRow[], from: string, to: string): Totals {
  return totalsOf(rows.filter((row) => row.date >= from && row.date <= to))
}

/**
 * The window on screen against the window of the same length just before it,
 * under the same segment, channel and search filters. When the data does not
 * reach that far back — the default view already covers the whole history —
 * the later half of the window is compared with the earlier half instead, and
 * the label says so.
 */
function comparisonOf(all: readonly MetricRow[], query: MetricsQuery): Comparison | null {
  if (all.length === 0) return null
  let first = all[0].date
  let last = all[0].date
  for (const row of all) {
    if (row.date < first) first = row.date
    if (row.date > last) last = row.date
  }

  const from = query.day ?? (query.from && query.from > first ? query.from : first)
  const to = query.day ?? (query.to && query.to < last ? query.to : last)
  if (from > to) return null

  const scoped = all.filter((row) =>
    matches(row, { ...query, from: undefined, to: undefined, day: undefined }),
  )
  const length = daysInclusive(from, to)
  const before = shiftDay(from, -length)

  if (before >= first) {
    return {
      label: length === 1 ? 'vs the day before' : `vs the previous ${length} days`,
      current: totalsIn(scoped, from, to),
      previous: totalsIn(scoped, before, shiftDay(from, -1)),
    }
  }

  const half = Math.floor(length / 2)
  if (query.day || half < 1) return null
  const laterFrom = shiftDay(to, -(half - 1))
  return {
    label: half === 1 ? 'on the last day vs the day before' : `in the last ${half} days vs the ${half} before`,
    current: totalsIn(scoped, laterFrom, to),
    previous: totalsIn(scoped, shiftDay(laterFrom, -half), shiftDay(laterFrom, -1)),
  }
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
    byChannel: byChannelOf(rows),
    comparison: comparisonOf(all, query),
    unfilteredDays,
  }
}
