import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

export function IntroSplash({ onDone }) {
  const [mode, setMode] = useState('video') // 'video' | 'css'

  useEffect(() => {
    if (prefersReducedMotion()) {
      onDone?.()
      return
    }
    // 6s intro (plus a tiny buffer for event timing)
    const id = window.setTimeout(() => onDone?.(), 6200)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[var(--ritual-bg)] px-5"
      role="dialog"
      aria-label="Exhale intro"
      onClick={() => onDone?.()}
    >
      {/* Preferred: original Blender render (owned) */}
      {mode === 'video' ? (
        <div className="pointer-events-none absolute inset-0">
          <video
            className="h-full w-full object-cover opacity-95"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => onDone?.()}
            onError={() => setMode('css')}
          >
            <source src="/intro/exhale-intro.webm" type="video/webm" />
            <source src="/intro/exhale-intro.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_20%,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(16,12,8,0.35),rgba(16,12,8,0.85))]" />
        </div>
      ) : (
        /* Fallback: CSS glass (still original) */
        <div className="pointer-events-none absolute inset-0">
          <div className="exhale-glow absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,148,8,0.30),transparent_62%)] blur-2xl" />
          <div className="exhale-glow absolute -right-28 top-16 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_65%)] blur-2xl" />
          <div className="exhale-glow absolute left-10 bottom-[-120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(202,63,22,0.22),transparent_65%)] blur-2xl" />
          <div className="exhale-glow absolute right-8 bottom-[-140px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(41,211,139,0.10),transparent_70%)] blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_20%,rgba(255,255,255,0.06),transparent_55%),linear-gradient(180deg,rgba(16,12,8,0.55),rgba(16,12,8,0.88))]" />
        </div>
      )}

      <div className="exhale-intro-fade relative w-full max-w-[420px]">
        {mode === 'css' ? (
          <div className="exhale-glass-wrap relative">
            <div className="exhale-glass" />
            <div className="exhale-glass-reflection" />
          </div>
        ) : null}

        {/* brand */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center justify-center rounded-3xl border border-white/10 bg-black/35 px-6 py-5 backdrop-blur-2xl">
            <div>
              <div className="text-[34px] font-bold tracking-[-0.02em] text-[var(--ritual-paper)]">
                Exhale
              </div>
              <div className="pt-2 text-[15px] leading-relaxed text-white/70">
                Breathe. Speak. Reset.
              </div>
              <div className="pt-4 text-[12px] font-semibold text-white/45">Tap to skip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

