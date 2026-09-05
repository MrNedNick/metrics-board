import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DayPoint } from '../../data/types'
import { formatCompact, formatDay, formatMoney } from '../../lib/format'

interface DailyChartProps {
  data: readonly DayPoint[]
  /** The day the table is drilled down to, highlighted here. */
  selectedDay?: string
  onSelectDay: (day: string | undefined) => void
}

/**
 * Clicking a day drills the table down to it, and clicking it again clears the
 * drill-down. Both write to the URL, so the chart and the table cannot drift
 * apart — they read the same state.
 */
export function DailyChart({ data, selectedDay, onSelectDay }: DailyChartProps) {
  const points = data as DayPoint[]

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          onClick={(state) => {
            const day = state?.activeLabel
            if (typeof day !== 'string') return
            onSelectDay(day === selectedDay ? undefined : day)
          }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDay(value)}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border)"
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border)"
            width={52}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--color-text)',
            }}
            labelFormatter={(label) =>
              typeof label === 'string'
                ? formatDay(label, { weekday: 'short', day: 'numeric', month: 'long' })
                : label
            }
            formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#revenue-fill)"
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
