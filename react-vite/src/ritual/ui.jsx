import { useMemo } from 'react'
import { GenerativeRitualBg } from './GenerativeRitualBg.jsx'

export function formatMinutesSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/90">
      {children}
    </span>
  )
}

export function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[56px] w-full rounded-2xl px-6 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40 relative overflow-hidden group"
      style={{
        background: 'linear-gradient(145deg, rgba(125,211,252,0.25) 0%, rgba(56,189,248,0.15) 50%, rgba(125,211,252,0.2) 100%)',
        border: '1px solid rgba(255,255,255,0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.1) inset,
          0 1px 0 rgba(255,255,255,0.3) inset,
          0 -1px 0 rgba(0,0,0,0.1) inset,
          0 8px 32px rgba(56,189,248,0.2),
          0 2px 8px rgba(0,0,0,0.3)
        `,
      }}
    >
      {/* Top chrome highlight */}
      <div 
        className="absolute top-0 left-4 right-4 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        }}
      />
      {/* Glass reflection */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
        }}
      />
      {/* Animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
      {/* Inner glow */}
      <div 
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(125,211,252,0.3) 0%, transparent 60%)',
        }}
      />
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{children}</span>
    </button>
  )
}

export function GhostButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[52px] w-full rounded-2xl border border-white/15 bg-transparent px-5 text-[16px] font-semibold text-white transition active:scale-[0.98] active:opacity-80"
    >
      {children}
    </button>
  )
}

export function Card({ children }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  )
}

export function TopBar({ title, right, left }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5">
      <div className="min-w-0">{left}</div>
      <div className="min-w-0 text-center text-[16px] font-semibold text-white/95">{title}</div>
      <div className="min-w-0 text-right">{right}</div>
    </div>
  )
}

export function SmallLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-xl px-3 text-[14px] font-semibold text-white/80 transition active:scale-[0.98] active:opacity-80"
    >
      {children}
    </button>
  )
}

export function ProgressDots({ step, steps }) {
  const items = useMemo(() => steps ?? [], [steps])
  return (
    <div className="flex items-center justify-center gap-2 pb-2 pt-3">
      {items.map((s) => {
        const active = s === step
        return (
          <span
            key={s}
            className={[
              'h-2 w-2 rounded-full transition',
              active ? 'bg-white' : 'bg-white/20',
            ].join(' ')}
          />
        )
      })}
    </div>
  )
}

export function OpenProgramCard({ title, subtitle, chips, onStart, variant = 'warm', emotion = 'steady', intensity = 0.5 }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
      {/* AI-generated flowing background - reflects user's emotional state */}
      <GenerativeRitualBg variant={variant} emotion={emotion} intensity={intensity} />
      
      {/* Gradient overlay for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.7)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_circle_at_50%_0%,rgba(255,255,255,0.08),transparent_50%)]" />
      
      <div className="relative p-6">
        <div className="text-[12px] font-semibold tracking-wide text-white/70">TODAY • 10 MIN</div>
        <div className="pt-2 text-[26px] font-bold leading-tight text-white drop-shadow-lg">{title}</div>
        <div className="pt-2 text-[15px] leading-relaxed text-white/80">{subtitle}</div>

        <div className="pt-4 flex flex-wrap gap-2">
          {chips?.map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>

        <div className="pt-5">
          <button
            type="button"
            onClick={onStart}
            className="h-[52px] w-full rounded-2xl bg-white/95 px-5 text-[16px] font-semibold text-black shadow-xl transition active:scale-[0.98] active:opacity-80"
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  )
}

export function OpenPlayerShell({ coverTitle, coverSubtitle, children, variant = 'warm', emotion = 'steady', intensity = 0.5 }) {
  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-white/10 bg-black">
      {/* AI-generated flowing background - reflects user's emotional state */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <GenerativeRitualBg variant={variant} emotion={emotion} intensity={intensity} />
      </div>
      
      {/* Gradient overlays for depth and readability */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.8)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
      
      {/* Bottom accent glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-[radial-gradient(600px_circle_at_50%_100%,rgba(255,148,8,0.15),transparent_60%)]" />

      <div className="relative p-6">
        <div className="text-[12px] font-semibold tracking-wide text-white/60">{coverSubtitle}</div>
        <div className="pt-1 text-[20px] font-bold text-white drop-shadow-lg">{coverTitle}</div>
      </div>

      <div className="relative px-6 pb-6">{children}</div>
    </div>
  )
}

