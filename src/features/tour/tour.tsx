import { useEffect, useState } from 'react'
import { Button } from '../../components/button/button'
import { Modal } from '../../components/modal/modal'

export const TOUR_KEY = 'metrics-board.tour.v1'

const STEPS = [
  {
    title: 'Start with the top row',
    body: 'Three cards say in plain words what the numbers mean for the filters on screen. A “?” next to a term explains it.',
  },
  {
    title: 'The filters live in the link',
    body: 'Pick a period, a segment or a channel and the address bar changes with them. Send it to a colleague and they open this exact screen.',
  },
  {
    title: 'Click a chart to narrow the table',
    body: 'A day on the revenue chart drills the table into that day; a bar on the segment chart filters by that segment. Click it again to zoom back out.',
  },
  {
    title: 'Save the view you come back to',
    body: '“Save this view” keeps the filters and the column layout under a name, one click away next time.',
  },
] as const

/**
 * Four short steps for a first visit. The modal traps focus and closes on
 * Escape; whichever way it is closed, it does not come back on its own.
 */
export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1
  const current = STEPS[step]

  // The dialog focuses its first button (Skip) when it opens; Enter should move
  // the tour on, not end it. The modal's own effect has run by now.
  useEffect(() => {
    if (open) document.querySelector<HTMLButtonElement>('[data-tour-next]')?.focus()
  }, [open])

  const close = () => {
    onClose()
    setStep(0)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="How to use this board"
      actions={
        <>
          <Button variant="ghost" onClick={close} className="mr-auto">
            Skip
          </Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button data-tour-next onClick={last ? close : () => setStep(step + 1)}>
            {last ? 'Got it' : 'Next'}
          </Button>
        </>
      }
    >
      <p className="text-xs text-text-muted" aria-live="polite">
        Step {step + 1} of {STEPS.length}
      </p>
      <h3 className="mt-1 text-base font-semibold">{current.title}</h3>
      <p className="mt-1.5 text-text-muted">{current.body}</p>
      <ol className="mt-4 flex gap-1.5" aria-hidden>
        {STEPS.map((item, index) => (
          <li
            key={item.title}
            className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </ol>
    </Modal>
  )
}
