import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { analyzeCheckIn, composeRitual } from './ritualEngine.js'
import { loadHistory, pushHistory } from './storage.js'
import { useCountdown, useSpeechToText } from './hooks.js'
import { BreathVisual, phaseForBreath, isInFinalCycle, getBreathCycleDuration } from './breath.jsx'
import { ImmersiveRitual } from './ImmersiveRitual.jsx'
// IntroSplash now handled at ExhaleApp level
import { MoodMapPicker } from '../exhale/components/MoodMapPicker.jsx'
import { initAudio, playRitualSound, stopAllSounds, fadeOut, setVolume, forceUnlockAudio, isAudioWorking, getAudioState } from './audioEngine.js'
import { initVoice, speak, stopSpeaking, pauseSpeaking, resumeSpeaking } from './voiceEngine.js'
import { generateTimedPrompts, getCurrentPrompt, getPromptToSpeak } from './timedPrompts.js'
import { personalizeAllScripts } from './personalizeApi.js'
import {
  Card,
  GhostButton,
  OpenPlayerShell,
  OpenProgramCard,
  Pill,
  PrimaryButton,
  ProgressDots,
  SmallLink,
  TopBar,
  formatMinutesSeconds,
} from './ui.jsx'

const STEPS = ['mood', 'check-in', 'insight', 'ritual', 'wrap'] // keep aligned with UI dots
const nowIso = () => new Date().toISOString()

const coverForState = (state) =>
  ({ downshift: '/ritual/red-profile.jpg', gentle: '/ritual/season-blue.jpg', upshift: '/ritual/red-athlete.jpg' }[
    state
  ] ?? '/ritual/orange-portal.jpg')

