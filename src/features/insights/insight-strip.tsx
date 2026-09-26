import { Skeleton } from '../../components/skeleton/skeleton'
import type { Insight } from './insights'

const MARK: Record<Insight['trend'], string> = { up: '▲', down: '▼', flat: '●' }
const TONE: Record<Insight['trend'], string> = {
  up: 'text-success',
  down: 'text-danger',
  flat: 'text-text-muted',
}

/** Three findings in plain words, recomputed from whatever the filters show. */
export function InsightStrip({ insights, loading }: { insights: readonly Insight[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-[4.5rem]" />
        ))}
      </div>
    )
  }
  if (insights.length === 0) return null

  return (
    <section aria-label="What the numbers say" className="grid gap-3 md:grid-cols-3">
      {insights.map((insight) => (
        <article
          key={insight.id}
          className="flex gap-3 rounded-lg border border-border bg-surface-raised px-4 py-3"
        >
          <span aria-hidden className={`mt-0.5 text-xs ${TONE[insight.trend]}`}>
            {MARK[insight.trend]}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-balance">{insight.title}</p>
            <p className="mt-0.5 text-xs text-text-muted">{insight.detail}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
