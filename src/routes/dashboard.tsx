import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { Button } from '../components/button/button'
import { EmptyState } from '../components/empty-state/empty-state'
import { Skeleton } from '../components/skeleton/skeleton'
import { metricsQueryOptions } from '../data/queries'
import type { DashboardSearch } from '../data/search'
import {
  SORTABLE,
  clearDroppedParams,
  droppedParams,
  isFiltered,
  subscribeToDropped,
} from '../data/search'
import type { Segment } from '../data/types'
import { DailyChart } from '../features/charts/daily-chart'
import { SegmentChart } from '../features/charts/segment-chart'
import { FilterBar } from '../features/filters/filter-bar'
import { ColumnSettings } from '../features/table/column-settings'
import { MetricsTable } from '../features/table/metrics-table'
import type { TableSettings } from '../features/table/metrics-table'
import { COLUMN_IDS } from '../features/table/columns'
import { SavedViews } from '../features/views/saved-views'
import type { SavedView } from '../features/views/saved-views'
import { formatDay, formatMoney, formatNumber, formatPercent } from '../lib/format'
import { useLocalStorage } from '../lib/use-local-storage'

const SETTINGS_KEY = 'metrics-board.columns.v1'
const DEFAULT_SETTINGS: TableSettings = { visibility: {}, order: [...COLUMN_IDS], sizing: {} }

export function DashboardPage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const [settings, setSettings] = useLocalStorage<TableSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)

  const query = useQuery(metricsQueryOptions(search))

  // A link with broken parameters opens, says what was thrown away, and leaves
  // a clean URL behind — the notice outlives the parameters it is about.
  const dropped = useSyncExternalStore(subscribeToDropped, droppedParams, droppedParams)
  useEffect(() => {
    if (!search._dropped?.length) return
    void navigate({
      replace: true,
      search: (previous: DashboardSearch) => ({ ...previous, _dropped: undefined }),
    })
  }, [search._dropped, navigate])

  const patch = useCallback(
    (next: Partial<DashboardSearch>) => {
      clearDroppedParams()
      void navigate({
        search: (previous: DashboardSearch) => ({ ...previous, ...next, _dropped: undefined }),
      })
    },
    [navigate],
  )

  const reset = useCallback(() => {
    clearDroppedParams()
    void navigate({ search: {} as DashboardSearch })
  }, [navigate])

  const applyView = useCallback(
    (view: SavedView) => {
      setSettings(view.settings)
      void navigate({ search: view.search })
    },
    [navigate, setSettings],
  )

  const sorting = useMemo<SortingState>(
    () => (search.sort ? [{ id: search.sort, desc: search.dir !== 'asc' }] : []),
    [search.sort, search.dir],
  )

  const onSortingChange = useCallback(
    (next: SortingState) => {
      const first = next[0]
      if (!first || !(SORTABLE as readonly string[]).includes(first.id)) {
        patch({ sort: undefined, dir: undefined })
        return
      }
      patch({ sort: first.id as DashboardSearch['sort'], dir: first.desc ? 'desc' : 'asc' })
    },
    [patch],
  )

  const toggleSegment = useCallback(
    (segment: Segment) => {
      const current = search.segments ?? []
      const next = current.includes(segment)
        ? current.filter((item) => item !== segment)
        : [...current, segment]
      patch({ segments: next.length ? next : undefined })
    },
    [patch, search.segments],
  )

  const data = query.data
  const totals = data?.totals
  const showSkeletons = query.isPending

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acquisition dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Ten thousand rows of sessions, signups and revenue. Filter them, drill into a day from
            the chart, and send the link — the URL is the whole state of this screen.
          </p>
        </div>
        <SavedViews search={search} settings={settings} onApply={applyView} />
      </header>

      {dropped.length > 0 ? (
        <p
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          The link had values this dashboard does not understand ({dropped.join(', ')}), so they
          were dropped. Everything else was kept.
        </p>
      ) : null}

      <FilterBar search={search} onChange={patch} onReset={reset} />

      {query.isError ? (
        <ErrorPanel
          message={query.error instanceof Error ? query.error.message : 'Something went wrong.'}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <section aria-label="Totals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Sessions" value={totals && formatNumber(totals.sessions)} loading={showSkeletons} />
            <Kpi label="Signups" value={totals && formatNumber(totals.signups)} loading={showSkeletons} />
            <Kpi
              label="Conversion"
              value={totals && formatPercent(totals.conversion)}
              loading={showSkeletons}
            />
            <Kpi label="Revenue" value={totals && formatMoney(totals.revenue)} loading={showSkeletons} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Panel
              title="Revenue by day"
              hint={
                search.day
                  ? `Drilled into ${formatDay(search.day, { day: 'numeric', month: 'long' })} — click the point again to zoom out`
                  : 'Click a day to drill the table into it'
              }
            >
              {showSkeletons ? (
                <Skeleton className="h-64" />
              ) : (
                <DailyChart
                  data={data?.unfilteredDays ?? []}
                  selectedDay={search.day}
                  onSelectDay={(day) => patch({ day })}
                />
              )}
            </Panel>

            <Panel title="Revenue by segment" hint="Click a bar to filter by that segment">
              {showSkeletons ? (
                <Skeleton className="h-64" />
              ) : (
                <SegmentChart
                  data={data?.bySegment ?? []}
                  active={search.segments}
                  onToggleSegment={toggleSegment}
                />
              )}
            </Panel>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                Rows{' '}
                <span className="font-normal text-text-muted">
                  {totals ? formatNumber(totals.rows) : '—'} of 10,000
                </span>
              </h2>
              <ColumnSettings settings={settings} onChange={setSettings} />
            </div>

            {showSkeletons ? (
              <Skeleton className="h-[min(60vh,560px)]" />
            ) : data && data.rows.length > 0 ? (
              <MetricsTable
                rows={data.rows}
                sorting={sorting}
                onSortingChange={onSortingChange}
                settings={settings}
                onSettingsChange={setSettings}
                stale={query.isPlaceholderData}
              />
            ) : (
              <EmptyState
                title="No rows match these filters"
                description={
                  isFiltered(search)
                    ? 'Widen the period or drop a segment — the dataset covers the last 120 days.'
                    : 'The dataset is empty, which should not happen. Reload the page.'
                }
                action={
                  isFiltered(search) ? (
                    <Button variant="outline" size="sm" onClick={reset}>
                      Reset filters
                    </Button>
                  ) : undefined
                }
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, loading }: { label: string; value?: string; loading: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs text-text-muted">{label}</p>
      {loading || value === undefined ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      )}
    </div>
  )
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-danger/40 bg-danger/5 px-6 py-12 text-center"
    >
      <p className="text-sm font-semibold text-danger">The dashboard could not load</p>
      <p className="max-w-md text-xs text-text-muted">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
