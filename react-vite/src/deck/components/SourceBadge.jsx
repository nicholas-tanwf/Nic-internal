export function SourceBadge({ claimIds = [] }) {
  const count = claimIds.length
  if (count === 0) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[12px] font-medium leading-none text-white/70">
      SOURCES
      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/80">
        {count}
      </span>
    </span>
  )
}

