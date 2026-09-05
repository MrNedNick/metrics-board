import { Outlet } from '@tanstack/react-router'
import { Button } from '../components/button/button'
import { useTheme } from './theme'

const REPO = 'https://github.com/MrNedNick/metrics-board'

export function RootLayout() {
  const [theme, toggleTheme] = useTheme()

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-text">
      <a
        href="#main"
        className="sr-only rounded-br-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:z-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-[10px] bg-accent text-sm font-semibold text-on-accent"
            >
              MB
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Metrics Board</p>
              <p className="text-xs text-text-muted">Acquisition, by day and by segment</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden rounded-md px-3 py-2 text-sm text-text-muted hover:bg-surface-raised hover:text-text sm:block"
            >
              Source
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface-raised">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-xs text-text-muted sm:px-6">
          <p>10,000 generated rows, filtered in the browser. No account, no backend.</p>
          <nav className="ml-auto flex gap-4" aria-label="Project links">
            <a className="hover:text-text" href={REPO} target="_blank" rel="noreferrer noopener">
              Source on GitHub
            </a>
            <a
              className="hover:text-text"
              href={`${REPO}#readme`}
              target="_blank"
              rel="noreferrer noopener"
            >
              How it is built
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
