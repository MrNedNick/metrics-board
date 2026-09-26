import { describe, expect, it } from 'vitest'
import { selectMetrics, shiftDay } from './filters'
import { generateRows } from './generate'
import type { MetricRow } from './types'

const rows = generateRows()
const sum = (list: readonly MetricRow[], key: 'sessions' | 'signups' | 'revenue') =>
  list.reduce((total, row) => total + row[key], 0)

describe('selectMetrics', () => {
  it('leaves the dataset alone when nothing is filtered', () => {
    expect(selectMetrics(rows, {}).rows).toHaveLength(rows.length)
  })

  it('keeps the table, both charts and the totals telling the same story', () => {
    const queries = [
      {},
      { segments: ['enterprise'] as const },
      { channels: ['email', 'search'] as const, q: 'mobile' },
    ]

    for (const query of queries) {
      const result = selectMetrics(rows, query)
      const fromRows = sum(result.rows, 'revenue')
      const fromDays = result.byDay.reduce((total, day) => total + day.revenue, 0)
      const fromSegments = result.bySegment.reduce((total, item) => total + item.revenue, 0)

      expect(result.totals.revenue).toBe(fromRows)
      expect(fromDays).toBe(fromRows)
      expect(fromSegments).toBe(fromRows)
    }
  })

  it('filters by segment and by channel', () => {
    const bySegment = selectMetrics(rows, { segments: ['enterprise'] })
    expect(bySegment.rows.every((row) => row.segment === 'enterprise')).toBe(true)
    expect(bySegment.rows.length).toBeLessThan(rows.length)

    const byChannel = selectMetrics(rows, { channels: ['email'] })
    expect(byChannel.rows.every((row) => row.channel === 'email')).toBe(true)
  })

  it('searches across the text columns', () => {
    const result = selectMetrics(rows, { q: 'tablet' })
    expect(result.rows.length).toBeGreaterThan(0)
    expect(result.rows.every((row) => row.device === 'tablet')).toBe(true)
  })

  it('respects the period', () => {
    const from = rows[Math.floor(rows.length / 2)].date
    const result = selectMetrics(rows, { from })
    expect(result.rows.every((row) => row.date >= from)).toBe(true)
  })

  it('drills into one day without flattening the daily chart', () => {
    const day = rows[0].date
    const result = selectMetrics(rows, { day })

    expect(result.rows.every((row) => row.date === day)).toBe(true)
    // The table is one day; the chart still shows every day of the period.
    expect(result.unfilteredDays.length).toBeGreaterThan(1)
    expect(result.totals.rows).toBe(result.rows.length)
  })

  it('returns an honest zero rather than dividing by zero', () => {
    const result = selectMetrics(rows, { q: 'nothing-matches-this' })
    expect(result.rows).toHaveLength(0)
    expect(result.totals.conversion).toBe(0)
    expect(result.totals.revenue).toBe(0)
  })
})

describe('comparison with the previous period', () => {
  const last = rows.reduce((max, row) => (row.date > max ? row.date : max), rows[0].date)

  it('compares a 30-day window with the 30 days before it, under the same filters', () => {
    const from = shiftDay(last, -29)
    const result = selectMetrics(rows, { from, segments: ['enterprise'] })
    const before = rows.filter(
      (row) =>
        row.segment === 'enterprise' && row.date >= shiftDay(from, -30) && row.date < from,
    )

    expect(result.comparison?.label).toBe('vs the previous 30 days')
    expect(result.comparison?.current.revenue).toBe(result.totals.revenue)
    expect(result.comparison?.previous.revenue).toBe(sum(before, 'revenue'))
  })

  it('compares a drilled-into day with the day before', () => {
    const day = shiftDay(last, -3)
    const result = selectMetrics(rows, { day })
    expect(result.comparison?.label).toBe('vs the day before')
    expect(result.comparison?.previous.sessions).toBe(
      sum(rows.filter((row) => row.date === shiftDay(day, -1)), 'sessions'),
    )
  })

  it('splits the whole history in half when there is nothing before it', () => {
    const result = selectMetrics(rows, {})
    expect(result.comparison?.label).toBe('in the last 60 days vs the 60 before')
    const { current, previous } = result.comparison!
    expect(current.sessions + previous.sessions).toBe(result.totals.sessions)
  })

  it('has nothing to compare for the very first day', () => {
    const first = rows.reduce((min, row) => (row.date < min ? row.date : min), rows[0].date)
    expect(selectMetrics(rows, { day: first }).comparison).toBeNull()
  })

  it('moves days across a daylight-saving switch without losing one', () => {
    expect(shiftDay('2026-10-25', 1)).toBe('2026-10-26')
    expect(shiftDay('2026-03-29', -1)).toBe('2026-03-28')
  })
})
