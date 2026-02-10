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

    const rand = mulberry32(
      Array.from(variant).reduce((acc, c) => acc + c.charCodeAt(0), 0) + 1337,
    )

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

      // Very dark base
      ctx.fillStyle = '#050508'
      ctx.fillRect(0, 0, width, height)

      // === FLOWING BLUE CURVE - Top Left ===
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const curve1X = width * (0.15 + Math.sin(time * 0.15) * 0.08)
      const curve1Y = height * (0.25 + Math.cos(time * 0.12) * 0.05)
      const grad1 = ctx.createRadialGradient(curve1X, curve1Y, 0, curve1X, curve1Y, width * 0.55)
      grad1.addColorStop(0, 'rgba(70,130,180,0.45)')
      grad1.addColorStop(0.2, 'rgba(50,100,150,0.3)')
      grad1.addColorStop(0.5, 'rgba(30,70,120,0.15)')
      grad1.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad1
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === FLOWING BLUE CURVE - Bottom Right ===
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const curve2X = width * (0.85 + Math.cos(time * 0.1) * 0.06)
      const curve2Y = height * (0.7 + Math.sin(time * 0.14) * 0.04)
      const grad2 = ctx.createRadialGradient(curve2X, curve2Y, 0, curve2X, curve2Y, width * 0.5)
      grad2.addColorStop(0, 'rgba(60,120,170,0.4)')
      grad2.addColorStop(0.25, 'rgba(45,95,145,0.25)')
      grad2.addColorStop(0.55, 'rgba(25,60,100,0.12)')
      grad2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad2
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === WHITE HIGHLIGHT SWIRL - Edge accent ===
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const whiteX = width * (0.2 + Math.sin(time * 0.18) * 0.1)
      const whiteY = height * (0.35 + Math.cos(time * 0.15) * 0.08)
      const whiteGrad = ctx.createRadialGradient(whiteX, whiteY, 0, whiteX, whiteY, width * 0.25)
      whiteGrad.addColorStop(0, 'rgba(200,220,240,0.35)')
      whiteGrad.addColorStop(0.3, 'rgba(150,180,210,0.18)')
      whiteGrad.addColorStop(0.6, 'rgba(100,140,180,0.08)')
      whiteGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = whiteGrad
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === SECOND WHITE HIGHLIGHT ===
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const white2X = width * (0.75 + Math.cos(time * 0.12) * 0.08)
      const white2Y = height * (0.55 + Math.sin(time * 0.16) * 0.06)
      const whiteGrad2 = ctx.createRadialGradient(white2X, white2Y, 0, white2X, white2Y, width * 0.2)
      whiteGrad2.addColorStop(0, 'rgba(180,200,220,0.25)')
      whiteGrad2.addColorStop(0.4, 'rgba(130,160,190,0.12)')
      whiteGrad2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = whiteGrad2
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === BURNT ORANGE ACCENT - Bottom ===
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const orangeX = width * (0.6 + Math.sin(time * 0.08) * 0.1)
      const orangeY = height * (0.9 + Math.cos(time * 0.1) * 0.05)
      const orangeGrad = ctx.createRadialGradient(orangeX, orangeY, 0, orangeX, orangeY, width * 0.4)
      orangeGrad.addColorStop(0, 'rgba(200,100,50,0.2)')
      orangeGrad.addColorStop(0.3, 'rgba(180,80,40,0.12)')
      orangeGrad.addColorStop(0.6, 'rgba(150,60,30,0.05)')
      orangeGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = orangeGrad
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === SECOND ORANGE ACCENT - Top Right ===
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const orange2X = width * (0.9 + Math.cos(time * 0.11) * 0.05)
      const orange2Y = height * (0.15 + Math.sin(time * 0.09) * 0.04)
      const orangeGrad2 = ctx.createRadialGradient(orange2X, orange2Y, 0, orange2X, orange2Y, width * 0.25)
      orangeGrad2.addColorStop(0, 'rgba(220,120,60,0.15)')
      orangeGrad2.addColorStop(0.4, 'rgba(180,90,45,0.08)')
      orangeGrad2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = orangeGrad2
      ctx.fillRect(0, 0, width, height)
      ctx.restore()

      // === FINE STATIC GRAIN (like film noise) ===
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      const grainDensity = Math.floor((width * height) / 25) // Much denser
      for (let i = 0; i < grainDensity; i++) {
        const gx = rand() * width
        const gy = rand() * height
        const brightness = rand() * 0.12 // More visible
        ctx.fillStyle = `rgba(255,255,255,${brightness})`
        ctx.fillRect(gx, gy, 1, 1)
      }
      ctx.restore()

      // === Subtle vignette ===
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 0,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.8
      )
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(0.65, 'rgba(0,0,0,0.1)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.45)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, width, height)

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
