import { useMemo } from 'react'

/**
 * Standard breathing patterns with proper counts
 * - Box breath (upshift): 4-4-4-4 (16s cycle)
 * - Soft/Gentle: 4 in, 6 out (10s cycle)  
 * - Downshift/Calming: 4 in, 8 out (12s cycle)
 */

// Breath cycle durations in seconds
export const BREATH_CYCLES = {
  upshift: 16,   // Box breath: 4+4+4+4
  gentle: 10,    // Soft breath: 4+6
  downshift: 12, // Extended exhale: 4+8
}

/**
 * Get the cycle duration for a given breath state
 */
export function getBreathCycleDuration(state) {
  return BREATH_CYCLES[state] ?? BREATH_CYCLES.downshift
}

/**
 * Calculate aligned duration that ends on a complete breath cycle.
 * Returns the largest duration <= targetSeconds that completes on a full cycle.
 * Also ensures at least 2 complete cycles minimum.
 * 
 * @param {string} state - 'upshift', 'gentle', or 'downshift'
 * @param {number} targetSeconds - desired duration in seconds
 * @returns {{ alignedSeconds: number, cycles: number, cycleTime: number }}
 */
export function getAlignedBreathDuration(state, targetSeconds) {
  const cycleTime = getBreathCycleDuration(state)
  const fullCycles = Math.floor(targetSeconds / cycleTime)
  const cycles = Math.max(2, fullCycles) // Minimum 2 cycles
  const alignedSeconds = cycles * cycleTime
  
  return { alignedSeconds, cycles, cycleTime }
}

/**
 * Check if we're in the final cycle (for graceful ending)
 */
export function isInFinalCycle(state, elapsedSeconds, totalSeconds) {
  const cycleTime = getBreathCycleDuration(state)
  const timeRemaining = totalSeconds - elapsedSeconds
  return timeRemaining <= cycleTime
}

/**
 * Check if we've completed a full cycle at the current elapsed time
 */
export function isAtCycleEnd(state, elapsedSeconds) {
  const cycleTime = getBreathCycleDuration(state)
  const cyclePos = elapsedSeconds % cycleTime
  // Consider it at cycle end if within 0.5 seconds of completion
  return cyclePos < 0.5 || (cycleTime - cyclePos) < 0.5
}

export function phaseForBreath(state, elapsedSeconds) {
  // Use elapsed time (not seconds left) for consistent forward counting
  
  if (state === 'upshift') {
    // Box breath: 4-4-4-4 (total 16s per cycle)
    const cyclePos = elapsedSeconds % 16
    if (cyclePos < 4) {
      const count = 4 - Math.floor(cyclePos)
      return { kind: 'inhale', count, total: 4, text: 'Inhale', label: 'Box breath', progress: cyclePos / 4 }
    }
    if (cyclePos < 8) {
      const count = 4 - Math.floor(cyclePos - 4)
      return { kind: 'hold', count, total: 4, text: 'Hold', label: 'Box breath', progress: (cyclePos - 4) / 4 }
    }
    if (cyclePos < 12) {
      const count = 4 - Math.floor(cyclePos - 8)
      return { kind: 'exhale', count, total: 4, text: 'Exhale', label: 'Box breath', progress: (cyclePos - 8) / 4 }
    }
    const count = 4 - Math.floor(cyclePos - 12)
    return { kind: 'hold', count, total: 4, text: 'Hold', label: 'Box breath', progress: (cyclePos - 12) / 4 }
  }
  
  if (state === 'gentle') {
    // Gentle: 4 in, 6 out (total 10s per cycle)
    const cyclePos = elapsedSeconds % 10
    if (cyclePos < 4) {
      const count = 4 - Math.floor(cyclePos)
      return { kind: 'inhale', count, total: 4, text: 'Inhale', label: 'Soft breath', progress: cyclePos / 4 }
    }
    const count = 6 - Math.floor(cyclePos - 4)
    return { kind: 'exhale', count, total: 6, text: 'Exhale', label: 'Soft breath', progress: (cyclePos - 4) / 6 }
  }
  
  // Downshift: 4 in, 8 out (total 12s per cycle) - calming extended exhale
  const cyclePos = elapsedSeconds % 12
  if (cyclePos < 4) {
    const count = 4 - Math.floor(cyclePos)
    return { kind: 'inhale', count, total: 4, text: 'Inhale', label: 'Downshift', progress: cyclePos / 4 }
  }
  const count = 8 - Math.floor(cyclePos - 4)
  return { kind: 'exhale', count, total: 8, text: 'Exhale', label: 'Downshift', progress: (cyclePos - 4) / 8 }
}

