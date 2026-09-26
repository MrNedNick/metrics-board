import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface DefinitionProps {
  /** What is being explained — becomes the button's name: "What is Revenue?". */
  term: string
  children: ReactNode
  className?: string
}

const GAP = 6
const EDGE = 12

/**
 * A "?" that explains a term in one click. Built on the Popover API, so Escape,
 * clicking elsewhere and the expanded state for screen readers come from the
 * browser; the only thing done here is placing the panel next to its button.
 */
export function Definition({ term, children, className }: DefinitionProps) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // React does not wire `onToggle` on popovers, so the native event is used.
  useEffect(() => {
    const element = panel.current
    if (!element) return
    // `toggle` arrives a task after the panel is shown; hiding it until then
    // keeps it from flashing in the corner for a frame.
    const onBeforeToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === 'open') element.style.visibility = 'hidden'
    }
    const onToggle = (event: Event) => {
      const opened = (event as ToggleEvent).newState === 'open'
      setOpen(opened)
      if (opened && button.current) place(element, button.current)
      element.style.visibility = ''
    }
    element.addEventListener('beforetoggle', onBeforeToggle)
    element.addEventListener('toggle', onToggle)
    return () => {
      element.removeEventListener('beforetoggle', onBeforeToggle)
      element.removeEventListener('toggle', onToggle)
    }
  }, [])

  return (
    <>
      <button
        ref={button}
        type="button"
        popoverTarget={id}
        aria-expanded={open}
        aria-label={`What is ${term}?`}
        className={cn(
          'relative inline-grid size-4 shrink-0 place-items-center rounded-full after:absolute after:-inset-2 after:content-[""] border border-border text-[10px] leading-none font-semibold text-text-muted',
          'hover:border-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          className,
        )}
      >
        ?
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        className="fixed m-0 w-max max-w-[min(20rem,calc(100vw-24px))] rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-xs leading-relaxed font-normal text-text shadow-lg [inset:auto]"
      >
        {children}
      </div>
    </>
  )
}

function place(panel: HTMLElement, anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect()
  const width = panel.offsetWidth
  const height = panel.offsetHeight
  const left = Math.min(
    Math.max(EDGE, rect.left + rect.width / 2 - width / 2),
    window.innerWidth - width - EDGE,
  )
  const below = rect.bottom + GAP
  const top = below + height > window.innerHeight - EDGE ? rect.top - GAP - height : below
  panel.style.left = `${left}px`
  panel.style.top = `${Math.max(EDGE, top)}px`
}
