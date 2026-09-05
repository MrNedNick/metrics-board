import { CHANNELS, COUNTRIES, DEVICES, SEGMENTS } from './types'
import type { Channel, Country, Device, MetricRow, Segment } from './types'

/** Days of history the dataset covers. */
export const HISTORY_DAYS = 120
export const ROW_COUNT = 10_000

/**
 * A seeded generator, so the dataset is the same in every browser, in every
 * test run, and in every screenshot — and so nothing has to be committed as a
 * 2 MB JSON file.
 */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(random: () => number, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = random() * total
  for (let index = 0; index < items.length; index += 1) {
    roll -= weights[index]
    if (roll <= 0) return items[index]
  }
  return items[items.length - 1]
}

function isoDay(daysAgo: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const CHANNEL_WEIGHTS = [40, 22, 14, 16, 8]
const SEGMENT_WEIGHTS = [46, 40, 14]
const DEVICE_WEIGHTS = [48, 44, 8]
const COUNTRY_WEIGHTS = [26, 20, 24, 12, 9, 9]

/** How much each channel and segment is worth, so the charts have a shape. */
const CHANNEL_QUALITY: Record<Channel, number> = {
  search: 1,
  social: 0.72,
  email: 1.24,
  direct: 1.15,
  referral: 0.9,
}

const SEGMENT_VALUE: Record<Segment, number> = {
  new: 1,
  returning: 1.45,
  enterprise: 6.2,
}

export function generateRows(seed = 20260905, count = ROW_COUNT): MetricRow[] {
  const random = mulberry32(seed)
  const rows: MetricRow[] = []

  for (let index = 0; index < count; index += 1) {
    const daysAgo = Math.floor(random() * HISTORY_DAYS)
    const date = isoDay(daysAgo)
    const channel = pick<Channel>(random, CHANNELS, CHANNEL_WEIGHTS)
    const segment = pick<Segment>(random, SEGMENTS, SEGMENT_WEIGHTS)
    const device = pick<Device>(random, DEVICES, DEVICE_WEIGHTS)
    const country = pick<Country>(random, COUNTRIES, COUNTRY_WEIGHTS)

    // A gentle upward trend towards today, plus a weekend dip.
    const weekday = new Date(`${date}T12:00:00`).getDay()
    const weekend = weekday === 0 || weekday === 6 ? 0.62 : 1
    const trend = 0.75 + ((HISTORY_DAYS - daysAgo) / HISTORY_DAYS) * 0.5

    const sessions = Math.max(1, Math.round((6 + random() * 140) * weekend * trend))
    const rate = 0.014 + random() * 0.075 * CHANNEL_QUALITY[channel]
    const signups = Math.min(sessions, Math.round(sessions * rate))
    const revenue = Math.round(signups * (34 + random() * 90) * SEGMENT_VALUE[segment])

    rows.push({
      id: `r-${index.toString(36)}`,
      date,
      channel,
      segment,
      country,
      device,
      sessions,
      signups,
      revenue,
    })
  }

  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
