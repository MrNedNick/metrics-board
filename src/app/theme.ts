import { useCallback, useEffect } from 'react'
import { useLocalStorage } from '../lib/use-local-storage'

export type Theme = 'light' | 'dark'

const KEY = 'metrics-board.theme.v1'

/**
 * The token palette switches on a class on `<html>`, so the whole app themes
 * itself without a single component branching on the current theme.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useLocalStorage<Theme>(KEY, readInitialTheme())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.style.colorScheme = theme
  }, [theme])

  const toggle = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [setTheme],
  )

  return [theme, toggle]
}

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}
