export function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'reset', label: 'Reset' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'personalise', label: 'Personalise' },
  ]

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 flex justify-center px-5">
      <div className="pointer-events-auto w-full max-w-[520px] rounded-3xl border border-white/10 bg-black/35 p-2 backdrop-blur-2xl">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((t) => {
            const isActive = t.id === active
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className={[
                  'h-11 rounded-2xl px-3 text-[13px] font-semibold transition active:scale-[0.98] active:opacity-80',
                  isActive
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10',
                ].join(' ')}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

