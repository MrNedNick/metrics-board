import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
import { useClickOutside } from '../../lib/use-click-outside'

export interface DropdownMenuProps {
  /** Renders the trigger — spread the given props onto whatever element it returns. */
  trigger: (triggerProps: {
    onClick: () => void
    'aria-haspopup': 'menu'
    'aria-expanded': boolean
  }) => ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
}

export interface DropdownMenuItemProps {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  variant?: 'default' | 'danger'
}

interface MenuContextValue {
  activeId: string | null
  registerItem: (id: string, el: HTMLButtonElement | null) => void
  setActive: (id: string) => void
  moveFocus: (fromId: string, direction: 1 | -1) => void
  focusItem: (id: string) => void
  orderedIds: () => string[]
  close: (returnFocus: boolean) => void
}

const MenuContext = createContext<MenuContextValue | null>(null)

function useMenuContext() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('<DropdownMenuItem> must be used inside <DropdownMenu>')
  return ctx
}

/**
 * Trigger + menu with roving tabindex: the last-focused item is the only one
 * in the Tab order, arrow keys move between items, Home/End jump to the
 * ends, and Escape or a click outside close the menu and hand focus back to
 * the trigger.
 */
export function DropdownMenu({ trigger, children, align = 'start', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const triggerContainerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false))

  const orderedIds = () => Array.from(itemRefs.current.keys())

  const registerItem = (id: string, el: HTMLButtonElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  const focusItem = (id: string) => {
    setActiveId(id)
    itemRefs.current.get(id)?.focus()
  }

  // Disabled items are unfocusable, so navigation must skip over them.
  const isEnabled = (id: string) => {
    const el = itemRefs.current.get(id)
    return !!el && !el.disabled
  }

  const moveFocus = (fromId: string, direction: 1 | -1) => {
    const order = orderedIds()
    const index = order.indexOf(fromId)
    if (index === -1) return
    for (let step = 1; step <= order.length; step++) {
      const candidate = order[(index + direction * step + order.length) % order.length]
      if (isEnabled(candidate)) {
        focusItem(candidate)
        return
      }
    }
  }

  const firstEnabledId = (order: string[]) => order.find(isEnabled)
  const lastEnabledId = (order: string[]) => [...order].reverse().find(isEnabled)

  function focusTrigger() {
    triggerContainerRef.current
      ?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]')
      ?.focus()
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) focusTrigger()
  }

  useEffect(() => {
    if (!open) return
    // Move DOM focus only — the item's own onFocus reports it back into
    // activeId, so state doesn't need updating from inside the effect.
    const first = firstEnabledId(orderedIds())
    if (first) itemRefs.current.get(first)?.focus()
    // Only on open — items don't change while the menu is closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const order = orderedIds()
    const currentEl = document.activeElement as HTMLButtonElement | null
    const currentId = order.find((id) => itemRefs.current.get(id) === currentEl) ?? order[0]

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (currentId) moveFocus(currentId, 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentId) moveFocus(currentId, -1)
        break
      case 'Home': {
        event.preventDefault()
        const first = firstEnabledId(order)
        if (first) focusItem(first)
        break
      }
      case 'End': {
        event.preventDefault()
        const last = lastEnabledId(order)
        if (last) focusItem(last)
        break
      }
      case 'Escape':
        event.preventDefault()
        close(true)
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <div ref={triggerContainerRef}>
        {trigger({
          onClick: () => setOpen((v) => !v),
          'aria-haspopup': 'menu',
          'aria-expanded': open,
        })}
      </div>
      {open && (
        <div
          role="menu"
          id={menuId}
          onKeyDown={handleKeyDown}
          className={cn(
            'absolute z-10 mt-1 min-w-40 rounded-md border border-border bg-surface py-1 shadow-overlay',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <MenuContext.Provider
            value={{ activeId, registerItem, setActive: setActiveId, moveFocus, focusItem, orderedIds, close }}
          >
            {children}
          </MenuContext.Provider>
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  variant = 'default',
}: DropdownMenuItemProps) {
  const id = useId()
  const { activeId, registerItem, setActive, close } = useMenuContext()

  return (
    <button
      ref={(el) => registerItem(id, el)}
      type="button"
      role="menuitem"
      disabled={disabled}
      tabIndex={activeId === id ? 0 : -1}
      onFocus={() => setActive(id)}
      onClick={() => {
        if (disabled) return
        onSelect?.()
        close(true)
      }}
      className={cn(
        'flex w-full items-center px-3 py-2 text-left text-sm',
        'disabled:pointer-events-none disabled:opacity-45',
        variant === 'danger' ? 'text-danger' : 'text-text',
        variant === 'danger' ? 'hover:bg-danger/10' : 'hover:bg-surface-raised',
      )}
    >
      {children}
    </button>
  )
}
