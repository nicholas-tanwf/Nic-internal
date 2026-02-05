import { useEffect, useMemo, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion.js'
import { SourcesPanel } from './SourcesPanel.jsx'

export function DeckShell({
  sections,
  activeSectionId,
  onSelectSection,
  locale,
  onToggleLocale,
  children,
}) {
  const activeIndex = useMemo(() => {
    const idx = sections.findIndex((s) => s.id === activeSectionId)
    return idx >= 0 ? idx : 0
  }, [activeSectionId, sections])

  const reduceMotion = prefersReducedMotion()
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const scrollRef = useRef(null)
  const lastScrollTopRef = useRef(0)

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex < sections.length - 1

  const goPrev = () => {
    if (!canGoPrev) return
    onSelectSection(sections[activeIndex - 1]?.id ?? sections[0]?.id)
  }

  const goNext = () => {
    if (!canGoNext) return
    onSelectSection(
      sections[activeIndex + 1]?.id ?? sections[sections.length - 1]?.id,
    )
  }

  useEffect(() => {
    if (sourcesOpen) return
    const onKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, canGoNext, canGoPrev, sections, sourcesOpen])

  // When changing slides, ensure the content area starts at the top.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const behavior = reduceMotion ? 'auto' : 'smooth'
    try {
      el.scrollTo({ top: 0, behavior })
    } catch {
      el.scrollTop = 0
    }
  }, [activeSectionId, reduceMotion])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        const nextTop = el.scrollTop ?? 0
        const prevTop = lastScrollTopRef.current ?? 0
        const delta = nextTop - prevTop

        // Ignore tiny movements to avoid jitter.
        if (Math.abs(delta) >= 8) {
          if (delta > 0) setNavHidden(true)
          if (delta < 0) setNavHidden(false)
          lastScrollTopRef.current = nextTop
        }
        ticking = false
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function pickCopy(value) {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') return value?.[locale] ?? value?.en ?? ''
    return String(value)
  }

  function Icon({ name, isActive }) {
    const common =
      'h-5 w-5 transition-transform will-change-transform ' +
      (isActive && !reduceMotion ? 'scale-110' : '')
    switch (name) {
      case 'spark':
        return (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={common}
            fill="none"
            stroke="url(#deckIconGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="deckIconGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path d="M12 2l1.2 4.3L17.5 7.5l-4.3 1.2L12 13l-1.2-4.3L6.5 7.5l4.3-1.2L12 2z" />
            <path d="M19 13l.6 2.1 2.1.6-2.1.6L19 18l-.6-2.1-2.1-.6 2.1-.6L19 13z" />
          </svg>
        )
      case 'bolt':
        return (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={common}
            fill="none"
            stroke="url(#deckIconGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="deckIconGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <path d="M13 2L3 14h7l-1 8 12-14h-8l0-6z" />
          </svg>
        )
      case 'globe':
        return (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={common}
            fill="none"
            stroke="url(#deckIconGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="deckIconGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2c3 3 3 17 0 20" />
            <path d="M12 2c-3 3-3 17 0 20" />
          </svg>
        )
      case 'target':
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={common}
            fill="none"
            stroke="url(#deckIconGrad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient id="deckIconGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#67e8f9" />
                <stop offset="55%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3" />
            <path d="M22 12h-3" />
          </svg>
        )
    }
  }

  return (
    <div className="h-[100dvh] overflow-hidden text-white">
      <div
        className="fixed inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1200px circle at 18% -5%, rgba(34,211,238,0.34), transparent 58%), radial-gradient(900px circle at 82% 8%, rgba(34,197,94,0.24), transparent 60%), radial-gradient(1100px circle at 55% 85%, rgba(45,212,191,0.18), transparent 62%), radial-gradient(900px circle at 16% 92%, rgba(249,115,22,0.22), transparent 62%), radial-gradient(900px circle at 92% 38%, rgba(249,115,22,0.16), transparent 60%), linear-gradient(135deg, #04081a 0%, #07152a 30%, #031021 55%, #04081a 100%)',
        }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-70"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(700px circle at 22% 15%, rgba(34,211,238,0.16), transparent 62%), radial-gradient(700px circle at 78% 30%, rgba(34,197,94,0.12), transparent 65%), radial-gradient(900px circle at 55% 110%, rgba(20,184,166,0.18), transparent 60%), radial-gradient(700px circle at 10% 78%, rgba(249,115,22,0.16), transparent 62%), radial-gradient(700px circle at 95% 88%, rgba(249,115,22,0.12), transparent 62%)',
          filter: 'blur(0.6px)',
        }}
      />
      <div
        className={[
          'fixed inset-0 -z-10 opacity-50',
          reduceMotion ? '' : 'deck-aurora',
        ].join(' ')}
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(900px circle at 30% 30%, rgba(249,115,22,0.14), transparent 60%), radial-gradient(900px circle at 70% 30%, rgba(34,211,238,0.12), transparent 62%), radial-gradient(1100px circle at 50% 90%, rgba(34,197,94,0.10), transparent 65%)',
        }}
      />
      <div
        className="fixed inset-0 -z-10 opacity-25"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(1px 1px at 38% 78%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(1px 1px at 72% 34%, rgba(255,255,255,0.18), transparent 60%)',
        }}
      />

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="absolute inset-0 border-b border-white/10 bg-black/20 backdrop-blur" />
        <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6">
          <div className="text-sm font-semibold tracking-wide text-white/80">
            First Prompt • 4-slide brief
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSourcesOpen(true)}
              className="h-10 w-10 rounded-full border border-white/12 bg-white/6 text-white/85 backdrop-blur transition hover:border-white/20 hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={locale === 'zh' ? '打开来源/署名' : 'Open sources / attribution'}
              title={locale === 'zh' ? '来源' : 'Sources'}
            >
              <span className="sr-only">{locale === 'zh' ? '来源' : 'Sources'}</span>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                className="mx-auto text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onToggleLocale}
              className="h-10 rounded-full border border-white/12 bg-white/6 px-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:border-white/20 hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={locale === 'zh' ? '切换到英文' : 'Switch to Chinese'}
            >
              {locale === 'zh' ? 'English' : '中文'}
            </button>
          </div>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="mx-auto h-[100dvh] w-full max-w-[1200px] overflow-y-auto px-5 pb-28 pt-24 md:px-6 md:pb-32 md:pt-28"
      >
        {children}
      </main>

      <nav
        className={[
          'fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/20 backdrop-blur',
          'transition-transform duration-200 ease-out',
          // Keep navigation always accessible; when "hidden", only fade slightly.
          navHidden ? 'translate-y-0 opacity-45' : 'translate-y-0 opacity-75 hover:opacity-100',
        ].join(' ')}
        aria-label="BOTTOM NAVIGATION"
      >
        <div className="mx-auto w-full max-w-[1200px] px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <ul className="flex items-center gap-2">
              {sections.map((s, i) => {
                const isActive = i === activeIndex
                const label = pickCopy(s.a11yLabel)
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSection(s.id)}
                      className={[
                        'flex h-12 w-12 items-center justify-center rounded-xl border transition',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                        isActive
                          ? 'border-white/25 bg-white/10 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_22px_rgba(34,197,94,0.14)]'
                          : 'border-white/12 bg-white/0 text-white/70 hover:border-white/25 hover:bg-white/5 active:scale-[0.98] active:opacity-80',
                      ].join(' ')}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={label}
                      title={label}
                    >
                      <Icon name={s.icon} isActive={isActive} />
                      <span className="sr-only">{label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className={[
                  'inline-flex h-12 w-12 items-center justify-center rounded-xl border transition',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  canGoPrev
                    ? 'border-white/12 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
                    : 'cursor-not-allowed border-white/10 bg-white/0 text-white/35',
                ].join(' ')}
                aria-label={locale === 'zh' ? '上一页' : 'Previous slide'}
                title={locale === 'zh' ? '上一页' : 'Previous'}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  className="text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className={[
                  'inline-flex h-12 w-12 items-center justify-center rounded-xl border transition',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  canGoNext
                    ? 'border-white/12 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]'
                    : 'cursor-not-allowed border-white/10 bg-white/0 text-white/35',
                ].join(' ')}
                aria-label={locale === 'zh' ? '下一页' : 'Next slide'}
                title={locale === 'zh' ? '下一页' : 'Next'}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  className="text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-1" aria-label="Slide progress">
                {sections.map((s, i) => {
                  const isActive = i === activeIndex
                  return (
                    <div
                      key={s.id}
                      className={[
                        'h-2 w-2 rounded-full transition-transform',
                        isActive ? 'bg-white/90' : 'bg-white/25',
                        !reduceMotion && isActive ? 'scale-125 animate-pulse' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  )
                })}
              </div>
              <div className="text-xs font-semibold tabular-nums text-white/75">
                {String(activeIndex + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SourcesPanel
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        locale={locale}
      />
    </div>
  )
}

