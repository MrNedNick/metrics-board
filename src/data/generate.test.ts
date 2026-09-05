import { describe, expect, it } from 'vitest'
import { HISTORY_DAYS, ROW_COUNT, generateRows } from './generate'
import { CHANNELS, COUNTRIES, DEVICES, SEGMENTS } from './types'

describe('dataset', () => {
  const rows = generateRows()

  it('is the size the dashboard advertises', () => {
    expect(rows).toHaveLength(ROW_COUNT)
  })

  it('is the same dataset for the same seed', () => {
    const again = generateRows()
    expect(again[0]).toEqual(rows[0])
    expect(again.at(-1)).toEqual(rows.at(-1))
  })

  it('changes with the seed', () => {
    expect(generateRows(1, 50)[0]).not.toEqual(generateRows(2, 50)[0])
  })

  it('only holds values the filters know about', () => {
    for (const row of rows.slice(0, 500)) {
      expect(CHANNELS).toContain(row.channel)
      expect(SEGMENTS).toContain(row.segment)
      expect(DEVICES).toContain(row.device)
      expect(COUNTRIES).toContain(row.country)
      expect(row.signups).toBeLessThanOrEqual(row.sessions)
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('covers the advertised history and no more', () => {
    const days = new Set(rows.map((row) => row.date))
    expect(days.size).toBeLessThanOrEqual(HISTORY_DAYS)
    expect(days.size).toBeGreaterThan(HISTORY_DAYS - 5)
  })

  it('comes back newest first', () => {
    const dates = rows.slice(0, 200).map((row) => row.date)
    expect([...dates].sort().reverse()).toEqual(dates)
  })
})
