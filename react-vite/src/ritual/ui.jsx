import { useMemo } from 'react'

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
      className="h-[52px] w-full rounded-2xl bg-white px-5 text-[16px] font-semibold text-black transition active:scale-[0.98] active:opacity-80 disabled:opacity-40"
    >
      {children}
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

export function OpenProgramCard({ title, subtitle, chips, onStart }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(255,255,255,0.14),transparent_55%),radial-gradient(900px_circle_at_70%_70%,rgba(255,148,8,0.25),transparent_52%),linear-gradient(180deg,rgba(16,12,8,0.20),rgba(16,12,8,0.80))]" />
      <div className="absolute inset-0 opacity-35 bg-[image:var(--ritual-cover)] bg-cover bg-center" />
      <div className="relative p-6">
        <div className="text-[12px] font-semibold tracking-wide text-white/70">TODAY • 10 MIN</div>
        <div className="pt-2 text-[26px] font-bold leading-tight text-white">{title}</div>
        <div className="pt-2 text-[15px] leading-relaxed text-white/70">{subtitle}</div>

        <div className="pt-4 flex flex-wrap gap-2">
          {chips?.map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>

        <div className="pt-5">
          <button
            type="button"
            onClick={onStart}
            className="h-[52px] w-full rounded-2xl bg-[var(--ritual-paper)] px-5 text-[16px] font-semibold text-black transition active:scale-[0.98] active:opacity-80"
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  )
}

export function OpenPlayerShell({ coverTitle, coverSubtitle, children }) {
  return (
    <div className="relative min-h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-white/10 bg-black/40">
      {/* IMPORTANT: pointer-events-none so buttons remain clickable (Skip bug fix) */}
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[image:var(--ritual-cover)] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_15%,rgba(255,148,8,0.18),transparent_55%),radial-gradient(800px_circle_at_20%_80%,rgba(149,18,44,0.20),transparent_55%),linear-gradient(180deg,rgba(16,12,8,0.55),rgba(16,12,8,0.92))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 blur-2xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,148,8,0.30),rgba(202,63,22,0.22),rgba(149,18,44,0.18),rgba(255,148,8,0.30))]" />
      {/* Micro-ritual glow like the reference (bottom color wash) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-[radial-gradient(800px_circle_at_50%_120%,color-mix(in_srgb,var(--exhale-accent,#ff9408)_60%,transparent),transparent_62%),linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.65))]" />

      <div className="relative p-6">
        <div className="text-[12px] font-semibold tracking-wide text-white/60">{coverSubtitle}</div>
        <div className="pt-1 text-[20px] font-bold text-white">{coverTitle}</div>
      </div>

      <div className="relative px-6 pb-6">{children}</div>
    </div>
  )
}

