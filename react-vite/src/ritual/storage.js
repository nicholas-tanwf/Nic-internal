const KEY = 'ritual-mvp-history-v1'

export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistory(items) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function pushHistory(entry) {
  const next = [entry, ...loadHistory()].slice(0, 30)
  saveHistory(next)
  return next
}