export function RitualMvp({ onOpenDeck, embedded = false, onIntroChange, skipIntro = false, onComplete, onStepChange }) {
  const [step, setStep] = useState('mood')
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [personalizing, setPersonalizing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [ritual, setRitual] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [immersiveMode, setImmersiveMode] = useState(true) // Full-screen immersive ritual view
  const [journalText, setJournalText] = useState('')
  const [sentToUniverse, setSentToUniverse] = useState(false)
  const [history, setHistory] = useState(() => loadHistory())
  const [moodAfter, setMoodAfter] = useState(null)
  const [beforeColor, setBeforeColor] = useState('#FF9408')
  const [afterColor, setAfterColor] = useState('#29D38B')
  const [beforePos, setBeforePos] = useState({ x: 0.5, y: 0.5 })
  const [afterPos, setAfterPos] = useState({ x: 0.5, y: 0.5 })

  const speech = useSpeechToText()
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [audioWorking, setAudioWorking] = useState(false)
  const [showAudioHint, setShowAudioHint] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const voiceAbortRef = useRef(null)
  const [timedPrompts, setTimedPrompts] = useState([])
  const [spokenPrompts, setSpokenPrompts] = useState(new Set())
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [manualSeek, setManualSeek] = useState(null) // For scrubbing
  const progressBarRef = useRef(null)
  
  // Track previous breath phase for sync'd voice prompts
  const prevBreathPhase = useRef(null)
  const lastBreathSpeakTime = useRef(0) // Debounce breath voice prompts
  const breathStarted = useRef(false) // Track if breath ritual has started

  // Initialize audio on first user interaction
  const enableAudio = useCallback(() => {
    if (!audioEnabled) {
      try {
        forceUnlockAudio() // Use force unlock for stubborn browsers like Telegram
        initVoice()
        setAudioEnabled(true)
        setAudioReady(true)
      } catch (e) {
        console.warn('Audio init failed:', e)
      }
    } else {
      // Even if already enabled, try to unlock again (for Telegram)
      forceUnlockAudio()
    }
  }, [audioEnabled])

  const active = ritual[activeIdx]

  // Notify parent of step changes (for hiding/showing global UI)
  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  // Check audio status periodically during ritual
  useEffect(() => {
    if (step === 'ritual') {
      const checkAudio = () => {
        const working = isAudioWorking()
        setAudioWorking(working)
        if (!working && audioEnabled) {
          setShowAudioHint(true)
        }
      }
      checkAudio()
      const interval = setInterval(checkAudio, 2000)
      return () => clearInterval(interval)
    }
  }, [step, audioEnabled])

  // Play appropriate soundscape when ritual step changes
  useEffect(() => {
    if (step === 'ritual' && running && active && audioReady) {
      // First step (activeIdx === 0) should NOT crossfade since there's no previous audio
      // Subsequent steps should crossfade for smooth transitions
      const shouldCrossfade = activeIdx > 0
      playRitualSound(active.id, shouldCrossfade)
    } else if (step !== 'ritual' && audioReady) {
      fadeOut(1.5)
    }
  }, [step, activeIdx, running, active?.id, audioReady])

  // Pause/resume audio based on running state
  useEffect(() => {
    if (!audioReady) return
    if (step === 'ritual' && !running) {
      setVolume(0) // Complete silence when paused
    } else if (step === 'ritual' && running) {
      setVolume(0.5)
    }
  }, [running, step, audioReady])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAllSounds()
      stopSpeaking()
    }
  }, [])

  // Pause/resume voice with audio
  useEffect(() => {
    if (step === 'ritual' && !running) {
      pauseSpeaking()
    } else if (step === 'ritual' && running) {
      resumeSpeaking()
    }
  }, [running, step])

  // Transition prompts for moving between ritual steps
  const TRANSITION_PROMPTS = [
    "And now, onto the next step...",
    "Moving on to what's next...",
    "Let's continue with the next part...",
    "Transitioning now...",
    "Ready for the next step...",
  ]
  
  // Track if we're currently transitioning to prevent double-fires
  const isTransitioning = useRef(false)
  // Track when current step started for minimum duration check
  const stepStartTime = useRef(Date.now())
  
  // Reset step start time when activeIdx changes
  useEffect(() => {
    stepStartTime.current = Date.now()
  }, [activeIdx])

  // Handle step completion - memoized to prevent recreation
  const handleStepComplete = useCallback(() => {
    // Prevent double-firing during transitions
    if (isTransitioning.current) return
    
    // Extra validation - make sure we have a valid ritual
    if (!ritual.length) return
    
    // Minimum step duration check (at least 3 seconds must have passed)
    const elapsed = Date.now() - stepStartTime.current
    if (elapsed < 3000) {
      console.warn('Step completion blocked - too soon:', elapsed, 'ms')
      return
    }
    
    const isLastStep = activeIdx >= ritual.length - 1
    
    if (isLastStep) {
      // Last step completed - finish the ritual
      isTransitioning.current = true
      setRunning(false)
      finish()
    } else {
      // Mark as transitioning
      isTransitioning.current = true
      
      // Check what the NEXT step is
      const nextStep = ritual[activeIdx + 1]
      const isNextBreathing = nextStep?.kind === 'breath'
      
      // More steps remaining - speak transition and auto-continue
      const transitionPrompt = TRANSITION_PROMPTS[activeIdx % TRANSITION_PROMPTS.length]
      
      // Brief pause, speak transition, then advance
      stopSpeaking()
      setCurrentPrompt({ text: transitionPrompt, isNudge: true, time: -1 })
      
      // Temporarily pause while transitioning
      setRunning(false)
      
      // Speak transition and advance after a short delay
      setTimeout(() => {
        if (voiceEnabled) {
          speak(transitionPrompt)
        }
        
        // Longer delay for transition voice to complete (2.5s minimum)
        const transitionDelay = 2500
        
        setTimeout(() => {
          // First update the index
          const newIdx = activeIdx + 1
          setActiveIdx(newIdx)
          // Clear any stale prompts
          setSpokenPrompts(new Set())
          setCurrentPrompt(null)
          prevBreathPhase.current = null
          breathStarted.current = false
          
          // Play sound for next step immediately
          if (ritual[newIdx]) {
            playRitualSound(ritual[newIdx].id, true)
          }
          
          // If next step is breathing, add extra preparation time
          if (isNextBreathing) {
            // Show preparation message
            setCurrentPrompt({ text: 'Get ready to breathe...', isNudge: true, time: -1 })
            
            if (voiceEnabled) {
              setTimeout(() => {
                speak('Get ready. Find a comfortable position.')
              }, 300)
            }
            
            // Longer buffer for breathing exercises (3 seconds)
            setTimeout(() => {
              setCurrentPrompt(null)
              setRunning(true)
              setTimeout(() => {
                isTransitioning.current = false
              }, 1500)
            }, 3000)
          } else {
            // Normal delay for non-breathing exercises
            setTimeout(() => {
              setRunning(true)
              setTimeout(() => {
                isTransitioning.current = false
              }, 1000)
            }, 500)
          }
        }, transitionDelay)
      }, 300)
    }
  }, [activeIdx, ritual, voiceEnabled])

  const { secondsLeft, seekTo } = useCountdown({
    totalSeconds: active?.seconds ?? 0,
    running: step === 'ritual' && running,
    onDone: handleStepComplete,
    stepKey: activeIdx, // Unique key to ensure complete reset between steps
  })

  const totalSeconds = useMemo(() => ritual.reduce((acc, s) => acc + (s.seconds ?? 0), 0), [ritual])
  const completedSeconds = useMemo(() => {
    const before = ritual.slice(0, activeIdx).reduce((acc, s) => acc + (s.seconds ?? 0), 0)
    return before + Math.max(0, (active?.seconds ?? 0) - secondsLeft)
  }, [ritual, activeIdx, active, secondsLeft])

  // Progress within current step (0-100)
  const stepDuration = active?.seconds ?? 1
  const stepProgress = Math.round(((stepDuration - secondsLeft) / stepDuration) * 100)
  
  // Total progress across all steps
  const totalPercent = totalSeconds ? Math.round((completedSeconds / totalSeconds) * 100) : 0
  const elapsedInModule = Math.max(0, (active?.seconds ?? 0) - secondsLeft)

  // Generate timed prompts when ritual step changes
  useEffect(() => {
    if (step === 'ritual' && active) {
      const prompts = generateTimedPrompts(active)
      setTimedPrompts(prompts)
      setSpokenPrompts(new Set())
      setCurrentPrompt(null)
    }
  }, [step, activeIdx, active?.id])

  // Update current prompt and speak at the right time (for non-breath rituals)
  useEffect(() => {
    if (step !== 'ritual' || !running || !active) return
    // Skip timed prompts for breath rituals - they use phase-synced voice
    if (active.kind === 'breath') return
    
    const elapsed = elapsedInModule
    const current = getCurrentPrompt(timedPrompts, elapsed)
    setCurrentPrompt(current)
    
    // Check if we should speak a new prompt
    if (voiceEnabled) {
      const toSpeak = getPromptToSpeak(timedPrompts, elapsed, spokenPrompts)
      if (toSpeak) {
        speak(toSpeak.text)
        setSpokenPrompts(prev => new Set([...prev, toSpeak.time]))
      }
    }
  }, [step, running, active, elapsedInModule, timedPrompts, voiceEnabled, spokenPrompts])

  // Buffer time before breath countdown starts (must match BREATH_PREP_TIME)
  const BREATH_BUFFER_SECONDS = 4
  
  // Adjusted elapsed time for breath exercises (countdown starts after buffer)
  const breathElapsed = useMemo(() => {
    if (active?.kind !== 'breath') return elapsedInModule
    return Math.max(0, elapsedInModule - BREATH_BUFFER_SECONDS)
  }, [active?.kind, elapsedInModule])
  
  // Breath-synced voice prompts - speaks phase changes in sync with visual countdown
  useEffect(() => {
    if (step !== 'ritual' || !running || !active) return
    if (active.kind !== 'breath') return
    
    const now = Date.now()
    
    // Phase 1: During prep time (0-4 seconds) - show "Get ready for breathing", no voice
    if (elapsedInModule < BREATH_BUFFER_SECONDS) {
      breathStarted.current = false
      prevBreathPhase.current = null
      // Don't set currentPrompt here - let ImmersiveRitual use its default for 'prepare' phase
      // Visual shows "Get ready for breathing" via breathPhaseForImmersive with kind: 'prepare'
      return
    }
    
    // Phase 3: Exactly at buffer time - speak the first instruction in sync with visual
    if (!breathStarted.current && elapsedInModule >= BREATH_BUFFER_SECONDS) {
      breathStarted.current = true
      lastBreathSpeakTime.current = now
      
      // Get the first phase instruction (always starts with inhale)
      const firstPhase = phaseForBreath(analysis?.state, 0)
      const countText = firstPhase.total > 4 ? `for ${firstPhase.total} counts` : `for ${firstPhase.total}`
      const instruction = `${firstPhase.text} ${countText}.`
      
      setCurrentPrompt({ text: instruction, isNudge: false, time: 0 })
      
      if (voiceEnabled) {
        speak(instruction)
      }
      // Continue to phase tracking below
    }
    
    // Phase 3: After buffer - orb is now counting, keep prompts in sync
    const phase = phaseForBreath(analysis?.state, breathElapsed)
    const prevPhase = prevBreathPhase.current
    
    // Always update prompt text to match current phase (visual sync)
    const countText = phase.total > 4 ? `for ${phase.total} counts` : `for ${phase.total}`
    const instruction = `${phase.text} ${countText}.`
    
    // Detect phase transition (different phase kind)
    const phaseChanged = phase && (!prevPhase || prevPhase.kind !== phase.kind)
    
    if (phaseChanged) {
      // Always update display text immediately on phase change
      setCurrentPrompt({ text: instruction, isNudge: false, time: breathElapsed })
      
      // Only speak if voice enabled and not too recently
      const timeSinceLastSpeak = now - lastBreathSpeakTime.current
      if (voiceEnabled && timeSinceLastSpeak >= 2500) {
        // Stop any ongoing speech
        stopSpeaking()
        
        // Small delay to ensure clean audio
        setTimeout(() => {
          speak(instruction)
        }, 50)
        
        // Record when we last spoke
        lastBreathSpeakTime.current = now
      }
    }
    
    // Store current phase for next comparison
    prevBreathPhase.current = phase
  }, [step, running, active, elapsedInModule, breathElapsed, analysis?.state, voiceEnabled])

  // Reset state when ritual step changes
  useEffect(() => {
    prevBreathPhase.current = null
    breathStarted.current = false
    lastBreathSpeakTime.current = 0
    setSentToUniverse(false) // Reset "send to universe" for journaling
  }, [activeIdx])

  // Handle progress bar seeking - within current step only
  const handleSeek = useCallback((e) => {
    if (!progressBarRef.current || !active) return
    if (isTransitioning.current) return // Don't seek during transitions
    
    const rect = progressBarRef.current.getBoundingClientRect()
    // Support both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const x = clientX - rect.left
    // Cap at 90% to prevent accidentally triggering step completion
    const pct = Math.max(0, Math.min(0.90, x / rect.width))
    const stepDur = active.seconds ?? 60
    const newElapsed = Math.floor(pct * stepDur)
    
    // Seek the countdown timer (ensures at least 5 seconds remain)
    const safeElapsed = Math.min(newElapsed, stepDur - 5)
    seekTo(safeElapsed)
    
    // Reset spoken prompts - mark all prompts before new time as already spoken
    const newSpoken = new Set([...timedPrompts.filter(p => p.time <= safeElapsed).map(p => p.time)])
    setSpokenPrompts(newSpoken)
    
    // For breath rituals, reset the phase tracker
    if (active.kind === 'breath') {
      prevBreathPhase.current = null
    }
    
    // Update current prompt display immediately
    const current = timedPrompts.filter(p => p.time <= safeElapsed).pop() ?? null
    setCurrentPrompt(current)
    
    // Stop any ongoing speech
    stopSpeaking()
  }, [active, timedPrompts, seekTo])

  const startProcess = async () => {
    setProcessing(true)
    setPersonalizing(false)
    setAnalysis(null)
    setRitual([])
    setActiveIdx(0)
    setRunning(false)
    setMoodAfter(null)

    // Step 1: Analyze check-in and compose ritual
    await new Promise((r) => window.setTimeout(r, 400))

    // Get user's preferred ritual length
    let durationMinutes = 10
    try {
      const stored = localStorage.getItem('exhale_ritual_length')
      if (stored) durationMinutes = parseInt(stored, 10) || 10
    } catch {}

    const a = analyzeCheckIn({ text: input })
    const plan = composeRitual({ analysis: a, durationMinutes })

    setAnalysis(a)
    setProcessing(false)
    setPersonalizing(true)

    // Step 2: Personalize scripts with AI (runs in parallel)
    try {
      const personalizedPlan = await personalizeAllScripts({
        userInput: input,
        rituals: plan,
        emotionalState: a.state,
        tags: a.tags,
      })
      setRitual(personalizedPlan)
    } catch (error) {
      console.warn('Personalization failed, using default scripts:', error)
      setRitual(plan)
    }

    setPersonalizing(false)
    setStep('insight')
  }

  const startRitual = () => {
    enableAudio() // Initialize audio context on user gesture
    setImmersiveMode(true) // Always use immersive mode for rituals
    setStep('ritual')
    setRunning(true)
    // Audio is now handled by useEffect when step changes to 'ritual'
    // No setTimeout needed - it was causing a double-play glitch
  }

  const skipModule = () => {
    const isLastStep = activeIdx >= ritual.length - 1
    stopSpeaking()
    
    if (isLastStep) {
      finish()
    } else {
      // Check if next step is breathing
      const nextStep = ritual[activeIdx + 1]
      const isNextBreathing = nextStep?.kind === 'breath'
      
      // Clear state for new step
      setSpokenPrompts(new Set())
      setCurrentPrompt(null)
      prevBreathPhase.current = null
      breathStarted.current = false
      
      // Calculate next index
      const nextIdx = activeIdx + 1
      
      if (isNextBreathing) {
        // Pause for breathing prep
        setRunning(false)
        setCurrentPrompt({ text: 'Get ready to breathe...', isNudge: true, time: -1 })
        if (voiceEnabled) {
          speak('Get ready.')
        }
        setTimeout(() => {
          setActiveIdx(nextIdx)
          // Play sound AFTER setting index, and resume running
          setTimeout(() => {
            if (ritual[nextIdx]) {
              playRitualSound(ritual[nextIdx].id, true)
            }
            setCurrentPrompt(null)
            setRunning(true)
          }, 300)
        }, 1000)
      } else {
        // Quick transition - DON'T pause, just switch
        setActiveIdx(nextIdx)
        // Small delay to let state update, then play sound
        setTimeout(() => {
          if (ritual[nextIdx]) {
            playRitualSound(ritual[nextIdx].id, true)
          }
        }, 100)
      }
    }
  }
  
  const goBack = () => {
    if (activeIdx <= 0) return // Already at first step
    stopSpeaking()
    
    // Check if previous step is breathing
    const prevStep = ritual[activeIdx - 1]
    const isPrevBreathing = prevStep?.kind === 'breath'
    
    // Pause briefly for smooth transition
    setRunning(false)
    
    // Clear state for new step
    setSpokenPrompts(new Set())
    setCurrentPrompt(null)
    prevBreathPhase.current = null
    breathStarted.current = false
    
    if (isPrevBreathing) {
      // Extra buffer for breathing
      setCurrentPrompt({ text: 'Get ready to breathe...', isNudge: true, time: -1 })
      if (voiceEnabled) {
        speak('Get ready.')
      }
      setTimeout(() => {
        setActiveIdx((i) => Math.max(0, i - 1))
        setTimeout(() => {
          setCurrentPrompt(null)
          setRunning(true)
        }, 1500)
      }, 1000)
    } else {
      // Quick transition for non-breathing
      setActiveIdx((i) => Math.max(0, i - 1))
      setTimeout(() => {
        setRunning(true)
      }, 400)
    }
  }

  // Completion messages for end of ritual
  const COMPLETION_MESSAGES = [
    "You did beautifully. Take this calm with you.",
    "Ritual complete. I hope you're feeling a little lighter.",
    "Well done. You've given yourself a gift today.",
    "That's a wrap. May this peace stay with you.",
    "Your ritual is complete. Be gentle with yourself today.",
  ]

  const finish = () => {
    setRunning(false)
    fadeOut(1)
    
    // Go directly to wrap screen - completion message will play there
    setStep('wrap')
    
    // Speak completion message after transition
    if (voiceEnabled) {
      stopSpeaking()
      const message = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
      setTimeout(() => {
        speak(message)
      }, 500)
    }
  }

  const saveSession = () => {
    if (!analysis) return
    const entry = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      at: nowIso(),
      input: input.slice(0, 1200),
      analysis,
      ritual: ritual.map(({ id, minutes, label, kind }) => ({ id, minutes, label, kind })),
      moodAfter: moodAfter ?? analysis.moodBefore,
      journalText: journalText.slice(0, 1200),
      beforeColor,
      afterColor,
      beforePos,
      afterPos,
    }
    const next = pushHistory(entry)
    setHistory(next)
  }

  const reset = () => {
    stopAllSounds()
    setStep('mood')
    setInput('')
    setAnalysis(null)
    setRitual([])
    setActiveIdx(0)
    setRunning(false)
    setJournalText('')
    setMoodAfter(null)
  }

  const stateLabel =
    analysis?.state === 'downshift'
      ? 'Downshift'
      : analysis?.state === 'upshift'
        ? 'Upshift'
        : analysis?.state === 'gentle'
          ? 'Gentle'
          : 'Steady'

  // Unified buffer time for breathing exercises - must match BREATH_BUFFER_SECONDS
  const BREATH_PREP_TIME = 4
  
  // Calculate breath phase for immersive mode
  const breathPhaseForImmersive = useMemo(() => {
    if (step !== 'ritual' || !active || active.kind !== 'breath') return null
    const totalSecs = active?.seconds ?? 0
    const elapsed = totalSecs - secondsLeft // Time elapsed since step started
    
    // First 4 seconds: "Get ready for breathing" phase (no countdown)
    if (elapsed < BREATH_PREP_TIME) {
      return { kind: 'prepare', text: 'Get ready for breathing', count: null, total: BREATH_PREP_TIME, progress: elapsed / BREATH_PREP_TIME }
    }
    
    // After prep, start actual breathing (subtract prep time)
    const breathElapsed = elapsed - BREATH_PREP_TIME
    return phaseForBreath(analysis?.state, breathElapsed)
  }, [step, active, secondsLeft, analysis?.state])

  // Phase progress for smooth orb animation
  const phaseProgress = useMemo(() => {
    if (!breathPhaseForImmersive) return 0
    // phaseForBreath returns 'progress' (0-1), use that directly
    return breathPhaseForImmersive.progress ?? 0
  }, [breathPhaseForImmersive])

  // Total progress for the current step
  const stepTotalProgress = useMemo(() => {
    if (!active) return 0
    return 1 - (secondsLeft / (active.seconds ?? 1))
  }, [active, secondsLeft])

  // Handle immersive mode exit - go directly to wrap screen
  const handleImmersiveEnd = useCallback(() => {
    stopAllSounds()
    stopSpeaking()
    setRunning(false)
    fadeOut(1)
    // Go directly to wrap - don't disable immersive mode until we're on wrap screen
    setStep('wrap')
  }, [])

  const handleImmersivePause = useCallback(() => {
    setRunning(false)
    pauseSpeaking()
  }, [])

  const handleImmersiveResume = useCallback(() => {
    setRunning(true)
    resumeSpeaking()
  }, [])

  const handleImmersiveSkip = useCallback(() => {
    skipModule()
  }, [activeIdx, ritual.length])

  const handleImmersiveBack = useCallback(() => {
    if (activeIdx > 0) {
      stopSpeaking()
      setSpokenPrompts(new Set())
      setCurrentPrompt(null)
      prevBreathPhase.current = null
      breathStarted.current = false
      setActiveIdx(activeIdx - 1)
      if (ritual[activeIdx - 1]) {
        playRitualSound(ritual[activeIdx - 1].id, true)
      }
    }
  }, [activeIdx, ritual])

  const handleImmersiveToggleVoice = useCallback(() => {
    if (voiceEnabled) stopSpeaking()
    setVoiceEnabled(v => !v)
  }, [voiceEnabled])

  const handleImmersiveToggleAudio = useCallback(() => {
    if (audioEnabled) {
      setVolume(0)
    } else {
      setVolume(0.5)
    }
    setAudioEnabled(v => !v)
  }, [audioEnabled])

  // Handle seeking on immersive progress bar
  const handleImmersiveSeek = useCallback((progress) => {
    // progress is 0-1, convert to elapsed seconds
    const totalSeconds = active?.seconds ?? 0
    const elapsedSeconds = progress * totalSeconds
    seekTo(elapsedSeconds)
  }, [active?.seconds, seekTo])

  // Calculate phase countdown for breathing - use the count from phaseForBreath
  const phaseCountdown = useMemo(() => {
    if (!breathPhaseForImmersive) return null
    // phaseForBreath returns a 'count' property which is the countdown
    return breathPhaseForImmersive.count ?? null
  }, [breathPhaseForImmersive])

  const phaseTotalSeconds = breathPhaseForImmersive?.total || 4

  // Render immersive mode for ritual step
  if (step === 'ritual' && immersiveMode && active && analysis) {
    return (
      <ImmersiveRitual
        ritual={active}
        phase={breathPhaseForImmersive?.kind || 'rest'}
        phaseDisplayText={breathPhaseForImmersive?.text || null}
        phaseProgress={phaseProgress}
        totalProgress={stepTotalProgress}
        secondsLeft={secondsLeft}
        stepLabel={`Step ${activeIdx + 1}/${ritual.length}`}
        onPause={handleImmersivePause}
        onResume={handleImmersiveResume}
        onEnd={handleImmersiveEnd}
        onSkip={handleImmersiveSkip}
        onBack={handleImmersiveBack}
        isPaused={!running}
        currentPrompt={currentPrompt}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleImmersiveToggleVoice}
        audioEnabled={audioEnabled}
        onToggleAudio={handleImmersiveToggleAudio}
        canGoBack={activeIdx > 0}
        phaseCountdown={phaseCountdown}
        phaseTotalSeconds={phaseTotalSeconds}
        onSeek={handleImmersiveSeek}
        totalSeconds={active?.seconds ?? 0}
        // Journal props
        journalText={journalText}
        onJournalChange={(text) => {
          setJournalText(text)
          if (sentToUniverse) setSentToUniverse(false)
        }}
        sentToUniverse={sentToUniverse}
        onSendToUniverse={() => setSentToUniverse(true)}
      />
    )
  }

  return (
    <div className={embedded ? 'text-white' : 'min-h-screen bg-[var(--ritual-bg)] text-white'}>
      {!embedded ? (
        <>
          <TopBar
            title="Exhale"
            left={
              <SmallLink
                onClick={() => {
                  try {
                    onOpenDeck?.('intro')
                  } catch {
                    // ignore
                  }
                }}
              >
                Deck
              </SmallLink>
            }
            right={
              <SmallLink
                onClick={() => {
                  reset()
                }}
              >
                Reset
              </SmallLink>
            }
          />
          <ProgressDots step={step} steps={STEPS} />
        </>
      ) : null}

      <div className={embedded ? 'mx-auto w-full max-w-[520px] px-5 pb-28' : 'mx-auto w-full max-w-[520px] px-5 pb-8'}>
        {step === 'mood' && (
          <div className="pt-8">
            <div className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em]">
              Tell me how you're feeling right now
            </div>
            <div className="pt-3 text-[15px] leading-relaxed text-white/45">
              Drag the orb around to reflect your mood. Choose a color that fits your current mood.
            </div>

            <div className="mt-6">
              <MoodMapPicker
                value={beforeColor}
                onChange={(hex, pos) => {
                  setBeforeColor(hex)
                  if (pos) setBeforePos(pos)
                }}
              />
            </div>

            <div className="mt-6">
              <PrimaryButton onClick={() => {
                  enableAudio() // Initialize audio early on mobile
                  setStep('check-in')
                }}>Continue</PrimaryButton>
            </div>
          </div>
        )}
        {step === 'check-in' && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="text-[24px] font-bold leading-tight">How was your day, really?</div>
              <div className="text-[15px] leading-relaxed text-white/50">
                Chat or pen down your thoughts. We create a bespoke 10-minute ritual that is customised to your daily vibes.
              </div>
              {/* Back button to mood tracker */}
              <button
                type="button"
                onClick={() => setStep('mood')}
                className="flex items-center gap-1.5 text-[13px] font-medium text-white/60 hover:text-white/90 transition-colors mt-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Edit mood
              </button>
            </div>

            <Card>
              <label className="block text-[14px] font-semibold text-white/80">Your check‑in</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What’s on your mind? What’s your body feeling?"
                className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              />

              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!speech.supported) return
                    if (speech.listening) {
                      speech.stop()
                    } else {
                      // Clear input when starting fresh recording
                      // OR pass existing input to append to
                      const existingText = input.trim()
                      speech.start({
                        onText: (t) => {
                          // Speech recognition returns the FULL transcript
                          // so we just set it directly (with any pre-existing text)
                          if (existingText) {
                            setInput(existingText + ' ' + t)
                          } else {
                            setInput(t)
                          }
                        },
                      })
                    }
                  }}
                  disabled={!speech.supported}
                  className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-5 text-[14px] font-semibold text-white/90 transition active:scale-[0.98] active:opacity-80 disabled:opacity-40"
                >
                  {speech.supported
                    ? speech.listening
                      ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          Stop
                        </span>
                      )
                      : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          Yap
                        </span>
                      )
                    : 'Voice not available'}
                </button>

                <PrimaryButton onClick={startProcess} disabled={processing || personalizing || input.trim().length < 12}>
                  {processing ? 'Analyzing...' : personalizing ? 'Personalizing your ritual...' : 'Generate my ritual'}
                </PrimaryButton>

                {speech.error && (
                  <div className="text-[12px] text-rose-200/80">Voice error: {speech.error}</div>
                )}
              </div>
            </Card>

            {history.length > 0 && (
              <div className="pt-4">
                <div className="pb-3 text-[16px] font-semibold text-white/80">My History</div>
                <div className="space-y-3">
                  {history.slice(0, 3).map((h) => {
                    const d = new Date(h.at)
                    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' })
                    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    const tags = h.analysis?.tags ?? []
                    const fromColor = h.beforeColor ?? '#FF9408'
                    const toColor = h.afterColor ?? '#29D38B'
                    return (
                      <div 
                        key={h.id}
                        className="relative overflow-hidden rounded-2xl p-4"
                        style={{
                          background: `linear-gradient(135deg, ${fromColor}35, ${toColor}35)`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1)`,
                        }}
                      >
                        {/* Gradient glow edges */}
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-50"
                          style={{
                            background: `linear-gradient(90deg, ${fromColor}50 0%, transparent 25%, transparent 75%, ${toColor}50 100%)`,
                          }}
                        />
                        <div 
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                        
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-white">
                              {dayName}, {dateStr}
                            </div>
                            <div className="pt-0.5 text-[12px] text-white/60">{timeStr}</div>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {tags.slice(0, 3).map((tag) => (
                              <span 
                                key={tag}
                                className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white/90"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                              >
                                {tag}
                              </span>
                            ))}
                            {!tags.length && (
                              <span 
                                className="rounded-full px-2.5 py-1 text-[11px] text-white/50"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                              >
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'insight' && analysis && (
          <div className="space-y-5 pt-3">
            {/* AI Acknowledgment Section */}
            <div className="space-y-4">
              <div className="text-[13px] font-medium tracking-wide text-white/50 uppercase">
                I hear you
              </div>
              <div className="text-[22px] font-semibold leading-snug text-white/90">
                {analysis.reflection}
              </div>
              
              {/* What we'll focus on */}
              <div className="pt-2 space-y-2.5">
                <div className="text-[13px] font-medium text-white/50">
                  Your ritual will focus on:
                </div>
                <div className="space-y-1.5">
                  {[...new Set(ritual.map((r) => {
                    const focusMap = {
                      'breathwork': 'Calming your nervous system',
                      'meditation': 'Finding stillness',
                      'movement': 'Releasing physical tension',
                      'grounding': 'Grounding you in the present',
                      'cognitive': 'Shifting your perspective',
                      'journal': 'Processing your thoughts',
                      'sound': 'Soothing your mind',
                      'mindset': 'Building inner strength',
                      'sensory': 'Reconnecting with your body',
                      'gratitude': 'Cultivating appreciation',
                      'vision': 'Clarifying your intentions',
                      'brainwave': 'Optimizing your mental state',
                    }
                    return focusMap[r.category] || r.category
                  }))].slice(0, 3).map((focus, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[14px] text-white/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                      {focus}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ritual Preview Card */}
            <OpenProgramCard
                title={`${stateLabel} Reset`}
                subtitle={analysis.recommendation}
                chips={[...new Set(ritual.map((r) => r.category))].map((c) => c.charAt(0).toUpperCase() + c.slice(1))}
                onStart={startRitual}
                emotion={analysis.state}
                intensity={Math.abs(analysis.moodBefore ?? 0) / 2 + 0.3}
              />

            {/* Protocol Details */}
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-semibold text-white/80">Your protocol</div>
                <Pill>{ritual.reduce((acc, s) => acc + s.minutes, 0)} min</Pill>
              </div>
              <div className="pt-3 space-y-3">
                {ritual.map((s, idx) => (
                  <div key={s.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-medium text-white/60 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold">{s.label}</div>
                        {s.description && (
                          <div className="pt-0.5 text-[12px] text-white/50">{s.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-[14px] text-white/60">{s.minutes} min</div>
                  </div>
                ))}
              </div>
              {analysis.tags?.length ? (
                <div className="pt-4 flex flex-wrap gap-2">
                  {analysis.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              ) : null}
            </Card>

            <GhostButton onClick={() => setStep('check-in')}>Edit my check‑in</GhostButton>
          </div>
        )}

        {/* Floating audio unlock button for Telegram/restricted browsers */}
        {step === 'ritual' && showAudioHint && !audioWorking && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <button
              onClick={() => {
                forceUnlockAudio()
                playRitualSound(active?.id, false)
                setShowAudioHint(false)
                setTimeout(() => setAudioWorking(isAudioWorking()), 500)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full animate-pulse"
              style={{
                background: 'rgba(249, 115, 22, 0.9)',
                boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm font-medium">Tap to enable sound</span>
            </button>
          </div>
        )}

        {step === 'ritual' && analysis && active && (
          <div className="space-y-4 pt-3">
            <OpenPlayerShell
                coverTitle={active.label}
                coverSubtitle={`${stateLabel} • Step ${activeIdx + 1}/${ritual.length}`}
                emotion={analysis.state}
                intensity={Math.abs(analysis.moodBefore ?? 0) / 2 + 0.3}
              >
              {/* Friendly description of the micro-ritual */}
              {active.description && (
                <div className="mb-3">
                  <div className="text-[15px] text-white/80 leading-relaxed">
                    {active.description}
                  </div>
                  <div className="mt-1 text-[12px] text-white/40">
                    Just follow along — I'll guide you ✨
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-3">
                <Pill>{formatMinutesSeconds(secondsLeft)}</Pill>
                <div className="flex items-center gap-2">
                  {/* Voice toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceEnabled) stopSpeaking()
                      setVoiceEnabled((v) => !v)
                    }}
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/15',
                      voiceEnabled ? 'bg-white/15 text-white' : 'bg-white/10 text-white/40',
                    ].join(' ')}
                    title={voiceEnabled ? 'Mute voice guide' : 'Enable voice guide'}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                    </svg>
                  </button>
                  {/* Sound toggle */}
                  {audioReady && (
                    <button
                      type="button"
                      onClick={() => setVolume(audioEnabled ? 0 : 0.5) || setAudioEnabled((v) => !v)}
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/15',
                        audioEnabled ? 'bg-white/15 text-white' : 'bg-white/10 text-white/40',
                      ].join(' ')}
                      title={audioEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
                    >
                      {audioEnabled ? (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                  <Pill>{activeIdx + 1}/{ritual.length}</Pill>
                </div>
              </div>

              {/* Interactive progress bar - CURRENT STEP ONLY */}
              <div 
                ref={progressBarRef}
                className="group relative mt-3 h-[10px] w-full cursor-pointer rounded-full bg-white/15 touch-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture?.(e.pointerId)
                  handleSeek(e)
                }}
                onPointerMove={(e) => {
                  if (e.buttons === 1) handleSeek(e)
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                }}
              >
                {/* Progress fill - current step */}
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-white/60 to-white/90 transition-all duration-150" 
                  style={{ width: `${Math.min(stepProgress, 95)}%` }} 
                />
                {/* Draggable thumb */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white shadow-lg transition-transform hover:scale-110 active:scale-125"
                  style={{ 
                    left: `calc(${Math.min(stepProgress, 95)}% - 12px)`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.3)',
                  }} 
                />
                {/* Time remaining tooltip */}
                <div 
                  className="absolute -top-9 -translate-x-1/2 rounded-lg bg-black/90 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `${Math.min(stepProgress, 95)}%` }}
                >
                  {formatMinutesSeconds(secondsLeft)} left
                </div>
              </div>
              
              {/* Time labels */}
              <div className="mt-1 flex justify-between text-[10px] text-white/40">
                <span>{formatMinutesSeconds(elapsedInModule)}</span>
                <span>{formatMinutesSeconds(active?.seconds ?? 0)}</span>
              </div>

              {active.kind === 'breath' ? (
                <div style={{ '--exhale-accent': beforeColor }}>
                  {elapsedInModule < BREATH_BUFFER_SECONDS ? (
                    // During buffer period - show a calm waiting orb
                    <BreathVisual
                      phase={{ kind: 'inhale', count: '', total: 4, text: '', label: 'Get ready', progress: 0, isWaiting: true }}
                      beatKey={0}
                    />
                  ) : (
                    // After buffer - use adjusted elapsed time for proper sync
                    <BreathVisual
                      phase={phaseForBreath(analysis.state, breathElapsed)}
                      beatKey={secondsLeft}
                      isFinalCycle={isInFinalCycle(analysis.state, breathElapsed, (active?.seconds ?? 180) - BREATH_BUFFER_SECONDS)}
                    />
                  )}
                </div>
              ) : null}

              {/* Current prompt display - shows one prompt at a time */}
              <div className="min-h-[140px] flex flex-col justify-center py-4">
                {currentPrompt ? (
                  <div 
                    key={currentPrompt.time}
                    className={[
                      'text-center transition-all duration-500 animate-[fadeInUp_0.5s_ease-out]',
                      currentPrompt.isNudge 
                        ? 'text-[16px] text-white/55 italic' 
                        : 'text-[20px] text-white font-medium leading-relaxed',
                    ].join(' ')}
                  >
                    {currentPrompt.text}
                  </div>
                ) : running && elapsedInModule < 2 ? (
                  <div className="text-center text-[18px] text-white/80 animate-pulse">
                    Get comfortable...
                  </div>
                ) : (
                  <div className="text-center text-[16px] text-white/40">
                    {running ? 'Listen and follow along...' : 'Tap play to begin'}
                  </div>
                )}
              </div>

              {/* Upcoming prompts indicator */}
              {timedPrompts.length > 0 && (
                <div className="flex justify-center gap-1.5">
                  {timedPrompts.slice(0, 6).map((p, idx) => (
                    <div
                      key={idx}
                      className={[
                        'h-1.5 w-1.5 rounded-full transition-all duration-300',
                        p.time <= elapsedInModule ? 'bg-white/60' : 'bg-white/15',
                      ].join(' ')}
                    />
                  ))}
                </div>
              )}

              {active.kind === 'journal' && (
                <div className="pt-4">
                  <label className="block text-[12px] font-semibold text-white/60">Your thoughts</label>
                  <textarea
                    value={journalText}
                    onChange={(e) => {
                      setJournalText(e.target.value)
                      if (sentToUniverse) setSentToUniverse(false) // Reset if they edit after sending
                    }}
                    placeholder="Type or paste your thoughts here…"
                    className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                  />
                  {/* Premium glass chrome button */}
                  {journalText.trim().length > 0 && (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setSentToUniverse(true)}
                        disabled={sentToUniverse}
                        className="relative px-7 py-3 rounded-2xl text-[13px] font-semibold text-white transition-all duration-500 overflow-hidden active:scale-[0.98] group backdrop-blur-xl"
                        style={!sentToUniverse ? {
                          background: 'linear-gradient(145deg, rgba(125,211,252,0.3) 0%, rgba(56,189,248,0.2) 50%, rgba(125,211,252,0.25) 100%)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: `
                            0 0 0 1px rgba(255,255,255,0.1) inset,
                            0 1px 0 rgba(255,255,255,0.4) inset,
                            0 -1px 0 rgba(0,0,0,0.1) inset,
                            0 8px 32px rgba(56,189,248,0.25),
                            0 2px 8px rgba(0,0,0,0.3)
                          `,
                        } : {
                          background: 'linear-gradient(145deg, rgba(139,92,246,0.35) 0%, rgba(109,40,217,0.25) 50%, rgba(139,92,246,0.3) 100%)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: `
                            0 0 0 1px rgba(255,255,255,0.1) inset,
                            0 1px 0 rgba(255,255,255,0.4) inset,
                            0 -1px 0 rgba(0,0,0,0.1) inset,
                            0 8px 32px rgba(139,92,246,0.3),
                            0 2px 8px rgba(0,0,0,0.3)
                          `,
                        }}
                      >
                        {/* Chrome edge highlight */}
                        <div 
                          className="absolute inset-0 rounded-2xl opacity-60"
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
                          }}
                        />
                        {/* Animated shimmer */}
                        {!sentToUniverse && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        )}
                        {/* Inner glow */}
                        <div 
                          className="absolute inset-0 opacity-50"
                          style={{
                            background: sentToUniverse 
                              ? 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.5) 0%, transparent 60%)'
                              : 'radial-gradient(ellipse at 50% 0%, rgba(125,211,252,0.4) 0%, transparent 60%)',
                          }}
                        />
                        <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                          {sentToUniverse ? '✨ The universe accepted it' : 'Send it out to the universe'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-5 grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={activeIdx <= 0}
                  className={`h-12 rounded-2xl border border-white/15 bg-white/5 px-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                    activeIdx <= 0 ? 'text-white/30 cursor-not-allowed' : 'text-white active:opacity-80'
                  }`}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={skipModule}
                  className="h-12 rounded-2xl border border-white/15 bg-white/5 px-2 text-[13px] font-semibold text-white transition active:scale-[0.98] active:opacity-80"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="h-12 rounded-2xl bg-white px-2 text-[13px] font-semibold text-black transition active:scale-[0.98] active:opacity-80"
                >
                  {running ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="h-12 rounded-2xl border border-white/15 bg-white/5 px-2 text-[13px] font-semibold text-white transition active:scale-[0.98] active:opacity-80"
                >
                  End
                </button>
              </div>

              {/* Total ritual progress bar - at bottom */}
              {ritual.length > 1 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="relative h-[4px] w-full rounded-full bg-white/10">
                    {/* Total progress fill */}
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-white/30 transition-all duration-300"
                      style={{ width: `${totalPercent}%` }}
                    />
                    {/* Step boundary markers (dots) */}
                    {ritual.slice(0, -1).map((_, idx) => {
                      const durationBefore = ritual.slice(0, idx + 1).reduce((acc, s) => acc + (s.seconds ?? 0), 0)
                      const position = totalSeconds > 0 ? (durationBefore / totalSeconds) * 100 : 0
                      const isPast = activeIdx > idx
                      return (
                        <div
                          key={idx}
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full transition-all duration-300 ${
                            isPast ? 'bg-green-400/70' : 'bg-white/40'
                          }`}
                          style={{ left: `${position}%` }}
                        />
                      )
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-white/40">
                    <span>Total progress</span>
                    <span>{formatMinutesSeconds(completedSeconds)} / {formatMinutesSeconds(totalSeconds)}</span>
                  </div>
                </div>
              )}
              </OpenPlayerShell>
          </div>
        )}

        {step === 'wrap' && analysis && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="text-[24px] font-bold leading-tight">How are you feeling now?</div>
              <div className="text-[15px] leading-normal text-white/60">
                Drag the orb to reflect your mood after the ritual.
              </div>
            </div>

            <MoodMapPicker
              value={afterColor}
              onChange={(hex, pos) => {
                setAfterColor(hex)
                if (pos) setAfterPos(pos)
              }}
            />

            {/* Premium Before/After comparison */}
            <div 
              className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Chrome top highlight */}
              <div 
                className="absolute top-0 left-6 right-6 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
              />
              
              <div className="p-5">
                <div className="flex items-center justify-between">
                  {/* Before */}
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Before</span>
                    <div 
                      className="relative h-14 w-14 rounded-full"
                      style={{ 
                        background: beforeColor,
                        boxShadow: `0 4px 20px ${beforeColor}60, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                      }}
                    >
                      {/* Glass reflection */}
                      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" style={{ height: '40%' }} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1">
                    <svg width="32" height="12" viewBox="0 0 32 12" fill="none" className="opacity-40">
                      <path d="M0 6H28M28 6L22 1M28 6L22 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* After */}
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">After</span>
                    <div 
                      className="relative h-14 w-14 rounded-full"
                      style={{ 
                        background: afterColor,
                        boxShadow: `0 4px 20px ${afterColor}60, inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                      }}
                    >
                      {/* Glass reflection */}
                      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/30 via-transparent to-transparent" style={{ height: '40%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <PrimaryButton
                onClick={() => {
                  saveSession()
                  reset()
                  // Exit ritual flow and return to dashboard
                  if (onComplete) onComplete()
                }}
              >
                Save & done
              </PrimaryButton>
              <GhostButton onClick={reset}>Start again</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

