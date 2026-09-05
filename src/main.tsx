import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProviders, createQueryClient } from './app/providers'
import { router } from './app/router'
import './styles/tokens.css'

async function start() {
  // The demo carries its own API; it has to answer before the first request.
  try {
    const { startMockApi } = await import('./mocks/browser')
    await startMockApi()
  } catch {
    // Without a service worker the app still boots and fails visibly.
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders queryClient={createQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
}

void start()
