/** The shape of one row of the dataset, and of everything derived from it. */

export const CHANNELS = ['search', 'social', 'email', 'direct', 'referral'] as const
export const SEGMENTS = ['new', 'returning', 'enterprise'] as const
export const DEVICES = ['desktop', 'mobile', 'tablet'] as const
export const COUNTRIES = ['DE', 'GB', 'US', 'PL', 'ES', 'NL'] as const

export type Channel = (typeof CHANNELS)[number]
export type Segment = (typeof SEGMENTS)[number]
export type Device = (typeof DEVICES)[number]
export type Country = (typeof COUNTRIES)[number]

export interface MetricRow {
  readonly id: string
  /** Local calendar day, `YYYY-MM-DD`. */
  readonly date: string
  readonly channel: Channel
  readonly segment: Segment
  readonly country: Country
  readonly device: Device
  readonly sessions: number
  readonly signups: number
  /** Whole currency units, not cents — the dataset is a report, not a ledger. */
  readonly revenue: number
}

export interface Totals {
  readonly rows: number
  readonly sessions: number
  readonly signups: number
  readonly revenue: number
  /** Signups per session, 0–1. */
  readonly conversion: number
}

export interface DayPoint {
  readonly date: string
  readonly sessions: number
  readonly signups: number
  readonly revenue: number
}

export interface SegmentPoint {
  readonly segment: Segment
  readonly sessions: number
  readonly signups: number
  readonly revenue: number
}

/**
 * One response holds the table rows and both charts. They can never disagree
 * about a number, because they are three views of the same answer.
 */
export interface MetricsResponse {
  readonly rows: readonly MetricRow[]
  readonly totals: Totals
  readonly byDay: readonly DayPoint[]
  readonly bySegment: readonly SegmentPoint[]
  /** Rows before the day drill-down, so the chart keeps its full shape. */
  readonly unfilteredDays: readonly DayPoint[]
}
