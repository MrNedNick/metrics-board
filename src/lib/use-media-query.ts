import { useSyncExternalStore } from 'react'
import { getMediaQueryMatch, subscribeMediaQuery } from './core/media-query'

/** Tracks a media query. SSR-safe and matches on first client render, no flash. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribeMediaQuery(query, onChange),
    () => getMediaQueryMatch(query),
    () => false,
  )
}
