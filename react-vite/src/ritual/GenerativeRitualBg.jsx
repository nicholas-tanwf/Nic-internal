import { useMemo } from 'react'

/**
 * Emotion-reactive animated gradient background
 * Reflects user's emotional state with dynamic colors and flowing animations
 */
export function GenerativeRitualBg({ 
  variant = 'warm', 
  emotion = 'steady',  // 'stressed', 'anxious', 'calm', 'energized', 'sad', 'steady'
  intensity = 0.5,     // 0-1, affects animation speed and vibrancy
  className = '' 
}) {
  // Emotion-based color schemes
  const emotionSchemes = useMemo(() => ({
    stressed: {
      base: '#1a0808',
      primary: 'rgba(220,50,30,0.75)',
      secondary: 'rgba(255,100,40,0.6)',
      tertiary: 'rgba(180,30,20,0.5)',
      accent: 'rgba(255,140,60,0.4)',
      pulse: 'rgba(255,80,40,0.3)',
      speed: 1.3,
    },
    anxious: {
      base: '#120816',
      primary: 'rgba(140,40,180,0.7)',
      secondary: 'rgba(180,60,220,0.55)',
      tertiary: 'rgba(100,30,140,0.5)',
      accent: 'rgba(220,100,255,0.35)',
      pulse: 'rgba(160,60,200,0.25)',
      speed: 1.5,
    },
    calm: {
      base: '#041210',
      primary: 'rgba(40,140,120,0.65)',
      secondary: 'rgba(60,180,150,0.5)',
      tertiary: 'rgba(80,160,140,0.45)',
      accent: 'rgba(100,200,170,0.35)',
      pulse: 'rgba(70,170,150,0.2)',
      speed: 0.6,
    },
    energized: {
      base: '#141204',
      primary: 'rgba(255,180,40,0.7)',
      secondary: 'rgba(255,140,20,0.6)',
      tertiary: 'rgba(255,200,80,0.5)',
      accent: 'rgba(255,220,100,0.4)',
      pulse: 'rgba(255,190,60,0.25)',
      speed: 1.2,
    },
    sad: {
      base: '#080a14',
      primary: 'rgba(40,60,140,0.65)',
      secondary: 'rgba(60,80,160,0.5)',
      tertiary: 'rgba(80,100,180,0.45)',
      accent: 'rgba(100,120,200,0.35)',
      pulse: 'rgba(70,90,170,0.2)',
      speed: 0.5,
    },
    steady: {
      base: '#0c0a08',
      primary: 'rgba(200,100,40,0.65)',
      secondary: 'rgba(180,80,30,0.55)',
      tertiary: 'rgba(160,60,20,0.45)',
      accent: 'rgba(220,120,60,0.35)',
      pulse: 'rgba(190,90,40,0.2)',
      speed: 0.8,
    },
    // Ritual states
    downshift: {
      base: '#0a0610',
      primary: 'rgba(80,40,140,0.7)',
      secondary: 'rgba(60,80,160,0.55)',
      tertiary: 'rgba(100,60,180,0.5)',
      accent: 'rgba(140,100,220,0.4)',
      pulse: 'rgba(90,60,150,0.25)',
      speed: 0.5,
    },
    upshift: {
      base: '#140a04',
      primary: 'rgba(255,120,40,0.75)',
      secondary: 'rgba(255,160,60,0.6)',
      tertiary: 'rgba(255,100,30,0.5)',
      accent: 'rgba(255,200,100,0.4)',
      pulse: 'rgba(255,140,50,0.3)',
      speed: 1.1,
    },
    gentle: {
      base: '#080c0a',
      primary: 'rgba(80,160,120,0.65)',
      secondary: 'rgba(100,180,140,0.5)',
      tertiary: 'rgba(120,200,160,0.45)',
      accent: 'rgba(140,220,180,0.35)',
      pulse: 'rgba(110,190,150,0.2)',
      speed: 0.6,
    },
  }), [])

  const scheme = emotionSchemes[emotion] ?? emotionSchemes.steady
  // Much faster base speed for dynamic feel
  const baseSpeed = scheme.speed * (1.5 + intensity * 1.0)

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ backgroundColor: scheme.base }}
    >
      {/* Primary flowing blob - large, with color shift */}
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.primary,
          '--blob-color-2': scheme.accent,
          width: '140%',
          height: '140%',
          left: '10%',
          top: '-20%',
          filter: 'blur(80px)',
          animation: `morphBlob1 ${8 / baseSpeed}s ease-in-out infinite, colorShift1 ${6 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Secondary blob - with contrasting color shift */}
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.secondary,
          '--blob-color-2': scheme.primary,
          width: '100%',
          height: '100%',
          right: '-20%',
          bottom: '-10%',
          filter: 'blur(60px)',
          animation: `morphBlob2 ${6 / baseSpeed}s ease-in-out infinite, colorShift2 ${5 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Tertiary accent blob - complementary colors */}
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.tertiary,
          '--blob-color-2': scheme.pulse,
          width: '80%',
          height: '80%',
          left: '50%',
          top: '50%',
          filter: 'blur(50px)',
          animation: `morphBlob3 ${5 / baseSpeed}s ease-in-out infinite, colorShift3 ${4 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Floating accent orbs with rapid color cycling */}
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.accent,
          '--blob-color-2': scheme.secondary,
          width: '50%',
          height: '50%',
          left: '20%',
          top: '60%',
          filter: 'blur(40px)',
          animation: `floatOrb1 ${4 / baseSpeed}s ease-in-out infinite, colorShift1 ${3 / baseSpeed}s ease-in-out infinite`,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.pulse,
          '--blob-color-2': scheme.primary,
          width: '40%',
          height: '40%',
          right: '10%',
          top: '20%',
          filter: 'blur(35px)',
          animation: `floatOrb2 ${3.5 / baseSpeed}s ease-in-out infinite, colorShift2 ${2.5 / baseSpeed}s ease-in-out infinite`,
        }}
      />
      
      {/* Extra dynamic orb for more movement */}
      <div
        className="absolute rounded-full"
        style={{
          '--blob-color-1': scheme.secondary,
          '--blob-color-2': scheme.tertiary,
          width: '60%',
          height: '60%',
          left: '70%',
          top: '40%',
          filter: 'blur(45px)',
          animation: `floatOrb3 ${3 / baseSpeed}s ease-in-out infinite, colorShift3 ${2 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Breathing pulse effect - faster */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 100% 80% at 50% 50%, ${scheme.pulse} 0%, transparent 60%)`,
          animation: `breathePulse ${3 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Flowing gradient wave - faster with more contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, transparent 0%, ${scheme.primary.replace('0.', '0.25')} 25%, transparent 50%, ${scheme.secondary.replace('0.', '0.2')} 75%, transparent 100%)`,
          backgroundSize: '300% 300%',
          animation: `flowWave ${8 / baseSpeed}s ease-in-out infinite`,
        }}
      />

      {/* Shimmer highlight - faster */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(45deg, transparent 20%, rgba(255,255,255,0.12) 50%, transparent 80%)`,
          backgroundSize: '200% 200%',
          animation: `shimmer ${4 / baseSpeed}s ease-in-out infinite`,
        }}
      />
      
      {/* Secondary shimmer - opposite direction */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(-45deg, transparent 20%, rgba(255,200,100,0.1) 50%, transparent 80%)`,
          backgroundSize: '200% 200%',
          animation: `shimmer ${3 / baseSpeed}s ease-in-out infinite reverse`,
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 45%, transparent 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Keyframe animations */}
      <style>{`
        @keyframes morphBlob1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg); 
            opacity: 0.9;
          }
          25% { 
            transform: translate(8%, 15%) scale(1.2) rotate(10deg); 
            opacity: 1;
          }
          50% { 
            transform: translate(-8%, 8%) scale(0.9) rotate(-5deg); 
            opacity: 0.8;
          }
          75% { 
            transform: translate(12%, -8%) scale(1.15) rotate(5deg); 
            opacity: 0.95;
          }
        }
        
        @keyframes morphBlob2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg); 
            opacity: 0.85;
          }
          33% { 
            transform: translate(-15%, 12%) scale(1.25) rotate(-8deg); 
            opacity: 1;
          }
          66% { 
            transform: translate(10%, -10%) scale(0.85) rotate(5deg); 
            opacity: 0.75;
          }
        }
        
        @keyframes morphBlob3 {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1) rotate(0deg); 
          }
          33% { 
            transform: translate(-40%, -60%) scale(1.3) rotate(120deg); 
          }
          66% { 
            transform: translate(-60%, -45%) scale(0.8) rotate(240deg); 
          }
        }
        
        @keyframes floatOrb1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.7;
          }
          25% { 
            transform: translate(20%, -25%) scale(1.4); 
            opacity: 1;
          }
          50% { 
            transform: translate(-10%, -30%) scale(0.9); 
            opacity: 0.8;
          }
          75% { 
            transform: translate(15%, 10%) scale(1.2); 
            opacity: 0.9;
          }
        }
        
        @keyframes floatOrb2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.6;
          }
          33% { 
            transform: translate(-25%, 20%) scale(1.35); 
            opacity: 1;
          }
          66% { 
            transform: translate(15%, -15%) scale(0.85); 
            opacity: 0.7;
          }
        }
        
        @keyframes floatOrb3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.65;
          }
          50% { 
            transform: translate(-30%, 25%) scale(1.5); 
            opacity: 1;
          }
        }
        
        @keyframes colorShift1 {
          0%, 100% { 
            background: radial-gradient(circle, var(--blob-color-1) 0%, transparent 65%);
          }
          50% { 
            background: radial-gradient(circle, var(--blob-color-2) 0%, transparent 65%);
          }
        }
        
        @keyframes colorShift2 {
          0%, 100% { 
            background: radial-gradient(circle, var(--blob-color-1) 0%, transparent 60%);
          }
          33% { 
            background: radial-gradient(circle, var(--blob-color-2) 0%, transparent 60%);
          }
          66% { 
            background: radial-gradient(circle, color-mix(in srgb, var(--blob-color-1) 50%, var(--blob-color-2)) 0%, transparent 60%);
          }
        }
        
        @keyframes colorShift3 {
          0%, 100% { 
            background: radial-gradient(circle, var(--blob-color-1) 0%, transparent 55%);
          }
          25% { 
            background: radial-gradient(circle, var(--blob-color-2) 0%, transparent 55%);
          }
          50% { 
            background: radial-gradient(circle, var(--blob-color-1) 0%, transparent 55%);
          }
          75% { 
            background: radial-gradient(circle, var(--blob-color-2) 0%, transparent 55%);
          }
        }
        
        @keyframes breathePulse {
          0%, 100% { 
            transform: scale(0.85); 
            opacity: 0.3;
          }
          50% { 
            transform: scale(1.15); 
            opacity: 0.9;
          }
        }
        
        @keyframes flowWave {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
          0% { background-position: -100% -100%; opacity: 0.2; }
          25% { background-position: 0% 0%; opacity: 0.4; }
          50% { background-position: 100% 100%; opacity: 0.3; }
          75% { background-position: 0% 100%; opacity: 0.5; }
          100% { background-position: -100% -100%; opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
