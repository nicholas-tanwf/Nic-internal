import { useEffect, useRef } from 'react'

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hexToRgb = (hex) => {
  const h = String(hex).replace('#', '').trim()
  if (h.length !== 6) return [255, 255, 255]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function Backdrop({ variant = 'today' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduce = (() => {
      try {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
      } catch {
        return false
      }
    })()

    // Palette inspired by the references: dark + orange/green/yellow with chrome highlights.
    const palettes = {
      analysis: ['#29D38B', '#FF9408', '#DBE0E1', '#95122C'],
      reset: ['#FFD84A', '#FF9408', '#29D38B', '#DBE0E1'],
      personalise: ['#DBE0E1', '#FF9408', '#29D38B', '#F3F4F5'],
    }

    const colors = palettes[variant] ?? palettes.reset
    const rand = mulberry32(
      Array.from(variant).reduce((acc, c) => acc + c.charCodeAt(0), 0) + 1337,
    )

    const blobs = Array.from({ length: 6 }).map((_, i) => {
      const [r, g, b] = hexToRgb(colors[i % colors.length])
      return {
        baseX: rand(),
        baseY: rand(),
        radius: 0.18 + rand() * 0.22,
        drift: 0.18 + rand() * 0.28,
        speed: 0.25 + rand() * 0.5,
        rgb: [r, g, b],
        alpha: 0.12 + rand() * 0.16,
      }
    })

    let raf = 0
    let start = performance.now()

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = (t) => {
      const { width, height } = canvas.getBoundingClientRect()
      const time = (t - start) / 1000

      // Deep black base
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#100C08'
      ctx.fillRect(0, 0, width, height)

      // Soft “chrome” vignette + warmth
      const vignette = ctx.createRadialGradient(width * 0.5, height * 0.2, 0, width * 0.5, height * 0.2, Math.max(width, height))
      vignette.addColorStop(0, 'rgba(255,255,255,0.06)')
      vignette.addColorStop(0.55, 'rgba(255,148,8,0.06)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

      // “Body / movement” ghost form (abstract silhouette, inspired by refs)
      // Draw as layered blurred ellipses so it reads like a figure without being literal.
      const figureX = width * (0.68 + 0.02 * Math.sin(time * 0.35))
      const figureY = height * (0.48 + 0.03 * Math.cos(time * 0.28))
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.filter = 'blur(46px)'
      const fg = ctx.createRadialGradient(figureX, figureY, 0, figureX, figureY, Math.max(width, height) * 0.42)
      fg.addColorStop(0, 'rgba(255,148,8,0.10)')
      fg.addColorStop(0.35, 'rgba(41,211,139,0.07)')
      fg.addColorStop(0.7, 'rgba(255,216,74,0.05)')
      fg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.ellipse(figureX, figureY, width * 0.22, height * 0.34, Math.sin(time * 0.2) * 0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.filter = 'none'

      // Liquid blobs
      ctx.globalCompositeOperation = 'screen'
      for (const b of blobs) {
        const x = (b.baseX + Math.sin(time * b.speed + b.baseX * 10) * b.drift * 0.12) * width
        const y = (b.baseY + Math.cos(time * (b.speed * 0.9) + b.baseY * 10) * b.drift * 0.14) * height
        const rr = b.radius * Math.max(width, height) * (0.9 + 0.12 * Math.sin(time * (b.speed * 1.1)))

        const g = ctx.createRadialGradient(x, y, 0, x, y, rr)
        const [r, gg, bb] = b.rgb
        g.addColorStop(0, `rgba(${r},${gg},${bb},${b.alpha})`)
        g.addColorStop(0.55, `rgba(${r},${gg},${bb},${b.alpha * 0.35})`)
        g.addColorStop(1, `rgba(${r},${gg},${bb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, rr, 0, Math.PI * 2)
        ctx.fill()
      }

      // Grain overlay (subtle)
      ctx.globalCompositeOperation = 'overlay'
      const grainCount = Math.floor((width * height) / 4500)
      ctx.fillStyle = 'rgba(255,255,255,0.02)'
      for (let i = 0; i < grainCount; i++) {
        const gx = rand() * width
        const gy = rand() * height
        ctx.fillRect(gx, gy, 1, 1)
      }

      ctx.globalCompositeOperation = 'source-over'

      if (!prefersReduce) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  )
}

