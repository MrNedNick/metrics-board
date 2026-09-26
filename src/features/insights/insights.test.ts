import { describe, expect, it } from 'vitest'
import { selectMetrics } from '../../data/filters'
import { generateRows } from '../../data/generate'
import type { Comparison, Totals } from '../../data/types'
import { bestDay, conversionShift, insightsFor, outsizedShare } from './insights'

const rows = generateRows()

const totals = (sessions: number, signups: number, revenue = 0): Totals => ({
  rows: 1,
  sessions,
  signups,
  revenue,
  conversion: sessions ? signups / sessions : 0,
})

describe('outsizedShare', () => {
  it('names enterprise on the full dataset — 14% of visits, almost half the revenue', () => {
    const data = selectMetrics(rows, {})
    const insight = outsizedShare(data.totals, data.bySegment, data.byChannel)
    expect(insight?.title).toBe('Enterprise visitors bring 46% of revenue from 14% of visits')
  })

  it('falls back to channels when only one segment is left', () => {
    const data = selectMetrics(rows, { segments: ['enterprise'] })
    const insight = outsizedShare(data.totals, data.bySegment, data.byChannel)
    expect(insight?.title).toMatch(/traffic brings/)
  })

  it('says nothing when one segment and one channel are left', () => {
    const data = selectMetrics(rows, { segments: ['new'], channels: ['email'] })
    expect(outsizedShare(data.totals, data.bySegment, data.byChannel)).toBeNull()
  })
})

describe('conversionShift', () => {
  const comparison = (current: Totals, previous: Totals): Comparison => ({
    label: 'vs the previous 30 days',
    current,
    previous,
  })

  it('reports a rise in percentage points', () => {
    const insight = conversionShift(comparison(totals(1000, 53), totals(1000, 49)))
    expect(insight?.title).toBe('Conversion rose 0.4 pp to 5.3%')
    expect(insight?.detail).toBe('4.9% → 5.3%, vs the previous 30 days')
    expect(insight?.trend).toBe('up')
  })

  it('reports a fall', () => {
    expect(conversionShift(comparison(totals(1000, 40), totals(1000, 50)))?.trend).toBe('down')
  })

  it('calls a tiny change steady', () => {
    expect(conversionShift(comparison(totals(10000, 500), totals(10000, 501)))?.trend).toBe('flat')
  })

  it('says nothing without an earlier window or without visits', () => {
    expect(conversionShift(null)).toBeNull()
    expect(conversionShift(comparison(totals(0, 0), totals(100, 5)))).toBeNull()
  })
})

describe('bestDay', () => {
  it('finds the top day and compares it with the average', () => {
    const insight = bestDay([
      { date: '2026-09-01', sessions: 1, signups: 1, revenue: 100 },
      { date: '2026-09-02', sessions: 1, signups: 1, revenue: 300 },
      { date: '2026-09-03', sessions: 1, signups: 1, revenue: 200 },
    ])
    expect(insight?.title).toBe('Best day: Wednesday 2 September')
    expect(insight?.detail).toBe('€300 revenue — 1.5× the daily average')
  })

  it('needs at least two days', () => {
    expect(bestDay([{ date: '2026-09-01', sessions: 1, signups: 1, revenue: 100 }])).toBeNull()
  })
})

describe('insightsFor', () => {
  it('returns nothing for an empty selection', () => {
    const data = selectMetrics(rows, { q: 'nothing-matches-this' })
    expect(data.rows).toHaveLength(0)
    expect(insightsFor(data)).toEqual([])
  })

  it('stays true to the filters on screen', () => {
    const data = selectMetrics(rows, { channels: ['social'] })
    const titles = insightsFor(data).map((insight) => insight.title)
    // Social is the only channel left, so the share finding has to come from segments.
    expect(titles[0]).toMatch(/visitors bring/)
  })
})
