import { z } from 'zod'
import { CHANNELS, SEGMENTS } from './types'
import type { Channel, Segment } from './types'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export const SORTABLE = [
  'date',
  'channel',
  'segment',
  'country',
  'device',
  'sessions',
  'signups',
  'revenue',
] as const
export type SortField = (typeof SORTABLE)[number]

/**
 * Search parameters arrive as flat strings (see `stringifySearch` in the
 * router), so lists come in comma-separated: `?segments=new,enterprise`.
 * A link is meant to be read and sent to a colleague, not decoded.
 */
function csv<T extends string>(allowed: readonly T[]) {
  return (value: unknown): T[] | undefined => {
    const parts =
      typeof value === 'string'
        ? value.split(',')
        : Array.isArray(value)
          ? value.map(String)
          : []
    const valid = parts.filter((part): part is T => (allowed as readonly string[]).includes(part))
    return valid.length ? valid : undefined
  }
}

const day = z.string().regex(ISO_DAY, 'expected YYYY-MM-DD')

const schema = z.object({
  from: day.optional(),
  to: day.optional(),
  segments: z.preprocess(csv<Segment>(SEGMENTS), z.array(z.enum(SEGMENTS)).optional()),
  channels: z.preprocess(csv<Channel>(CHANNELS), z.array(z.enum(CHANNELS)).optional()),
  q: z.string().trim().max(60).optional(),
  day: day.optional(),
  sort: z.enum(SORTABLE).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  /** Makes the API fail on purpose, so the error state can be shown on demand. */
  fail: z.coerce.number().int().min(1).max(1).optional(),
})

export type DashboardSearch = z.infer<typeof schema> & {
  /**
   * Names of parameters that were dropped as invalid. Underscore-prefixed keys
   * never reach the URL (see `stringifySearch`), so this explains the reset
   * once and then disappears.
   */
  _dropped?: string[]
}

/**
 * What the last validation threw away.
 *
 * It lives outside React on purpose: cleaning the URL re-navigates, the route
 * component remounts, and anything held in its state would vanish along with
 * the explanation the person still needs to read.
 */
let lastDropped: readonly string[] = []
const listeners = new Set<() => void>()

export function droppedParams(): readonly string[] {
  return lastDropped
}

export function subscribeToDropped(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function reportDropped(next: readonly string[]): void {
  if (next.length === lastDropped.length && next.every((key, i) => key === lastDropped[i])) return
  lastDropped = next
  listeners.forEach((listener) => listener())
}

/** Called once the person has moved on — the notice has done its job. */
export function clearDroppedParams(): void {
  reportDropped([])
}

/**
 * Never throws. A link with a broken parameter has to open — with that one
 * parameter dropped and said out loud — rather than showing an error page.
 */
export function validateSearch(raw: Record<string, unknown>): DashboardSearch {
  const result = schema.safeParse(raw)
  if (result.success) return result.data

  const dropped = new Set<string>()
  for (const issue of result.error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string') dropped.add(key)
  }

  const cleaned: Record<string, unknown> = { ...raw }
  for (const key of dropped) delete cleaned[key]

  const retry = schema.safeParse(cleaned)

  // Every dropped key is set to `undefined` rather than left out: the router
  // merges this result over the raw search, so an omitted key keeps its broken
  // value while an explicit `undefined` overwrites it.
  const blanks = Object.fromEntries([...dropped].map((key) => [key, undefined]))
  reportDropped([...dropped])

  return {
    ...(retry.success ? retry.data : {}),
    ...blanks,
    _dropped: [...dropped],
  }
}

/** What the API actually needs — the presentation-only keys stay behind. */
export function toQuery(search: DashboardSearch) {
  const { sort, dir, _dropped, ...query } = search
  void sort
  void dir
  void _dropped
  return query
}

export function isFiltered(search: DashboardSearch): boolean {
  return Boolean(
    search.from ||
      search.to ||
      search.segments?.length ||
      search.channels?.length ||
      search.q ||
      search.day,
  )
}
