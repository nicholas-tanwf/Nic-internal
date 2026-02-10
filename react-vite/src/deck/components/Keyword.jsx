import { toCapsKeyword } from '../../lib/copy.js'

export function Keyword({ children }) {
  return (
    <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold tracking-wide text-white/90">
      {toCapsKeyword(children)}
    </span>
  )
}

