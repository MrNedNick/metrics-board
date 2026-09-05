import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Segment, SegmentPoint } from '../../data/types'
import { formatCompact, formatMoney } from '../../lib/format'

interface SegmentChartProps {
  data: readonly SegmentPoint[]
  active: readonly Segment[] | undefined
  onToggleSegment: (segment: Segment) => void
}

/** Clicking a bar toggles that segment in the filters — same state as the chips. */
export function SegmentChart({ data, active, onToggleSegment }: SegmentChartProps) {
  const points = data as SegmentPoint[]

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="segment"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            tickFormatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
            stroke="var(--color-border)"
          />
          <YAxis
            tickFormatter={(value: number) => formatCompact(value)}
            tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border)"
            width={52}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-raised)' }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--color-text)',
            }}
            formatter={(value) => [formatMoney(Number(value)), 'Revenue']}
          />
          <Bar
            dataKey="revenue"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
            onClick={(entry: unknown) => {
              const segment = (entry as { payload?: SegmentPoint }).payload?.segment
              if (segment) onToggleSegment(segment)
            }}
            style={{ cursor: 'pointer' }}
          >
            {points.map((point) => (
              <Cell
                key={point.segment}
                fill={
                  !active?.length || active.includes(point.segment)
                    ? 'var(--color-accent)'
                    : 'var(--color-border)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
