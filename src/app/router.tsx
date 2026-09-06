import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import { validateSearch } from '../data/search'
import { DashboardPage } from '../routes/dashboard'
import { RootLayout } from './root-layout'

/**
 * Search parameters are written as plain, readable pairs — `?segments=new,pro`
 * rather than JSON — because the whole point of putting filters in the URL is
 * that the link can be read and sent to someone.
 */
function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    // Underscore-prefixed keys are for this render only (see `validateSearch`).
    if (key.startsWith('_')) continue
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
      continue
    }
    params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

function parseSearch(searchString: string): Record<string, unknown> {
  return Object.fromEntries(new URLSearchParams(searchString))
}

const rootRoute = createRootRoute({ component: RootLayout })

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch,
  component: DashboardPage,
})

export const routeTree = rootRoute.addChildren([dashboardRoute])

/**
 * A factory rather than a singleton: the tests build a router on a memory
 * history, and every test gets its own instead of sharing one global.
 */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL,
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    ...(history ? { history } : {}),
  })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
