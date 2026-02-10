export function GlassPanel({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-2xl',
        'shadow-[0_20px_70px_rgba(0,0,0,0.55)]',
        'exhale-enter',
        className,
      ].join(' ')}
    >
      {/* sheen microanimation */}
      <div className="pointer-events-none absolute inset-0 exhale-sheen" aria-hidden="true" />
      {/* subtle inner chrome rim */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  )
}

