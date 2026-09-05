import {
  columnOrderingFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * Version 9 of the table is composed, not configured: the features a table
 * actually uses are declared here, and everything downstream is typed against
 * exactly those. Asking a column for `size` without `columnSizingFeature`, or
 * for a sorted row model without `rowSortingFeature`, is a compile error rather
 * than a silent no-op — and nothing this table does not use reaches the bundle.
 */
export const metricsFeatures = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnSizingFeature,
  columnResizingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
})

export type MetricsTableFeatures = typeof metricsFeatures
