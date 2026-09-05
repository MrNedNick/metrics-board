import { useEffect, useState } from 'react'
import { Button } from '../../components/button/button'
import { Input } from '../../components/input/input'
import { CHANNELS, SEGMENTS } from '../../data/types'
import type { Channel, Segment } from '../../data/types'
import type { DashboardSearch } from '../../data/search'
import { isFiltered } from '../../data/search'
import { cn } from '../../lib/cn'
import { useDebouncedValue } from '../../lib/use-debounced-value'
import { formatDay, isoDaysAgo } from '../../lib/format'

const PRESETS = [
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
  { label: 'Last 90 days', days: 89 },
]

export interface FilterBarProps {
  search: DashboardSearch
  onChange: (patch: Partial<DashboardSearch>) => void
  onReset: () => void
}

export function FilterBar({ search, onChange, onReset }: FilterBarProps) {
  const [term, setTerm] = useState(search.q ?? '')
  const debounced = useDebouncedValue(term, 250)

  // Typing must not push a history entry per keystroke, so the URL trails the
  // input by a beat.
  useEffect(() => {
    const next = debounced.trim()
    if (next === (search.q ?? '')) return
    onChange({ q: next || undefined })
    // `onChange` is stable per render of the page; `search.q` is the guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  // A preset or a saved view changed the URL from the outside: follow it.
  useEffect(() => {
    setTerm(search.q ?? '')
  }, [search.q])

  const toggle = <T extends string>(list: readonly T[] | undefined, value: T): T[] | undefined => {
    const current = list ?? []
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    return next.length ? next : undefined
  }

  return (
    <section
      aria-label="Filters"
      className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-lg border border-border bg-surface-raised p-4"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">Period</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => {
            const from = isoDaysAgo(preset.days)
            const active = search.from === from && !search.to
            return (
              <Button
                key={preset.label}
                size="sm"
                variant={active ? 'primary' : 'outline'}
                aria-pressed={active}
                onClick={() => onChange({ from, to: undefined, day: undefined })}
              >
                {preset.label}
              </Button>
            )
          })}
          <label className="ml-1 flex items-center gap-1.5 text-xs text-text-muted">
            <span className="sr-only sm:not-sr-only">From</span>
            <Input
              type="date"
              className="h-8 w-[9.5rem] px-2 text-xs"
              aria-label="From date"
              value={search.from ?? ''}
              onChange={(event) =>
                onChange({ from: event.target.value || undefined, day: undefined })
              }
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="sr-only sm:not-sr-only">to</span>
            <Input
              type="date"
              className="h-8 w-[9.5rem] px-2 text-xs"
              aria-label="To date"
              value={search.to ?? ''}
              onChange={(event) =>
                onChange({ to: event.target.value || undefined, day: undefined })
              }
            />
          </label>
        </div>
      </div>

      <FilterGroup
        label="Segment"
        values={SEGMENTS}
        active={search.segments}
        onToggle={(value: Segment) => onChange({ segments: toggle(search.segments, value) })}
      />

      <FilterGroup
        label="Channel"
        values={CHANNELS}
        active={search.channels}
        onToggle={(value: Channel) => onChange({ channels: toggle(search.channels, value) })}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-search" className="text-xs font-medium text-text-muted">
          Search
        </label>
        <Input
          id="filter-search"
          className="h-8 w-48 text-xs"
          placeholder="mobile, DE, email…"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {search.day && (
          <span className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
            {formatDay(search.day, { day: 'numeric', month: 'long' })} only
            <button
              type="button"
              onClick={() => onChange({ day: undefined })}
              className="rounded-full px-1 hover:bg-accent/20"
              aria-label="Clear the day filter"
            >
              ×
            </button>
          </span>
        )}
        {isFiltered(search) && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset filters
          </Button>
        )}
      </div>
    </section>
  )
}

interface FilterGroupProps<T extends string> {
  label: string
  values: readonly T[]
  active: readonly T[] | undefined
  onToggle: (value: T) => void
}

function FilterGroup<T extends string>({ label, values, active, onToggle }: FilterGroupProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {values.map((value) => {
          const on = active?.includes(value) ?? false
          return (
            <button
              key={value}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs capitalize transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                on
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border bg-surface text-text-muted hover:text-text',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
