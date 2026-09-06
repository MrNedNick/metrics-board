import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * The demo ships without a backend: a service worker answers `/api/*` and the
 * dataset is generated in the browser. Point the API adapter at a real host and
 * nothing else in the app changes.
 */
export async function startMockApi(): Promise<void> {
  const worker = setupWorker(...handlers)
  await worker.start({
    quiet: true,
    onUnhandledRequest: 'bypass',
    // Resolved, not concatenated: `document.baseURI` carries the query string,
    // and `${baseURI}mockServiceWorker.js` turns a shared link like
    // `/?segments=enterprise` into a worker URL that cannot register — which
    // breaks the API for exactly the links this dashboard exists to produce.
    serviceWorker: { url: new URL(`${import.meta.env.BASE_URL}mockServiceWorker.js`, location.origin).toString() },
  })
  await whenControlled()
}

/**
 * `start()` resolves once the worker is registered and activated, which is not
 * the same as this page being controlled by it. Requests sent in that gap fall
 * through to the static host — on a first visit, that is the whole dashboard.
 */
function whenControlled(timeoutMs = 3000): Promise<void> {
  if (navigator.serviceWorker.controller) return Promise.resolve()

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      navigator.serviceWorker.removeEventListener('controllerchange', done)
      resolve()
    }
    const timer = setTimeout(done, timeoutMs)
    navigator.serviceWorker.addEventListener('controllerchange', done)
  })
}
