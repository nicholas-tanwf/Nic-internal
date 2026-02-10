import { useEffect, useState } from 'react'

function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

export function IntroSplash({ onDone }) {
  const [phase, setPhase] = useState('intro')

  useEffect(() => {
    if (prefersReducedMotion()) {
      onDone?.()
      return
    }
    const exitTimer = window.setTimeout(() => {
      setPhase('exit')
    }, 4800)
    
    const doneTimer = window.setTimeout(() => {
      onDone?.()
    }, 5400)
    
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: '#0a0612' }}
      role="dialog"
      aria-label="RiteSet intro"
      onClick={() => onDone?.()}
    >
      {/* Main background image - curves only, no text */}
      <div 
        className="absolute inset-0 animate-[bgZoomFlow_5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        style={{
          backgroundImage: `url('/assets/riteset-splash-bg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Subtle movement overlay - left side */}
      <div 
        className="absolute inset-0 animate-[curveLeft_5s_ease-in-out_infinite] opacity-20"
        style={{
          backgroundImage: `url('/assets/riteset-splash-bg.png')`,
          backgroundSize: '110% 110%',
          backgroundPosition: 'center',
          mixBlendMode: 'screen',
          transformOrigin: 'left center',
        }}
      />
      
      {/* Subtle movement overlay - right side */}
      <div 
        className="absolute inset-0 animate-[curveRight_5s_ease-in-out_infinite_0.5s] opacity-20"
        style={{
          backgroundImage: `url('/assets/riteset-splash-bg.png')`,
          backgroundSize: '110% 110%',
          backgroundPosition: 'center',
          mixBlendMode: 'screen',
          transformOrigin: 'right center',
        }}
      />
      

      {/* "riteset" text with diamond - matching miracle font style */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: '8vh' }}>
        {/* Logo container - centered with diamond positioned absolutely */}
        <div 
          className="relative animate-[textGrow_5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        >
          <span 
            className="text-white font-medium lowercase"
            style={{
              fontSize: '52px',
              fontFamily: '"SF Pro Rounded", "Nunito", "Quicksand", -apple-system, system-ui, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            riteset
          </span>
          {/* Diamond sparkle icon - positioned absolutely to not affect centering */}
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="white"
            className="absolute -right-6 -top-1"
          >
            {/* Main 4-point star */}
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
            {/* Small accent star */}
            <path d="M19 2 L19.5 4 L21.5 4.5 L19.5 5 L19 7 L18.5 5 L16.5 4.5 L18.5 4 Z" opacity="0.7" transform="scale(0.5) translate(24, -2)" />
          </svg>
        </div>
        
        {/* Tagline in glass style - narrower */}
        <div 
          className="mt-4 px-3 py-1 rounded-full animate-[fadeInUp_1.5s_ease-out_0.8s_forwards] opacity-0"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
          }}
        >
          <span 
            className="font-medium"
            style={{
              fontSize: '11px',
              fontFamily: '"Nunito", -apple-system, system-ui, sans-serif',
              letterSpacing: '0.03em',
              color: '#1a1a2e',
            }}
          >
            Your Hyperpersonalised Wellness Ritual
          </span>
        </div>
      </div>

      {/* Film grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.05] pointer-events-none animate-[grain_0.8s_steps(10)_infinite]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Tap to skip */}
      <div className="absolute bottom-10 left-0 right-0 text-center z-10">
        <div className="text-[11px] font-medium text-white/40 tracking-wide animate-[fadeIn_1s_ease-out_0.5s_forwards] opacity-0">
          Tap to skip
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes bgZoomFlow {
          0% { 
            transform: scale(1);
          }
          100% { 
            transform: scale(1);
          }
        }
        
        @keyframes textGrow {
          0% { 
            transform: scale(0.45);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes curveLeft {
          0%, 100% { 
            transform: translateX(0) scaleX(1);
          }
          50% { 
            transform: translateX(10px) scaleX(1.02);
          }
        }
        
        @keyframes curveRight {
          0%, 100% { 
            transform: translateX(0) scaleX(1);
          }
          50% { 
            transform: translateX(-10px) scaleX(1.02);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.7;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.12);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-0.5%, 0.5%); }
          40% { transform: translate(0.5%, -0.5%); }
          50% { transform: translate(-1%, 1%); }
          60% { transform: translate(1%, -1%); }
          70% { transform: translate(0, 1%); }
          80% { transform: translate(-1%, 0); }
          90% { transform: translate(1%, 0.5%); }
        }
      `}</style>
    </div>
  )
}
