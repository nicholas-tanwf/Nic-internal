import { useEffect, useMemo, useRef, useState } from 'react'

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

function hslToRgb(h, s, l) {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function rgbToHex([r, g, b]) {
  const to = (n) => n.toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

/**
 * MoodMapPicker
 * - 2D surface with crosshair
 * - Dragging moves an orb
 * - Color mapping behaves like a color wheel (angle -> hue, radius -> saturation)
 */
export function MoodMapPicker({ value, onChange, labels }) {
  const ref = useRef(null)
  const [p, setP] = useState({ x: 0.45, y: 0.45 }) // normalized 0..1

  const corner = labels ?? {
    tl: 'ANXIOUS',
    tr: 'ANGRY',
    bl: 'DEPRESSED',
    br: 'CONTENTED',
  }

  const pickAt = (clientX, clientY) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = clamp((clientX - r.left) / r.width, 0, 1)
    const y = clamp((clientY - r.top) / r.height, 0, 1)

    // Convert square coordinates into a wheel-like color:
    // hue from angle around center, saturation from distance.
    const cx = x - 0.5
    const cy = y - 0.5
    const ang = (Math.atan2(cy, cx) / (2 * Math.PI) + 1) % 1
    const dist = Math.sqrt(cx * cx + cy * cy) / 0.5
    const sat = clamp(dist, 0, 1)
    const light = 0.56
    const hex = rgbToHex(hslToRgb(ang, sat, light))

    setP({ x, y })
    onChange?.(hex, { x, y })
  }

  // If a value is provided initially, keep pointer stable (don't try to reverse-map).
  useEffect(() => {
    if (!value) return
  }, [value])

  // Separate transform (position) from color styles for optimal performance
  const orbTransform = `translate(${p.x * 100}%, ${p.y * 100}%)`
  
  const orbColorStyle = useMemo(() => {
    const c = value ?? '#FF9408'
    // Clean glass orb - translucent with soft glow
    return {
      background: `${c}cc`,
      boxShadow: [
        `0 0 24px ${c}50`,
        `0 4px 12px rgba(0,0,0,0.25)`,
        `inset 0 1px 2px rgba(255,255,255,0.25)`,
      ].join(', '),
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }
  }, [value])

  const bgStyle = useMemo(() => {
    // Transparent glass background
    return {
      background: 'rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }
  }, [])

  return (
    <div className="relative w-full">
      <div
        ref={ref}
        className="relative h-[58vh] w-full overflow-hidden rounded-[28px] touch-none border border-white/10"
        style={bgStyle}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
          pickAt(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return
          pickAt(e.clientX, e.clientY)
        }}
      >
        {/* Subtle glass reflection at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.03] to-transparent z-10" />
        {/* crosshair */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />
          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/5" />
        </div>

        {/* corner labels */}
        <div className="pointer-events-none absolute inset-0 z-20 p-5 text-[11px] font-semibold tracking-[0.15em] text-white/70">
          <div className="flex items-start justify-between">
            <div>{corner.tl}</div>
            <div>{corner.tr}</div>
          </div>
          <div className="absolute bottom-5 left-5">{corner.bl}</div>
          <div className="absolute bottom-5 right-5">{corner.br}</div>
        </div>

        {/* orb - glass with smooth movement */}
        <div
          className="pointer-events-none absolute h-10 w-10 rounded-full"
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            willChange: 'left, top',
            transition: 'left 0.08s ease-out, top 0.08s ease-out',
            ...orbColorStyle,
          }}
        />
      </div>
    </div>
  )
}

