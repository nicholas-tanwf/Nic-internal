export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true
}

export function getTransition({ durationMs = 180 } = {}) {
  if (prefersReducedMotion()) return 'none'
  return `opacity ${durationMs}ms ease-out, transform ${durationMs}ms ease-out`
}

