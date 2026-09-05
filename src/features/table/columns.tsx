import { createColumnHelper } from '@tanstack/react-table'
import { Badge } from '../../components/badge/badge'
import type { MetricsTableFeatures } from './table-features'
import { formatDay, formatMoney, formatNumber, formatPercent } from '../../lib/format'
import type { MetricRow, Segment } from '../../data/types'

const helper = createColumnHelper<MetricsTableFeatures, MetricRow>()

const SEGMENT_TONE: Record<Segment, 'neutral' | 'accent' | 'success'> = {
  new: 'neutral',
  returning: 'accent',
  enterprise: 'success',
}

/** Right-aligned, tabular figures: numbers are meant to be compared down a column. */
const numeric = 'text-right tabular-nums'

export const columns = helper.columns([
  helper.accessor('date', {
    header: 'Date',
    size: 116,
    cell: (info) => (
      <span className="whitespace-nowrap">
        {formatDay(info.getValue(), { day: 'numeric', month: 'short', year: '2-digit' })}
      </span>
    ),
  }),
  helper.accessor('channel', {
    header: 'Channel',
    size: 120,
    cell: (info) => <span className="capitalize">{info.getValue()}</span>,
  }),
  helper.accessor('segment', {
    header: 'Segment',
    size: 130,
    cell: (info) => (
      <Badge tone={SEGMENT_TONE[info.getValue()]} className="capitalize">
        {info.getValue()}
      </Badge>
    ),
  }),
  helper.accessor('country', {
    header: 'Country',
    size: 100,
  }),
  helper.accessor('device', {
    header: 'Device',
    size: 110,
    cell: (info) => <span className="capitalize">{info.getValue()}</span>,
  }),
  helper.accessor('sessions', {
    header: 'Sessions',
    size: 110,
    meta: { align: 'right' },
    cell: (info) => <span className={numeric}>{formatNumber(info.getValue())}</span>,
  }),
  helper.accessor('signups', {
    header: 'Signups',
    size: 100,
    meta: { align: 'right' },
    cell: (info) => <span className={numeric}>{formatNumber(info.getValue())}</span>,
  }),
  helper.accessor((row: MetricRow) => (row.sessions === 0 ? 0 : row.signups / row.sessions), {
    id: 'conversion',
    header: 'Conv.',
    size: 96,
    meta: { align: 'right' },
    cell: (info) => (
      <span className={numeric + ' text-text-muted'}>{formatPercent(info.getValue())}</span>
    ),
  }),
  helper.accessor('revenue', {
    header: 'Revenue',
    size: 120,
    meta: { align: 'right' },
    cell: (info) => (
      <span className={numeric + ' font-medium'}>{formatMoney(info.getValue())}</span>
    ),
  }),
])

export const COLUMN_IDS = ['date', 'channel', 'segment', 'country', 'device', 'sessions', 'signups', 'conversion', 'revenue'] as const
