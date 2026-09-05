import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchMetrics } from './api'
import type { DashboardSearch } from './search'
import { toQuery } from './search'

/**
 * One query feeds the totals, both charts and the table.
 *
 * `keepPreviousData` is the point of using Query here: changing a filter keeps
 * the previous answer on screen and marks it stale, so the page dims instead of
 * collapsing to skeletons on every keystroke.
 */
export function metricsQueryOptions(search: DashboardSearch) {
  const query = toQuery(search)
  return queryOptions({
    queryKey: ['metrics', query],
    queryFn: ({ signal }) => fetchMetrics(search, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: 1,
  })
}
