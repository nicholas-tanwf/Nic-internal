import { useEffect, useMemo, useRef, useState } from 'react'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function hslToRgb(h, s, l) {
  // h: 0..1, s: 0..1, l: 0..1
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

export function ColorWheelPicker({ value, onChange }) {
  const canvasRef = useRef(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  const size = 240
  const radius = size / 2
  const lightness = 0.55

  const hex = value ?? '#FF9408'

  const drawWheel = (ctx) => {
    const img = ctx.createImageData(size, size)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius
        const dy = y - radius
        const d = Math.sqrt(dx * dx + dy * dy)
        const idx = (y * size + x) * 4
        if (d > radius) {
          img.data[idx + 3] = 0
          continue
        }
        const sat = clamp(d / radius, 0, 1)
        const hue = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1
        const [r, g, b] = hslToRgb(hue, sat, lightness)
        img.data[idx + 0] = r
        img.data[idx + 1] = g
        img.data[idx + 2] = b
        img.data[idx + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawWheel(ctx)
  }, [])

  const valueAt = (clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = clamp(clientX - rect.left, 0, rect.width)
    const y = clamp(clientY - rect.top, 0, rect.height)
    const dx = x - rect.width / 2
    const dy = y - rect.height / 2
    const d = Math.sqrt(dx * dx + dy * dy)
    const rr = rect.width / 2
    if (d > rr) {
      // snap to edge
      const s = rr / d
      const sx = rect.width / 2 + dx * s
      const sy = rect.height / 2 + dy * s
      return valueAt(rect.left + sx, rect.top + sy)
    }
    const sat = clamp(d / rr, 0, 1)
    const hue = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1
    const rgb = hslToRgb(hue, sat, lightness)
    return { hex: rgbToHex(rgb), x, y }
  }

  const onPick = (clientX, clientY) => {
    const v = valueAt(clientX, clientY)
    if (!v) return
    setPointer({ x: v.x, y: v.y })
    onChange?.(v.hex)
  }

  useEffect(() => {
    // initialize pointer near center to avoid looking broken
    setPointer({ x: radius, y: radius })
  }, [])

  const ringStyle = useMemo(
    () => ({
      left: `${pointer.x}px`,
      top: `${pointer.y}px`,
      borderColor: '#ffffffcc',
      boxShadow: '0 10px 35px rgba(0,0,0,0.55)',
    }),
    [pointer],
  )

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId)
            onPick(e.clientX, e.clientY)
          }}
          onPointerMove={(e) => {
            if (e.buttons !== 1) return
            onPick(e.clientX, e.clientY)
          }}
        />

        <div
          className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={ringStyle}
        />
        <div
          className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[12px] font-semibold text-white/80 backdrop-blur"
          style={{ color: hex }}
        >
          {hex.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

