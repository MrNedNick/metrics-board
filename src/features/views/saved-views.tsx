import { useState } from 'react'
import { Button } from '../../components/button/button'
import { useConfirm } from '../../components/confirm-dialog/confirm-dialog'
import { DropdownMenu, DropdownMenuItem } from '../../components/dropdown-menu/dropdown-menu'
import { Field } from '../../components/field/field'
import { Input } from '../../components/input/input'
import { Modal } from '../../components/modal/modal'
import { useToast } from '../../components/toast/toast'
import type { DashboardSearch } from '../../data/search'
import { useLocalStorage } from '../../lib/use-local-storage'
import type { TableSettings } from '../table/metrics-table'

export interface SavedView {
  id: string
  name: string
  search: DashboardSearch
  settings: TableSettings
}

const KEY = 'metrics-board.views.v1'

interface SavedViewsProps {
  search: DashboardSearch
  settings: TableSettings
  onApply: (view: SavedView) => void
}

/**
 * A filter set worth returning to is worth naming. Views hold both halves of
 * the screen — the URL filters and the column layout — because restoring one
 * without the other is not the view you saved.
 */
export function SavedViews({ search, settings, onApply }: SavedViewsProps) {
  const [views, setViews] = useLocalStorage<SavedView[]>(KEY, [])
  const [editing, setEditing] = useState<SavedView | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const confirm = useConfirm()
  const toast = useToast()

  const openSave = () => {
    setEditing(null)
    setName('')
    setError(null)
    setDialogOpen(true)
  }

  const openRename = (view: SavedView) => {
    setEditing(view)
    setName(view.name)
    setError(null)
    setDialogOpen(true)
  }

  const [dialogOpen, setDialogOpen] = useState(false)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the view a name you will recognise later.')
      return
    }
    const clash = views.some(
      (view) => view.name.toLowerCase() === trimmed.toLowerCase() && view.id !== editing?.id,
    )
    if (clash) {
      setError('A view with that name already exists.')
      return
    }

    if (editing) {
      setViews(views.map((view) => (view.id === editing.id ? { ...view, name: trimmed } : view)))
      toast.success(`Renamed to “${trimmed}”.`)
    } else {
      const view: SavedView = {
        id: crypto.randomUUID(),
        name: trimmed,
        search,
        settings,
      }
      setViews([...views, view])
      toast.success(`Saved “${trimmed}”.`)
    }
    setDialogOpen(false)
  }

  const remove = async (view: SavedView) => {
    const ok = await confirm({
      title: `Delete “${view.name}”?`,
      description: 'The filters and column layout saved under this name will be gone.',
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    setViews(views.filter((item) => item.id !== view.id))
    toast.info(`Deleted “${view.name}”.`)
  }

  return (
    <div className="flex items-center gap-2">
      {/* A menu with nothing in it is not worth opening — and a menu whose only
          item is disabled leaves keyboard focus stranded on the trigger. */}
      {views.length > 0 && (
        <DropdownMenu
          align="end"
          trigger={(props) => (
            <Button variant="outline" size="sm" {...props}>
              Saved views ({views.length})
            </Button>
          )}
        >
          {views.map((view) => (
            <DropdownMenuItem key={view.id} onSelect={() => onApply(view)}>
              {view.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      )}

      {views.length > 0 && (
        <DropdownMenu
          align="end"
          trigger={(props) => (
            <Button variant="ghost" size="sm" aria-label="Manage saved views" {...props}>
              Manage
            </Button>
          )}
        >
          {views.map((view) => (
            <DropdownMenuItem key={`rename-${view.id}`} onSelect={() => openRename(view)}>
              Rename “{view.name}”
            </DropdownMenuItem>
          ))}
          {views.map((view) => (
            <DropdownMenuItem
              key={`delete-${view.id}`}
              variant="danger"
              onSelect={() => void remove(view)}
            >
              Delete “{view.name}”
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      )}

      <Button size="sm" onClick={openSave}>
        Save this view
      </Button>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Rename view' : 'Save this view'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? 'Rename' : 'Save'}</Button>
          </>
        }
      >
        <Field
          label="Name"
          error={error ?? undefined}
          hint={editing ? undefined : 'Filters, the drill-down day and the column layout are stored.'}
        >
          <Input
            value={name}
            autoFocus
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            placeholder="Enterprise, last 30 days"
          />
        </Field>
      </Modal>
    </div>
  )
}
