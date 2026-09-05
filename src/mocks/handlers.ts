import { HttpResponse, delay, http } from 'msw'
import { generateRows } from '../data/generate'
import { selectMetrics } from '../data/filters'
import type { MetricsQuery } from '../data/filters'
import { CHANNELS, SEGMENTS } from '../data/types'
import type { Channel, MetricRow, Segment } from '../data/types'

/** Long enough that the loading states are real, short enough to stay pleasant. */
let latencyMs = 320

/** Tests run the same handlers without the demo latency. */
export function setApiLatency(ms: number): void {
  latencyMs = ms
}

let dataset: MetricRow[] | null = null

function rows(): MetricRow[] {
  dataset ??= generateRows()
  return dataset
}

function listParam<T extends string>(
  url: URL,
  name: string,
  allowed: readonly T[],
): T[] | undefined {
  const raw = url.searchParams.getAll(name).flatMap((value) => value.split(','))
  const valid = raw.filter((value): value is T => (allowed as readonly string[]).includes(value))
  return valid.length ? valid : undefined
}

export const handlers = [
  http.get('/api/metrics', async ({ request }) => {
    await delay(latencyMs)
    const url = new URL(request.url)

    // A deliberate failure switch, so the error state can be seen on demand
    // instead of only when something is actually broken.
    if (url.searchParams.get('fail') === '1') {
      return HttpResponse.json(
        { message: 'The metrics service is not answering right now.' },
        { status: 503 },
      )
    }

    const query: MetricsQuery = {
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      segments: listParam<Segment>(url, 'segments', SEGMENTS),
      channels: listParam<Channel>(url, 'channels', CHANNELS),
      q: url.searchParams.get('q') ?? undefined,
      day: url.searchParams.get('day') ?? undefined,
    }

    return HttpResponse.json(selectMetrics(rows(), query))
  }),
]
