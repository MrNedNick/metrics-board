import type { ChannelPoint, Comparison, DayPoint, SegmentPoint, Totals } from '../../data/types'
import { formatDay, formatMoney, formatPercent } from '../../lib/format'

export interface Insight {
  readonly id: 'share' | 'conversion' | 'best-day'
  /** The finding in one sentence. */
  readonly title: string
  /** The numbers behind it. */
  readonly detail: string
  readonly trend: 'up' | 'down' | 'flat'
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
const wholePercent = (share: number) => `${Math.round(share * 100)}%`

interface Slice {
  readonly name: string
  readonly sessions: number
  readonly signups: number
  readonly revenue: number
}

/**
 * The segment or channel whose share of revenue outruns its share of visits the
 * most. A group with only one slice left after filtering has nothing to compare,
 * so it is skipped.
 */
export function outsizedShare(
  totals: Totals,
  segments: readonly SegmentPoint[],
  channels: readonly ChannelPoint[],
): Insight | null {
  if (totals.revenue <= 0 || totals.sessions <= 0) return null

  const groups: Slice[][] = [
    segments.map((point) => ({ ...point, name: `${capitalize(point.segment)} visitors bring` })),
    channels.map((point) => ({ ...point, name: `${capitalize(point.channel)} traffic brings` })),
  ]

  let best: { slice: Slice; gap: number } | null = null
  for (const group of groups) {
    const present = group.filter((slice) => slice.sessions > 0)
    if (present.length < 2) continue
    for (const slice of present) {
      const gap = slice.revenue / totals.revenue - slice.sessions / totals.sessions
      if (!best || gap > best.gap) best = { slice, gap }
    }
  }
  if (!best || best.gap < 0.01) return null

  const { slice } = best
  const perSignup = slice.signups ? slice.revenue / slice.signups : 0
  const average = totals.signups ? totals.revenue / totals.signups : 0
  return {
    id: 'share',
    title: `${slice.name} ${wholePercent(slice.revenue / totals.revenue)} of revenue from ${wholePercent(slice.sessions / totals.sessions)} of visits`,
    detail: `${formatMoney(Math.round(perSignup))} per signup, against ${formatMoney(Math.round(average))} on average`,
    trend: 'up',
  }
}

/** Conversion now against the comparison window, in percentage points. */
export function conversionShift(comparison: Comparison | null): Insight | null {
  if (!comparison) return null
  const { current, previous, label } = comparison
  if (current.sessions === 0 || previous.sessions === 0) return null

  const points = (current.conversion - previous.conversion) * 100
  const detail = `${formatPercent(previous.conversion)} → ${formatPercent(current.conversion)}, ${label}`
  if (Math.abs(points) < 0.05) {
    return {
      id: 'conversion',
      title: `Conversion held steady at ${formatPercent(current.conversion)}`,
      detail,
      trend: 'flat',
    }
  }
  return {
    id: 'conversion',
    title: `Conversion ${points > 0 ? 'rose' : 'fell'} ${Math.abs(points).toFixed(1)} pp to ${formatPercent(current.conversion)}`,
    detail,
    trend: points > 0 ? 'up' : 'down',
  }
}

/** The highest-revenue day of the period and how far above the average it sits. */
export function bestDay(days: readonly DayPoint[]): Insight | null {
  if (days.length < 2) return null
  const total = days.reduce((sum, day) => sum + day.revenue, 0)
  if (total <= 0) return null

  const top = days.reduce((best, day) => (day.revenue > best.revenue ? day : best))
  const average = total / days.length
  return {
    id: 'best-day',
    title: `Best day: ${formatDay(top.date, { weekday: 'long', day: 'numeric', month: 'long' })}`,
    detail: `${formatMoney(top.revenue)} revenue — ${(top.revenue / average).toFixed(1)}× the daily average`,
    trend: 'up',
  }
}

export interface InsightSource {
  readonly totals: Totals
  readonly bySegment: readonly SegmentPoint[]
  readonly byChannel: readonly ChannelPoint[]
  readonly byDay: readonly DayPoint[]
  readonly comparison: Comparison | null
}

/** Only findings that are true for the screen as filtered; none when there is no data. */
export function insightsFor(data: InsightSource): Insight[] {
  return [
    outsizedShare(data.totals, data.bySegment, data.byChannel),
    conversionShift(data.comparison),
    bestDay(data.byDay),
  ].filter((insight): insight is Insight => insight !== null)
}
