export function phaseForBreath(state, secondsLeft) {
  if (state === 'upshift') {
    const n = (secondsLeft % 16) + 1
    if (n <= 4) return { kind: 'inhale', text: 'Inhale 4', label: 'Box breath' }
    if (n <= 8) return { kind: 'hold', text: 'Hold 4', label: 'Box breath' }
    if (n <= 12) return { kind: 'exhale', text: 'Exhale 4', label: 'Box breath' }
    return { kind: 'hold', text: 'Hold 4', label: 'Box breath' }
  }
  if (state === 'gentle') {
    const n = (secondsLeft % 10) + 1
    if (n <= 4) return { kind: 'inhale', text: 'Inhale 4', label: 'Soft breath' }
    return { kind: 'exhale', text: 'Exhale 6', label: 'Soft breath' }
  }
  const n = (secondsLeft % 12) + 1
  if (n <= 4) return { kind: 'inhale', text: 'Inhale 4', label: 'Downshift' }
  return { kind: 'exhale', text: 'Exhale 8', label: 'Downshift' }
}

const phaseColor = (kind) => {
  if (kind === 'inhale') return '#29D38B' // green
  if (kind === 'exhale') return '#FF9408' // orange
  if (kind === 'hold') return '#FFD84A' // yellow
  return '#DBE0E1'
}

export function BreathVisual({ phase, beatKey = 0 }) {
  const c = phaseColor(phase?.kind)
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative h-[240px] w-[240px]">
        {/* ambient glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle at 50% 50%, ${c}40, transparent 70%)` }}
        />
        <div
          className={[
            // re-mount on every second so the pulse "hits" the beat
            'absolute inset-8 rounded-full transition-transform duration-300 ease-out',
            phase?.kind === 'inhale' ? 'scale-[1.08]' : '',
            phase?.kind === 'exhale' ? 'scale-[0.90]' : '',
            phase?.kind === 'hold' ? 'scale-[1.00]' : '',
          ].join(' ')}
          key={beatKey}
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.90), ${c} 45%, rgba(0,0,0,0) 72%)`,
            boxShadow: `0 40px 110px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 55px ${c}66`,
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[13px] font-semibold tracking-widest text-white/60">{phase?.label ?? 'BREATHE'}</div>
          <div className="pt-2 text-[26px] font-bold text-white">{phase?.text ?? ''}</div>
          <div className="pt-2 text-[12px] text-white/55">Follow the pulse</div>
        </div>
      </div>
    </div>
  )
}

