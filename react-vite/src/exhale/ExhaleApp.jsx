import { useEffect, useMemo, useState, useRef } from 'react'
import { RitualMvp } from '../ritual/RitualMvp.jsx'
import { IntroSplash } from '../ritual/IntroSplash.jsx'
import { Backdrop } from './components/Backdrop.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { VoiceSettings } from './components/VoiceSettings.jsx'
import { forceUnlockAudio } from '../ritual/audioEngine.js'

function parseMvpSubroute() {
  const raw = window.location.hash?.replace('#', '')?.trim() ?? ''
  if (!raw.startsWith('mvp')) return 'reset'
  const parts = raw.split('/')
  const v = parts[1] || 'reset'
  if (v === 'today' || v === 'home' || v === 'analysis') return 'reset'
  if (v === 'settings' || v === 'personalise') return 'personalise'
  return 'reset'
}

function shouldShowIntro() {
  try {
    if (sessionStorage.getItem('exhale-intro-shown')) return false
    return true
  } catch {
    return true
  }
}

function markIntroShown() {
  try {
    sessionStorage.setItem('exhale-intro-shown', 'true')
  } catch {}
}

export function ExhaleApp({ onOpenDeck }) {
  const [tab, setTab] = useState('reset')
  const [showIntro, setShowIntro] = useState(shouldShowIntro)
  const [ritualActive, setRitualActive] = useState(false) // Track if user is in ritual flow
  const [ritualStep, setRitualStep] = useState(null) // Track current ritual step
  const [menuOpen, setMenuOpen] = useState(false)
  const audioUnlocked = useRef(false)
  
  // Menu is always visible (removed hiding logic)

  // Unlock audio on first user interaction (mobile requires this)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked.current) {
        forceUnlockAudio()
        audioUnlocked.current = true
        console.log('🔊 Audio unlocked on first interaction')
      }
    }
    
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
    document.addEventListener('click', unlockAudio, { once: true, passive: true })
    
    return () => {
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }
  }, [])

  useEffect(() => {
    const apply = () => setTab(parseMvpSubroute())
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const setRoute = (next) => {
    setTab(next)
    setMenuOpen(false) // Close menu when navigating
    // When switching tabs, exit ritual mode
    setRitualActive(false)
    try {
      window.history.replaceState(null, '', `#mvp/${next}`)
    } catch {}
  }

  const title = useMemo(() => {
    if (tab === 'reset') return 'Reset'
    if (tab === 'personalise') return 'Settings'
    return 'Exhale'
  }, [tab])

  const handleIntroDone = () => {
    markIntroShown()
    setShowIntro(false)
  }

  const handleStartRitual = () => {
    setRitualActive(true)
    setRitualStep('mood') // Start at mood step
  }

  const handleRitualComplete = () => {
    setRitualActive(false)
    setRitualStep(null)
  }

  if (showIntro) {
    return <IntroSplash onDone={handleIntroDone} />
  }

  return (
    <div className="min-h-screen text-white">
      <Backdrop variant={tab} />

      <div className="relative z-10">
        {/* Global Hamburger Menu - always visible */}
        <div 
          className="fixed z-[100]"
          style={{
            top: 'max(16px, env(safe-area-inset-top, 16px))',
            right: 'max(16px, env(safe-area-inset-right, 16px))',
          }}
        >
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 flex flex-col items-end justify-center gap-1.5 transition-all active:scale-95"
              >
                <div className="w-5 h-[2px] bg-white rounded-full opacity-70" />
                <div className="w-4 h-[2px] bg-white rounded-full opacity-70" />
              </button>
              
              {/* Dropdown Menu */}
              {menuOpen && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setMenuOpen(false)} 
                  />
                  
                  {/* Menu dropdown */}
                  <div 
                    className="absolute right-0 top-12 z-50 min-w-[160px] rounded-xl overflow-hidden"
                    style={{
                      background: 'rgba(30, 30, 35, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <button
                      onClick={() => setRoute('reset')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                        <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[14px] text-white/80">Reset</span>
                    </button>
                    
                    <div className="h-px bg-white/10" />
                    
                    <button
                      onClick={() => setRoute('personalise')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                      </svg>
                      <span className="text-[14px] text-white/80">Settings</span>
                    </button>
                  </div>
                </>
              )}
            </div>
        </div>

        {/* Header for non-reset tabs */}
        {tab !== 'reset' && !ritualActive && (
          <div className="mx-auto w-full max-w-[520px] px-5 pt-6">
            <div>
              <div className="text-[26px] font-bold tracking-[-0.02em]">{title}</div>
              <div className="pt-1 text-[13px] text-white/55">Breathe · Speak · Reset</div>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === 'reset' ? (
          ritualActive ? (
            <div className="pt-2">
              <RitualMvp 
                onOpenDeck={onOpenDeck} 
                embedded 
                skipIntro 
                onComplete={handleRitualComplete}
                onStepChange={setRitualStep}
              />
            </div>
          ) : (
            <HomePage onNavigate={setRoute} onStartRitual={handleStartRitual} />
          )
        ) : tab === 'personalise' ? (
          <div className="mx-auto w-full max-w-[520px] px-5 pb-10 pt-5">
            <VoiceSettings />
          </div>
        ) : null}
      </div>

    </div>
  )
}
