import type { MetricsResponse } from './types'
import type { DashboardSearch } from './search'
import { toQuery } from './search'

/** Thrown instead of a bare Response so components never touch transport details. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function metricsUrl(search: DashboardSearch): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(toQuery(search))) {
    if (value === undefined || value === '') continue
    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  const query = params.toString()
  return query ? `/api/metrics?${query}` : '/api/metrics'
}

/** The only place that knows the data arrives over HTTP. */
export async function fetchMetrics(
  search: DashboardSearch,
  signal?: AbortSignal,
): Promise<MetricsResponse> {
  try {
    return await request(search, signal)
  } catch (error) {
    // The mock API lives in a service worker, and a service worker can be
    // stopped by the browser or taken over by another tab. When that happens
    // the request falls through to the static host, which answers unknown
    // paths with index.html. Restart the worker once and ask again.
    if (!(error instanceof UnreadableResponse)) throw error
    const { startMockApi } = await import('../mocks/browser')
    await startMockApi()
    return request(search, signal)
  }
}

class UnreadableResponse extends ApiError {}

async function request(search: DashboardSearch, signal?: AbortSignal): Promise<MetricsResponse> {
  let response: Response
  try {
    response = await fetch(metricsUrl(search), { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('The server did not answer. Check your connection and try again.', 0)
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : `The server refused the request (${response.status}).`
    throw new ApiError(message, response.status)
  }

  // A 200 that is not the answer we asked for is a failure, not empty data.
  if (typeof body !== 'object' || body === null || !Array.isArray((body as MetricsResponse).rows)) {
    throw new UnreadableResponse(
      'The answer could not be read. Reload the page and try again.',
      response.status,
    )
  }

  return body as MetricsResponse
}
