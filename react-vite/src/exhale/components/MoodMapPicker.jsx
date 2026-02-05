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

  const orbStyle = useMemo(() => {
    const left = `${p.x * 100}%`
    const top = `${p.y * 100}%`
    const c = value ?? '#FF9408'
    return {
      left,
      top,
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), ${c} 42%, rgba(0,0,0,0) 72%)`,
      boxShadow: `0 30px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 45px ${c}55`,
    }
  }, [p, value])

  const bgStyle = useMemo(() => {
    const c = value ?? '#FF9408'
    // Soft foggy blur behind, inspired by the slide.
    return {
      background: [
        `radial-gradient(600px circle at ${p.x * 100}% ${p.y * 100}%, ${c}66, transparent 55%)`,
        `radial-gradient(900px circle at 55% 30%, rgba(255,255,255,0.06), transparent 55%)`,
        `linear-gradient(180deg, rgba(16,12,8,0.15), rgba(16,12,8,0.82))`,
      ].join(', '),
    }
  }, [p, value])

  return (
    <div className="relative w-full">
      <div
        ref={ref}
        className="relative h-[62vh] w-full overflow-hidden rounded-[34px] border border-white/10 bg-black/35 backdrop-blur-2xl"
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
        {/* crosshair */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
          <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/10" />
        </div>

        {/* corner labels */}
        <div className="pointer-events-none absolute inset-0 p-4 text-[12px] font-semibold tracking-widest text-white/55">
          <div className="flex items-start justify-between">
            <div>{corner.tl}</div>
            <div>{corner.tr}</div>
          </div>
          <div className="absolute bottom-4 left-4">{corner.bl}</div>
          <div className="absolute bottom-4 right-4">{corner.br}</div>
        </div>

        {/* orb */}
        <div
          className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={orbStyle}
        />
      </div>
    </div>
  )
}

