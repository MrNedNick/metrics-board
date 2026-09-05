import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ConfirmDialogProvider } from '../components/confirm-dialog/confirm-dialog'
import { ToastProvider } from '../components/toast/toast'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false },
    },
  })
}

/**
 * Everything the app is wrapped in, in one place — so a test mounts what
 * production mounts instead of a hand-assembled subset of it.
 */
export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
