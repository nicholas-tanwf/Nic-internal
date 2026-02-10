import { useMemo, useState } from 'react'
import { Tile } from './components/Tile.jsx'
import { getTransition, prefersReducedMotion } from '../lib/motion.js'

function pickCopy(value, locale) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value?.[locale] ?? value?.en ?? ''
  return String(value)
}

function initialsFromOrg(org) {
  const raw = String(org ?? '').trim()
  if (!raw) return '•'
  const words = raw.split(/\s+/).slice(0, 2)
  return words.map((w) => w[0]?.toUpperCase()).filter(Boolean).join('')
}

function resolvePublicUrl(path) {
  const raw = String(path ?? '')
  if (!raw) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (!raw.startsWith('/')) return raw
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? `${base}${raw.slice(1)}` : `${base}${raw}`
}

export function SlideRenderer({
  slides,
  activeSectionId,
  activeSlideId,
  locale = 'en',
}) {
  const slide = useMemo(() => {
    if (activeSlideId) {
      const byId = slides.find((s) => s.id === activeSlideId)
      if (byId) return byId
    }
    const firstInSection = slides.find((s) => s.sectionId === activeSectionId)
    return firstInSection ?? slides[0]
  }, [activeSectionId, activeSlideId, slides])

  const transition = getTransition({ durationMs: 200 })
  const reduceMotion = prefersReducedMotion()

  if (!slide) return null

  const tiles = Array.isArray(slide.tiles) ? slide.tiles : []
  const bulletTiles = tiles.filter((t) => t?.kind !== 'image' && t?.kind !== 'video')
  const mediaTiles = tiles.filter((t) => t?.kind === 'image' || t?.kind === 'video')

  // IMPORTANT: keep hooks unconditional (Pages navigation relies on stable hook order)
  const hero = slide?.heroImage
  const heroSrc = useMemo(() => resolvePublicUrl(hero?.src), [hero?.src])

  function CompanyLogo({ company }) {
    const [logoOk, setLogoOk] = useState(true)
    const logoSlug = company?.logoSlug
    const name = String(company?.name ?? '')
    const showName = !logoSlug || !logoOk

    return (
      <div
        className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_14px_46px_rgba(0,0,0,0.42)] transition will-change-transform hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 active:scale-[0.99]"
        aria-label={name}
        title={name}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(520px circle at 25% 20%, rgba(249,115,22,0.18), transparent 55%), radial-gradient(520px circle at 80% 10%, rgba(34,211,238,0.18), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-white/5">
            {logoSlug && logoOk ? (
              <img
                src={`https://cdn.simpleicons.org/${logoSlug}/ffffff`}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-7 w-7 opacity-95"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400/25 via-cyan-300/15 to-emerald-500/20 text-xs font-extrabold text-white/85">
                {initialsFromOrg(name)}
              </div>
            )}
          </div>
          {showName ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white/85">
                {name}
              </div>
            </div>
          ) : (
            <span className="sr-only">{name}</span>
          )}
        </div>
      </div>
    )
  }

  if (slide.layout === 'title') {
    const companies = Array.isArray(slide.companies) ? slide.companies : []

    return (
      <section
        className="relative min-h-[calc(100dvh-12rem)] overflow-hidden rounded-3xl border border-white/12 bg-white/5 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-md md:p-6"
        style={{
          transition,
          willChange: reduceMotion ? undefined : 'opacity, transform',
        }}
        aria-label={pickCopy(slide.title, locale)}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(900px circle at 18% 10%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(900px circle at 82% 12%, rgba(34,197,94,0.16), transparent 62%), radial-gradient(820px circle at 14% 92%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(1000px circle at 88% 70%, rgba(249,115,22,0.12), transparent 62%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)',
          }}
        />

        <header className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-semibold tracking-wide text-white/75">
            {locale === 'zh' ? '团队简报' : 'Team brief'}
          </div>
          <div key={`${slide.id}-${locale}`} className={reduceMotion ? '' : 'deck-fade-in'}>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
              {pickCopy(slide.title, locale)}
            </h1>
            {slide.subtitle ? (
              <p className="mt-2 max-w-[70ch] text-base leading-normal text-white/70 md:text-lg">
                {pickCopy(slide.subtitle, locale)}
              </p>
            ) : null}
          </div>
        </header>

        <div className="relative mt-5 grid gap-5">
          <div className="rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="text-xs font-semibold tracking-wide text-white/60">
              {locale === 'zh' ? '现场照片' : 'Event photo'}
            </div>
            <div className="mt-3">
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt={pickCopy(hero?.alt, locale) || ''}
                  loading="lazy"
                  decoding="async"
                  className="h-[28vh] w-full rounded-xl border border-white/10 object-cover md:h-[34vh]"
                />
              ) : (
                <div className="h-[28vh] w-full rounded-xl border border-white/10 bg-white/5 md:h-[34vh]" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold tracking-wide text-white/60">
                {locale === 'zh' ? 'Who’s in the Room' : 'Who’s in the Room'}
              </div>
              <div className="text-xs font-semibold tabular-nums text-white/55">
                {companies.length} {locale === 'zh' ? '家机构' : 'companies'}
              </div>
            </div>

            <div className="mt-3 grid max-h-[34vh] gap-3 overflow-auto pr-1 sm:grid-cols-2 md:max-h-[30vh] md:grid-cols-3">
              {companies.map((c, idx) => (
                <CompanyLogo key={`${c.name ?? 'company'}-${idx}`} company={c} />
              ))}
            </div>

            <div className="mt-3 text-sm text-white/65">
              {locale === 'zh'
                ? '下方导航可切换 4 页要点；视频为“点击后加载”。'
                : 'Use the bottom nav to flip through 4 slides; videos load on click.'}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="relative min-h-[calc(100dvh-12rem)] overflow-hidden rounded-3xl border border-white/12 bg-white/5 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-md md:p-6"
      style={{
        transition,
        willChange: reduceMotion ? undefined : 'opacity, transform',
      }}
      aria-label={pickCopy(slide.title, locale)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(900px circle at 18% 10%, rgba(34,211,238,0.24), transparent 60%), radial-gradient(900px circle at 82% 12%, rgba(34,197,94,0.18), transparent 62%), radial-gradient(900px circle at 55% 88%, rgba(45,212,191,0.16), transparent 60%), radial-gradient(900px circle at 14% 92%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(1000px circle at 92% 75%, rgba(249,115,22,0.12), transparent 62%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      />

      <header className="relative mb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-xs font-semibold tracking-wide text-white/75">
          {locale === 'zh' ? '我的收获' : 'What I gained'}
        </div>
        <div key={`${slide.id}-${locale}`} className={reduceMotion ? '' : 'deck-fade-in'}>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            {pickCopy(slide.title, locale)}
          </h1>
        {slide.subtitle ? (
            <p className="mt-2 max-w-[65ch] text-base leading-normal text-white/70 md:text-lg">
              {pickCopy(slide.subtitle, locale)}
            </p>
        ) : null}
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-12 md:items-start">
        <div className="md:col-span-7">
          <div className="rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="text-xs font-semibold tracking-wide text-white/60">
              {locale === 'zh' ? '关键要点' : 'Key takeaways'}
            </div>
            <ol className="mt-3 space-y-3">
              {bulletTiles.map((t, idx) => {
                const title = pickCopy(t?.title, locale)
                const body = pickCopy(t?.body, locale)
                const value = t?.kind === 'metric' ? String(t?.value ?? '') : ''

                return (
                  <li
                    key={t.id ?? String(idx)}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 text-xs font-bold text-black/90 shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_10px_30px_rgba(0,0,0,0.35)]">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      {title ? (
                        <div className="text-sm font-bold text-white">
                          {title}
                        </div>
                      ) : null}
                      {value ? (
                        <div className="mt-1 inline-flex items-baseline gap-2 rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-white">
                          <span className="text-xs font-semibold text-white/60">
                            {locale === 'zh' ? '信号' : 'Signal'}
                          </span>
                          <span className="text-lg font-extrabold tracking-tight">
                            {value}
                          </span>
                        </div>
                      ) : null}
                      {body ? (
                        <div className="mt-1 text-base leading-normal text-white/75">
                          {body}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="text-xs font-semibold tracking-wide text-white/60">
              {locale === 'zh' ? '现场 / 参考' : 'Visuals / references'}
            </div>
            <div className="mt-3 space-y-4">
              {mediaTiles.map((t) => (
                <Tile key={t.id} tile={t} locale={locale} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

