import { useEffect, useMemo, useRef } from 'react'

/**
 * Full-screen immersive ritual experience
 * Features animated background and breathing orb for breath exercises
 */
export function ImmersiveRitual({
  ritual,        // Current ritual step object
  phase,         // 'inhale' | 'hold' | 'exhale' | 'rest'
  phaseDisplayText, // Optional text override for phase (e.g., "Get ready")
  phaseProgress, // 0-1 progress within current phase
  totalProgress, // 0-1 overall ritual progress
  secondsLeft,
  stepLabel,     // e.g. "Step 1/3"
  onPause,
  onResume,
  onEnd,
  onSkip,
  onBack,
  isPaused,
  currentPrompt, // Text prompt to display
  voiceEnabled,
  onToggleVoice,
  audioEnabled,
  onToggleAudio,
  canGoBack,     // Whether back button should be enabled
  phaseCountdown, // Countdown seconds for current breath phase
  phaseTotalSeconds, // Total seconds for current phase
  onSeek,        // Callback when user seeks on progress bar (0-1 progress)
  totalSeconds,  // Total seconds for this step
  // Journal props
  journalText,
  onJournalChange,
  sentToUniverse,
  onSendToUniverse,
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  
  // Is this a breathing exercise?
  const isBreathExercise = ritual?.kind === 'breath'
  
  // Is this a journaling exercise?
  const isJournalExercise = ritual?.kind === 'journal'

  // Animated gradient background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    
    let time = 0
    
    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      
      // Dark base
      ctx.fillStyle = '#0a0a12'
      ctx.fillRect(0, 0, w, h)
      
      // Animated gradient blobs
      const blobs = [
        { x: 0.3 + Math.sin(time * 0.5) * 0.1, y: 0.3 + Math.cos(time * 0.3) * 0.1, r: 0.4, color: 'rgba(30, 58, 138, 0.4)' }, // Deep blue
        { x: 0.7 + Math.cos(time * 0.4) * 0.1, y: 0.5 + Math.sin(time * 0.6) * 0.1, r: 0.35, color: 'rgba(249, 115, 22, 0.25)' }, // Orange
        { x: 0.5 + Math.sin(time * 0.7) * 0.15, y: 0.7 + Math.cos(time * 0.5) * 0.1, r: 0.3, color: 'rgba(125, 211, 252, 0.2)' }, // Light blue
        { x: 0.2 + Math.cos(time * 0.3) * 0.1, y: 0.6 + Math.sin(time * 0.4) * 0.1, r: 0.25, color: 'rgba(255, 255, 255, 0.08)' }, // White glow
        { x: 0.8 + Math.sin(time * 0.6) * 0.1, y: 0.3 + Math.cos(time * 0.7) * 0.1, r: 0.2, color: 'rgba(251, 146, 60, 0.2)' }, // Light orange
      ]
      
      blobs.forEach(blob => {
        const gradient = ctx.createRadialGradient(
          blob.x * w, blob.y * h, 0,
          blob.x * w, blob.y * h, blob.r * Math.max(w, h)
        )
        gradient.addColorStop(0, blob.color)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      })
      
      // Subtle noise/grain overlay
      ctx.globalAlpha = 0.03
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        ctx.fillStyle = Math.random() > 0.5 ? 'white' : 'black'
        ctx.fillRect(x, y, 1, 1)
      }
      ctx.globalAlpha = 1
      
      time += 0.008
      animationRef.current = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // Orb size based on phase (inhale = grow, exhale = shrink)
  const orbScale = useMemo(() => {
    if (phase === 'inhale') return 1 + (phaseProgress * 0.3)
    if (phase === 'exhale') return 1.3 - (phaseProgress * 0.3)
    if (phase === 'hold') return 1.3
    return 1
  }, [phase, phaseProgress])

  // Phase display text - use override if provided, otherwise derive from phase
  const phaseText = useMemo(() => {
    if (phaseDisplayText) return phaseDisplayText
    if (phase === 'inhale') return 'Inhale'
    if (phase === 'exhale') return 'Exhale'
    if (phase === 'hold') return 'Hold'
    if (phase === 'prepare') return 'Get ready'
    if (phase === 'rest') return 'Rest'
    return ''
  }, [phase, phaseDisplayText])
  
  // Check if we're in the preparation phase (no countdown shown)
  const isPrepPhase = phase === 'prepare'

  // Orb color based on phase - smooth gradient transitions
  const orbColors = useMemo(() => {
    // Warm colors for inhale (yellow/orange)
    if (phase === 'inhale') return { inner: '#FBBF24', outer: '#F97316', accent: '#FDE68A' }
    // Cool colors for exhale (pink/purple)  
    if (phase === 'exhale') return { inner: '#F472B6', outer: '#8B5CF6', accent: '#DDD6FE' }
    // Soft warm for hold (peach/coral)
    if (phase === 'hold') return { inner: '#FB923C', outer: '#EC4899', accent: '#FED7AA' }
    // Calm blue for prepare phase
    if (phase === 'prepare') return { inner: '#7DD3FC', outer: '#38BDF8', accent: '#BAE6FD' }
    // Neutral for rest (light blue/lavender)
    return { inner: '#A78BFA', outer: '#6366F1', accent: '#C4B5FD' }
  }, [phase])

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // Accent color for non-breath exercises
  const accentColor = '#7DD3FC'

  return (
    <div className="fixed inset-0 z-[200] flex flex-col overflow-hidden">
      {/* Animated canvas background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Header with ritual info */}
      <div 
        className="relative z-10 px-5"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        {/* Ritual title and step */}
        <div className="text-center mb-2">
          <div className="text-white/40 text-[12px] uppercase tracking-wider mb-1">
            {stepLabel}
          </div>
          <h2 className="text-white text-xl font-semibold">
            {ritual?.label || 'Micro-Ritual'}
          </h2>
          {ritual?.description && (
            <p className="text-white/50 text-[14px] mt-1 leading-relaxed max-w-sm mx-auto">
              {ritual.description}
            </p>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        
        {/* Breathing Visual - pure diffused ambient glow behind text */}
        {isBreathExercise && (
          <div className="relative flex flex-col items-center justify-center">
            {/* Soft diffused ambient glow - no hard edges, just pure color */}
            <div 
              className="absolute transition-all ease-out"
              style={{
                width: `${300 * orbScale}px`,
                height: `${300 * orbScale}px`,
                background: `radial-gradient(ellipse at center, ${orbColors.inner}50 0%, ${orbColors.outer}30 40%, transparent 70%)`,
                opacity: 0.8,
                transitionDuration: '2500ms',
                transform: 'translateZ(0)',
              }}
            />
            
            {/* Large phase text */}
            <h1 
              className="relative z-10 text-white font-light tracking-wide text-center"
              style={{ 
                fontSize: '52px',
                textShadow: '0 4px 30px rgba(0,0,0,0.3)',
                transitionDuration: '500ms',
              }}
            >
              {phaseText}
            </h1>
            
            {/* Countdown number */}
            {phaseCountdown !== null && phaseCountdown > 0 && (
              <div 
                className="relative z-10 mt-2 mb-3 flex items-center justify-center"
              >
                <span 
                  className="text-white/90 font-light animate-countdown"
                  style={{ 
                    fontSize: '72px',
                    textShadow: '0 4px 40px rgba(0,0,0,0.4)',
                    fontVariantNumeric: 'tabular-nums',
                    animation: 'countdownPulse 1s ease-out',
                  }}
                  key={phaseCountdown} // Force re-render for animation
                >
                  {phaseCountdown}
                </span>
              </div>
            )}
            
            {/* Animation styles */}
            <style>{`
              @keyframes countdownPulse {
                0% { transform: scale(1.15); opacity: 0.7; }
                50% { transform: scale(1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
            
            {/* Instruction text below */}
            <p 
              className="relative z-10 text-white/60 text-base text-center max-w-xs mt-2"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
            >
              {currentPrompt?.text || getDefaultPrompt(phase)}
            </p>
          </div>
        )}

        {/* Non-breath exercises */}
        {!isBreathExercise && (
          <div className="w-full max-w-md px-4">
            {/* Prompt text */}
            <p 
              className="text-white text-2xl font-light leading-relaxed text-center mb-6"
              style={{ lineHeight: 1.5 }}
            >
              {currentPrompt?.text || 'Follow the guidance...'}
            </p>
            
            {/* Journal input area */}
            {isJournalExercise && (
              <div className="mt-4">
                <textarea
                  value={journalText || ''}
                  onChange={(e) => onJournalChange?.(e.target.value)}
                  placeholder="Type your thoughts here…"
                  className="w-full min-h-[140px] resize-none rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                  }}
                />
                
                {/* Send to universe button - Premium glass chrome style */}
                {journalText?.trim().length > 0 && (
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={onSendToUniverse}
                      disabled={sentToUniverse}
                      className="relative px-8 py-3.5 rounded-2xl text-[14px] font-semibold text-white transition-all duration-500 overflow-hidden active:scale-[0.98] group backdrop-blur-xl"
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
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div 
        className="relative z-10 px-5"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        {/* Toggle controls row */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Voice toggle */}
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all ${
              voiceEnabled ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
            </svg>
            Voice
          </button>
          
          {/* Audio toggle */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] transition-all ${
              audioEnabled ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40'
            }`}
          >
            {audioEnabled ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            Sound
          </button>
        </div>

        {/* Seekable Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
            <span>{stepLabel}</span>
            <span>{formatTime(secondsLeft)}</span>
          </div>
          <div 
            className="relative h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group"
            onClick={(e) => {
              if (!onSeek) return
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const progress = Math.max(0, Math.min(1, x / rect.width))
              // Calculate max progress (leave 10 second buffer)
              const maxProgress = totalSeconds > 10 ? (totalSeconds - 10) / totalSeconds : 0.9
              const clampedProgress = Math.min(progress, maxProgress)
              onSeek(clampedProgress)
            }}
            onTouchStart={(e) => {
              if (!onSeek) return
              const rect = e.currentTarget.getBoundingClientRect()
              const touch = e.touches[0]
              const x = touch.clientX - rect.left
              const progress = Math.max(0, Math.min(1, x / rect.width))
              const maxProgress = totalSeconds > 10 ? (totalSeconds - 10) / totalSeconds : 0.9
              const clampedProgress = Math.min(progress, maxProgress)
              onSeek(clampedProgress)
            }}
          >
            {/* Progress fill */}
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalProgress * 100}%`,
                background: isBreathExercise 
                  ? `linear-gradient(90deg, ${orbColors.inner}, ${orbColors.outer})`
                  : `linear-gradient(90deg, ${accentColor}, #6366F1)`,
              }}
            />
            {/* Seek indicator on hover/touch */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ 
                left: `${totalProgress * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Buffer zone indicator (last 10 seconds grayed out) */}
            {totalSeconds > 10 && (
              <div 
                className="absolute right-0 top-0 h-full bg-white/5"
                style={{ width: `${(10 / totalSeconds) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-[9px] text-white/25 mt-1">
            <span>Tap to seek</span>
            <span>{formatTime(totalSeconds || 0)}</span>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center justify-center gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            disabled={!canGoBack}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
              canGoBack 
                ? 'bg-white/10 text-white/70 hover:bg-white/15' 
                : 'bg-white/5 text-white/20'
            }`}
          >
            Back
          </button>
          
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="px-4 py-2 rounded-xl text-[13px] font-medium bg-white/10 text-white/70 hover:bg-white/15 transition-all"
          >
            Skip
          </button>
          
          {/* Pause/Play button */}
          <button
            onClick={isPaused ? onResume : onPause}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: `1.5px solid ${isBreathExercise ? orbColors.outer : accentColor}`,
            }}
          >
            {isPaused ? (
              <svg className="w-5 h-5 ml-0.5" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
          
          {/* End button */}
          <button
            onClick={onEnd}
            className="px-4 py-2 rounded-xl text-[13px] font-medium bg-white/10 text-white/70 hover:bg-white/15 transition-all"
          >
            End
          </button>
        </div>
      </div>
    </div>
  )
}

function getDefaultPrompt(phase) {
  switch (phase) {
    case 'inhale':
      return 'Breathe in slowly through your nose'
    case 'hold':
      return 'Hold your breath gently'
    case 'exhale':
      return 'Release slowly through your mouth'
    case 'prepare':
      return 'Find a comfortable position and relax'
    case 'rest':
      return 'Rest and breathe naturally'
    default:
      return 'Follow the rhythm of the orb'
  }
}