// Color schemes for each phase
const phaseSchemes = {
  inhale: {
    primary: '#29D38B',
    secondary: '#4FFFB0',
    tertiary: '#00B368',
    glow: 'rgba(41, 211, 139, 0.4)',
  },
  exhale: {
    primary: '#FF9408',
    secondary: '#FFB347',
    tertiary: '#E67600',
    glow: 'rgba(255, 148, 8, 0.4)',
  },
  hold: {
    primary: '#FFD84A',
    secondary: '#FFE880',
    tertiary: '#E6C200',
    glow: 'rgba(255, 216, 74, 0.4)',
  },
}

// Linear interpolation between two hex colors
function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16)
  const c2 = parseInt(color2.slice(1), 16)
  
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255
  
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Get next phase kind for color blending
function getNextPhaseKind(currentKind) {
  if (currentKind === 'inhale') return 'exhale' // or 'hold' for box
  if (currentKind === 'exhale') return 'inhale'
  if (currentKind === 'hold') return 'exhale' // after hold comes exhale in box
  return 'inhale'
}

export function BreathVisual({ phase, beatKey = 0, isFinalCycle = false }) {
  const currentScheme = phaseSchemes[phase?.kind] ?? phaseSchemes.inhale
  const nextScheme = phaseSchemes[getNextPhaseKind(phase?.kind)] ?? phaseSchemes.exhale
  
  // Calculate blend factor - start blending on last 1 second (when count <= 1)
  const blendFactor = useMemo(() => {
    if (!phase?.count || phase.count > 1) return 0
    // Blend during the last second (progress from 0 to 1 as we approach transition)
    return phase.progress ?? 0
  }, [phase?.count, phase?.progress])
  
  // Blend colors for smooth transition
  const scheme = useMemo(() => {
    if (blendFactor <= 0) return currentScheme
    return {
      primary: lerpColor(currentScheme.primary, nextScheme.primary, blendFactor * 0.5),
      secondary: lerpColor(currentScheme.secondary, nextScheme.secondary, blendFactor * 0.5),
      tertiary: lerpColor(currentScheme.tertiary, nextScheme.tertiary, blendFactor * 0.5),
      glow: currentScheme.glow, // Keep glow stable
    }
  }, [currentScheme, nextScheme, blendFactor])

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative h-[260px] w-[260px]">
        
        {/* Outer ambient glow */}
        <div
          className="absolute inset-[-40px] rounded-full animate-[breathGlow_4s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${scheme.glow}, transparent 60%)`,
            filter: 'blur(30px)',
            transition: 'background 0.5s ease-out',
          }}
        />
        
        {/* Secondary ambient pulse */}
        <div
          className="absolute inset-[-20px] rounded-full animate-[breathGlow_3s_ease-in-out_infinite_0.5s]"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${scheme.primary}30, transparent 55%)`,
            filter: 'blur(20px)',
            transition: 'background 0.5s ease-out',
          }}
        />

        {/* Main orb container - CONSTANT SIZE, no scaling */}
        <div className="absolute inset-4">
          {/* Base orb layer */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-700 ease-out"
            style={{
              background: `
                radial-gradient(circle at 30% 25%, ${scheme.secondary}90 0%, transparent 50%),
                radial-gradient(circle at 70% 75%, ${scheme.tertiary}70 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, ${scheme.primary} 0%, ${scheme.tertiary} 100%)
              `,
            }}
          />

          {/* Morphing blob layer 1 */}
          <div
            className="absolute inset-2 rounded-full animate-[morphBlob_8s_ease-in-out_infinite] opacity-60"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 35% 40%, ${scheme.secondary} 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />

          {/* Morphing blob layer 2 */}
          <div
            className="absolute inset-4 rounded-full animate-[morphBlob_10s_ease-in-out_infinite_reverse] opacity-50"
            style={{
              background: `radial-gradient(ellipse 70% 90% at 65% 55%, ${scheme.primary} 0%, transparent 65%)`,
              filter: 'blur(6px)',
            }}
          />

          {/* Floating highlight orbs */}
          <div
            className="absolute h-16 w-16 rounded-full animate-[floatOrb_6s_ease-in-out_infinite]"
            style={{
              top: '15%',
              left: '20%',
              background: `radial-gradient(circle, ${scheme.secondary}80 0%, transparent 70%)`,
              filter: 'blur(10px)',
            }}
          />
          <div
            className="absolute h-12 w-12 rounded-full animate-[floatOrb_8s_ease-in-out_infinite_reverse]"
            style={{
              bottom: '20%',
              right: '15%',
              background: `radial-gradient(circle, ${scheme.tertiary}70 0%, transparent 70%)`,
              filter: 'blur(8px)',
            }}
          />

          {/* Glass highlight */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse 100% 50% at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 60%),
                radial-gradient(ellipse 80% 30% at 50% 100%, rgba(0,0,0,0.2) 0%, transparent 50%)
              `,
            }}
          />

          {/* Inner glow ring */}
          <div
            className="absolute inset-1 rounded-full animate-[pulseRing_2s_ease-in-out_infinite]"
            style={{
              boxShadow: `
                inset 0 0 40px ${scheme.primary}40,
                inset 0 0 80px ${scheme.glow},
                0 0 30px ${scheme.glow}
              `,
            }}
          />

          {/* Chrome rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `
                inset 0 1px 2px rgba(255,255,255,0.4),
                inset 0 -1px 2px rgba(0,0,0,0.2),
                0 0 60px ${scheme.glow}
              `,
            }}
          />

          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
          >
            <div
              className="absolute inset-0 animate-[shimmerSweep_4s_ease-in-out_infinite]"
              style={{
                background: `linear-gradient(
                  115deg,
                  transparent 0%,
                  transparent 40%,
                  rgba(255,255,255,0.15) 45%,
                  rgba(255,255,255,0.25) 50%,
                  rgba(255,255,255,0.15) 55%,
                  transparent 60%,
                  transparent 100%
                )`,
                transform: 'translateX(-100%)',
              }}
            />
          </div>
        </div>

        {/* Text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
          {phase?.isWaiting ? (
            // Waiting state - calm pulsing without countdown
            <>
              <div className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/50 animate-pulse">
                PREPARING
              </div>
              <div className="pt-3 text-[20px] font-semibold text-white/70 animate-pulse">
                Find your breath
              </div>
              <div className="pt-2 text-[11px] text-white/40 font-medium tracking-wide">
                Starting soon...
              </div>
            </>
          ) : (
            // Active breathing - show countdown
            <>
              <div 
                className="text-[11px] font-semibold tracking-[0.25em] uppercase transition-colors duration-500"
                style={{ color: scheme.secondary }}
              >
                {phase?.label ?? 'BREATHE'}
              </div>
              
              {/* Phase instruction */}
              <div className="pt-1 text-[20px] font-semibold text-white/90 drop-shadow-lg">
                {phase?.text ?? 'Breathe'}
              </div>
              
              {/* Large numeric countdown */}
              <div 
                className="text-[56px] font-bold text-white drop-shadow-lg leading-none transition-all duration-200"
                style={{ 
                  textShadow: `0 0 30px ${scheme.primary}80`,
                }}
              >
                {phase?.count ?? ''}
              </div>
              
              <div className={`pt-1 text-[11px] font-medium tracking-wide ${isFinalCycle ? 'text-amber-300/80' : 'text-white/50'}`}>
                {isFinalCycle ? 'Final cycle' : 'Follow the rhythm'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes breathGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        
        @keyframes morphBlob {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          25% { 
            transform: translate(5%, -5%) rotate(90deg) scale(1.05);
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
          50% { 
            transform: translate(-5%, 5%) rotate(180deg) scale(0.95);
            border-radius: 40% 60% 30% 70% / 40% 50% 60% 50%;
          }
          75% { 
            transform: translate(3%, 3%) rotate(270deg) scale(1.02);
            border-radius: 60% 30% 60% 40% / 70% 40% 50% 60%;
          }
        }
        
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(10%, -15%) scale(1.1); opacity: 0.8; }
          66% { transform: translate(-5%, 10%) scale(0.9); opacity: 0.5; }
        }
        
        @keyframes pulseRing {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%) rotate(-10deg); }
          100% { transform: translateX(200%) rotate(-10deg); }
        }
      `}</style>
    </div>
  )
}
