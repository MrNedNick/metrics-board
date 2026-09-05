import { Button } from '../../components/button/button'
import { DropdownMenu, DropdownMenuItem } from '../../components/dropdown-menu/dropdown-menu'
import { COLUMN_IDS } from './columns'
import type { TableSettings } from './metrics-table'

const LABELS: Record<string, string> = {
  date: 'Date',
  channel: 'Channel',
  segment: 'Segment',
  country: 'Country',
  device: 'Device',
  sessions: 'Sessions',
  signups: 'Signups',
  conversion: 'Conversion',
  revenue: 'Revenue',
}

interface ColumnSettingsProps {
  settings: TableSettings
  onChange: (next: TableSettings) => void
}

/** Show, hide and reorder columns. The choice is remembered across reloads. */
export function ColumnSettings({ settings, onChange }: ColumnSettingsProps) {
  const order = settings.order.length ? settings.order : [...COLUMN_IDS]
  const isVisible = (id: string) => settings.visibility[id] !== false

  const toggle = (id: string) => {
    onChange({
      ...settings,
      visibility: { ...settings.visibility, [id]: !isVisible(id) },
    })
  }

  const move = (id: string, direction: -1 | 1) => {
    const index = order.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= order.length) return
    const next = [...order]
    next.splice(index, 1)
    next.splice(target, 0, id)
    onChange({ ...settings, order: next })
  }

  const visibleCount = order.filter(isVisible).length

  return (
    <DropdownMenu
      align="end"
      trigger={(props) => (
        <Button variant="outline" size="sm" {...props}>
          Columns ({visibleCount})
        </Button>
      )}
    >
      {order.map((id, index) => (
        <div key={id} className="flex items-center gap-1 px-1">
          <label className="flex flex-1 cursor-pointer items-center gap-2 px-2 py-2 text-sm">
            <input
              type="checkbox"
              checked={isVisible(id)}
              onChange={() => toggle(id)}
              className="size-4 accent-[var(--color-accent)]"
            />
            {LABELS[id] ?? id}
          </label>
          <button
            type="button"
            className="rounded px-1.5 py-1 text-xs text-text-muted hover:bg-surface-raised hover:text-text disabled:opacity-40"
            aria-label={`Move ${LABELS[id] ?? id} left`}
            disabled={index === 0}
            onClick={() => move(id, -1)}
          >
            ←
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-1 text-xs text-text-muted hover:bg-surface-raised hover:text-text disabled:opacity-40"
            aria-label={`Move ${LABELS[id] ?? id} right`}
            disabled={index === order.length - 1}
            onClick={() => move(id, 1)}
          >
            →
          </button>
        </div>
      ))}
      <DropdownMenuItem
        onSelect={() => onChange({ visibility: {}, order: [...COLUMN_IDS], sizing: {} })}
      >
        Reset columns
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
