import { useEffect, useSyncExternalStore } from 'react'

/** Sets the browser tab title for the current page. */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} – gamez`
  }, [title])
}

const query = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void): () => void {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

/** True when the person has asked their OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
