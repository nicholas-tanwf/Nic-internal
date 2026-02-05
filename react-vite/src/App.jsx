import { useEffect, useMemo, useState } from 'react'
import { DeckShell } from './deck/DeckShell.jsx'
import { SlideRenderer } from './deck/SlideRenderer.jsx'
import { SECTIONS, SLIDES } from './content/deck.content.js'
import { ExhaleApp } from './exhale/ExhaleApp.jsx'

const LOCALE_KEY = 'deck-locale'
const ROUTE_MVP = 'mvp'

function App() {
  const sections = useMemo(() => SECTIONS, [])
  const slides = useMemo(() => SLIDES, [])
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id)
  const [locale, setLocale] = useState('en')
  const [route, setRoute] = useState(ROUTE_MVP) // default to MVP for demo

  // Keep slide selection resilient on static hosting (hash-based).
  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash?.replace('#', '')?.trim()

      if (!raw) {
        setRoute(ROUTE_MVP)
        return
      }

      if (raw === ROUTE_MVP || raw.startsWith(`${ROUTE_MVP}/`)) {
        setRoute(ROUTE_MVP)
        return
      }

      setRoute('deck')
      if (sections.some((s) => s.id === raw)) setActiveSectionId(raw)
    }

    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [sections])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_KEY)
      if (stored === 'en' || stored === 'zh') {
        setLocale(stored)
        return
      }
    } catch {
      // ignore
    }

    const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
    const prefersZh = langs.some((l) => String(l).toLowerCase().startsWith('zh'))
    setLocale(prefersZh ? 'zh' : 'en')
  }, [])

  const toggleLocale = () => {
    setLocale((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh'
      try {
        window.localStorage.setItem(LOCALE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }

  const selectSection = (id) => {
    setRoute('deck')
    setActiveSectionId(id)
    try {
      window.history.replaceState(null, '', `#${id}`)
    } catch {
      // ignore
    }
  }

  const goMvp = () => {
    setRoute(ROUTE_MVP)
    try {
      window.history.replaceState(null, '', `#${ROUTE_MVP}`)
    } catch {
      // ignore
    }
  }

  if (route === ROUTE_MVP) {
    return <ExhaleApp onOpenDeck={selectSection} />
  }

  return (
    <DeckShell
      sections={sections}
      activeSectionId={activeSectionId}
      onSelectSection={selectSection}
      locale={locale}
      onToggleLocale={toggleLocale}
    >
      <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-50 flex justify-center px-5">
        <div className="pointer-events-auto w-full max-w-[420px] rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur">
          <button
            type="button"
            onClick={goMvp}
            className="h-12 w-full rounded-xl bg-white/10 px-4 text-[14px] font-semibold text-white transition active:scale-[0.98] active:opacity-80 disabled:opacity-40"
          >
            Open Ritual MVP
          </button>
        </div>
      </div>

      <SlideRenderer slides={slides} activeSectionId={activeSectionId} locale={locale} />
    </DeckShell>
  )
}

export default App
