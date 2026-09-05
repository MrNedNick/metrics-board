/**
 * Framework-agnostic media query watching, shared by the React hook and the
 * Vue composable so the matching logic lives in exactly one place.
 */
export function getMediaQueryMatch(query: string): boolean {
  return window.matchMedia(query).matches
}

export function subscribeMediaQuery(query: string, onChange: () => void): () => void {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
