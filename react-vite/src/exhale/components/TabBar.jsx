// SVG Icons
const ResetIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
)

const SettingsIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)

export function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'reset', label: 'Reset', Icon: ResetIcon },
    { id: 'personalise', label: 'Settings', Icon: SettingsIcon },
  ]

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 flex justify-center px-5">
      <div className="pointer-events-auto w-full max-w-[520px] rounded-3xl border border-white/10 bg-black/50 p-2 backdrop-blur-2xl">
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((t) => {
            const isActive = t.id === active
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className={[
                  'h-12 rounded-2xl px-2 text-[11px] font-medium transition active:scale-[0.98] active:opacity-80 flex flex-col items-center justify-center gap-1',
                  isActive
                    ? 'bg-white text-black'
                    : 'bg-transparent text-white/60 hover:bg-white/5 hover:text-white/80',
                ].join(' ')}
              >
                <t.Icon active={isActive} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
