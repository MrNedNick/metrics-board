import {
  useTable,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useState } from 'react'
import type { MetricRow } from '../../data/types'
import { cn } from '../../lib/cn'
import { columns } from './columns'
import { metricsFeatures } from './table-features'

const ROW_HEIGHT = 40

export interface TableSettings {
  visibility: ColumnVisibilityState
  order: ColumnOrderState
  sizing: ColumnSizingState
}

interface MetricsTableProps {
  rows: readonly MetricRow[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  settings: TableSettings
  onSettingsChange: (next: TableSettings) => void
  /** Dims the table while a newer answer is on its way. */
  stale?: boolean
}

/**
 * Ten thousand rows, one <table>. Only the rows inside the viewport exist in
 * the DOM — `@tanstack/react-virtual` measures the scroll container and the
 * body holds the full height, so the scrollbar still tells the truth.
 */
export function MetricsTable({
  rows,
  sorting,
  onSortingChange,
  settings,
  onSettingsChange,
  stale = false,
}: MetricsTableProps) {
  // State, not a ref: the virtualizer subscribes to the scroll element in an
  // effect, and a ref does not tell it when that element finally exists.
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
  const data = useMemo(() => rows as MetricRow[], [rows])

  const table = useTable({
    data,
    columns,
    features: metricsFeatures,
    state: {
      sorting,
      columnVisibility: settings.visibility,
      columnOrder: settings.order,
      columnSizing: settings.sizing,
    },
    columnResizeMode: 'onChange',
    onSortingChange: (updater) => {
      onSortingChange(typeof updater === 'function' ? updater(sorting) : updater)
    },
    onColumnVisibilityChange: (updater) => {
      const visibility = typeof updater === 'function' ? updater(settings.visibility) : updater
      onSettingsChange({ ...settings, visibility })
    },
    onColumnOrderChange: (updater) => {
      const order = typeof updater === 'function' ? updater(settings.order) : updater
      onSettingsChange({ ...settings, order })
    },
    onColumnSizingChange: (updater) => {
      const sizing = typeof updater === 'function' ? updater(settings.sizing) : updater
      onSettingsChange({ ...settings, sizing })
    },
  })

  const tableRows = table.getRowModel().rows

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scroller,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })

  const items = virtualizer.getVirtualItems()
  const paddingTop = items.length ? items[0].start : 0
  const paddingBottom = items.length
    ? virtualizer.getTotalSize() - items[items.length - 1].end
    : 0

  return (
    <div
      ref={setScroller}
      className={cn(
        'relative h-[min(60vh,560px)] overflow-auto rounded-lg border border-border bg-surface',
        stale && 'opacity-60 transition-opacity',
      )}
    >
      {/* Fills the panel on a wide screen, scrolls sideways when the columns
          need more room than there is. */}
      <table
        className="w-full border-collapse text-sm"
        style={{ minWidth: table.getTotalSize() }}
      >
        <thead className="sticky top-0 z-10 bg-surface-raised">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    scope="col"
                    style={{ width: header.getSize() }}
                    aria-sort={
                      sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'
                    }
                    className="relative border-b border-border px-3 py-2 text-left font-medium text-text-muted"
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex w-full items-center gap-1 rounded-sm text-left hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <table.FlexRender header={header} />
                      <span aria-hidden className="text-[10px] leading-none">
                        {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : ''}
                      </span>
                    </button>

                    {/* Drag to resize; the width is remembered across reloads. */}
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${header.column.id}`}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-accent"
                    />
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden>
              <td style={{ height: paddingTop }} colSpan={table.getVisibleLeafColumns().length} />
            </tr>
          )}

          {items.map((item) => {
            const row = tableRows[item.index]
            return (
              <tr
                key={row.id}
                style={{ height: ROW_HEIGHT }}
                className="border-b border-border/60 last:border-0 hover:bg-surface-raised"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5"
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            )
          })}

          {paddingBottom > 0 && (
            <tr aria-hidden>
              <td
                style={{ height: paddingBottom }}
                colSpan={table.getVisibleLeafColumns().length}
              />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
