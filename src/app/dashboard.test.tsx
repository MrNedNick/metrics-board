import { QueryClient } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { handlers, setApiLatency } from '../mocks/handlers'
import { clearDroppedParams } from '../data/search'
import { AppProviders } from './providers'
import { createAppRouter } from './router'

const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  setApiLatency(0)
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  clearDroppedParams()
})
afterAll(() => server.close())

/** Mounts the app the way the browser does, but on a memory history. */
function renderApp(initialUrl = '/') {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [initialUrl] }))
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  })

  const view = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return { ...view, router }
}

const rowsHeading = () => screen.getByRole('heading', { name: /^Rows/ }).textContent ?? ''
const totals = () =>
  within(screen.getByRole('region', { name: 'Totals' }) ?? document.body).getAllByText(/^[€\d]/)

describe('the dashboard', () => {
  it('loads the whole dataset and puts the filters in the URL', async () => {
    const user = userEvent.setup()
    const { router } = renderApp()

    await waitFor(() => expect(rowsHeading()).toContain('10,000 of 10,000'))
    const before = totals().map((node) => node.textContent)

    await user.click(screen.getByRole('button', { name: 'enterprise' }))

    // The URL is the contract: this is exactly what a colleague would receive.
    await waitFor(() => expect(router.state.location.searchStr).toBe('?segments=enterprise'))
    await waitFor(() => expect(rowsHeading()).not.toContain('10,000 of 10,000'))

    // The totals — the same numbers both charts are drawn from — moved with it.
    expect(totals().map((node) => node.textContent)).not.toEqual(before)
  })

  it('opens a link with a broken parameter, explains it and cleans the URL', async () => {
    const { router } = renderApp('/?from=yesterday&segments=enterprise')

    await waitFor(() => expect(rowsHeading()).toMatch(/Rows [\d,]+ of 10,000/))
    expect(await screen.findByRole('status')).toHaveTextContent(/does not understand \(from\)/)
    await waitFor(() => expect(router.state.location.searchStr).toBe('?segments=enterprise'))
  })

  it('says so when nothing matches, and offers a way back', async () => {
    const user = userEvent.setup()
    renderApp('/?q=nothing-matches-this')

    expect(await screen.findByText('No rows match these filters')).toBeInTheDocument()
    // Two of them on purpose: one in the toolbar, one inside the empty state.
    const resets = screen.getAllByRole('button', { name: 'Reset filters' })
    await user.click(resets[resets.length - 1])
    await waitFor(() => expect(rowsHeading()).toContain('10,000 of 10,000'))
  })

  it('saves a view and restores it after a reload', async () => {
    const user = userEvent.setup()
    renderApp()
    await waitFor(() => expect(rowsHeading()).toContain('10,000 of 10,000'))

    await user.click(screen.getByRole('button', { name: 'enterprise' }))
    await waitFor(() => expect(rowsHeading()).not.toContain('10,000 of 10,000'))
    const filtered = rowsHeading()

    await user.click(screen.getByRole('button', { name: 'Save this view' }))
    await user.type(screen.getByLabelText('Name'), 'Enterprise only')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem('metrics-board.views.v1') ?? '[]')).toHaveLength(1),
    )

    // A reload: same storage, a brand new router and query cache.
    cleanup()
    const { router } = renderApp()
    await waitFor(() => expect(rowsHeading()).toContain('10,000 of 10,000'))

    await user.click(screen.getByRole('button', { name: /Saved views/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Enterprise only' }))

    await waitFor(() => expect(router.state.location.searchStr).toBe('?segments=enterprise'))
    await waitFor(() => expect(rowsHeading()).toBe(filtered))
  })
})

describe('making sense of it', () => {
  it('says in plain words what the numbers show, and how they moved', async () => {
    localStorage.setItem('metrics-board.tour.v1', 'true')
    renderApp('/')

    const insights = await screen.findByRole('region', { name: 'What the numbers say' })
    expect(within(insights).getByText(/Enterprise visitors bring 46% of revenue/)).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Totals' })).getAllByText(/in the last 60 days vs the 60 before/),
    ).toHaveLength(4)
  })

  it('shows the tour once on a first visit, and on demand after that', async () => {
    const user = userEvent.setup()
    const first = renderApp('/')

    const dialog = await screen.findByRole('dialog', { name: 'How to use this board' })
    for (const _ of [1, 2, 3]) await user.click(within(dialog).getByRole('button', { name: 'Next' }))
    await user.click(within(dialog).getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    first.unmount()
    renderApp('/')
    await waitFor(() => expect(rowsHeading()).toContain('10,000 of 10,000'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'How to use this' }))
    expect(await screen.findByRole('dialog', { name: 'How to use this board' })).toBeInTheDocument()
  })

  it('does not stop a colleague who opened a link with filters', async () => {
    renderApp('/?segments=enterprise')
    await waitFor(() => expect(rowsHeading()).not.toContain('10,000 of 10,000'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
