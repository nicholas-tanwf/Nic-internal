export function toCapsKeyword(value) {
  return String(value ?? '').trim().toUpperCase()
}

export function isOverlongCopy(text, { maxChars = 140 } = {}) {
  return String(text ?? '').trim().length > maxChars
}

