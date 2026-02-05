import { useEffect, useMemo, useState } from 'react'
import { RitualMvp } from '../ritual/RitualMvp.jsx'
import { Backdrop } from './components/Backdrop.jsx'
import { TabBar } from './components/TabBar.jsx'
import { SmartAnalysis } from './pages/SmartAnalysis.jsx'
import { GlassPanel } from './components/GlassPanel.jsx'

function parseMvpSubroute() {
  // hash formats:
  //  - #mvp
  //  - #mvp/today
  //  - #mvp/analysis
  const raw = window.location.hash?.replace('#', '')?.trim() ?? ''
  if (!raw.startsWith('mvp')) return 'today'
  const parts = raw.split('/')
  const v = parts[1] || 'reset'
  // backward compat
  if (v === 'today') return 'reset'
  if (v === 'settings') return 'personalise'
  return v
}

export function ExhaleApp({ onOpenDeck }) {
  const [tab, setTab] = useState('reset')

  useEffect(() => {
    const apply = () => setTab(parseMvpSubroute())
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const setRoute = (next) => {
    setTab(next)
    try {
      window.history.replaceState(null, '', `#mvp/${next}`)
    } catch {
      // ignore
    }
  }

  const title = useMemo(() => {
    if (tab === 'analysis') return 'Smart analysis'
    if (tab === 'reset') return 'Reset'
    if (tab === 'personalise') return 'Personalise'
    return 'Exhale'
  }, [tab])

  return (
    <div className="min-h-screen text-white">
      <Backdrop variant={tab} />

      {tab === 'reset' ? null : (
        <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[26px] font-bold tracking-[-0.02em]">{title}</div>
              <div className="pt-1 text-[13px] text-white/55">
                Breathe • Speak • Reset
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenDeck?.('intro')}
              className="h-11 rounded-2xl border border-white/10 bg-black/35 px-4 text-[13px] font-semibold text-white/80 backdrop-blur-2xl transition active:scale-[0.98] active:opacity-80"
            >
              Deck
            </button>
          </div>
        </div>
      )}

      {tab === 'analysis' ? (
        <SmartAnalysis />
      ) : tab === 'personalise' ? (
        <div className="mx-auto w-full max-w-[520px] px-5 pb-28 pt-5">
          <GlassPanel>
            <div className="text-[16px] font-semibold">Voice</div>
            <div className="pt-2 text-[14px] text-white/60">
              Coming next: guide voice (male/female), tone (calm/happy/composed), and sound layers (rain/nature).
            </div>
          </GlassPanel>
        </div>
      ) : (
        <div className="pt-2">
          <RitualMvp onOpenDeck={onOpenDeck} embedded />
        </div>
      )}

      <TabBar active={tab} onChange={setRoute} />
    </div>
  )
}

