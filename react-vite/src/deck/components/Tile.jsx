import { useMemo, useState } from 'react'
import { Keyword } from './Keyword.jsx'
import { SourceBadge } from './SourceBadge.jsx'

function resolvePublicUrl(path) {
  const raw = String(path ?? '')
  if (!raw) return raw
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (!raw.startsWith('/')) return raw
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? `${base}${raw.slice(1)}` : `${base}${raw}`
}

function getYouTubeId(url) {
  const raw = String(url ?? '')
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.replace('/', '')
  } catch {
    // ignore
  }
  return null
}

function pickCopy(value, locale) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value?.[locale] ?? value?.en ?? ''
  return String(value)
}

export function Tile({ tile, locale = 'en' }) {
  const kind = tile?.kind ?? 'bullet'
  const title = pickCopy(tile?.title, locale)
  const body = pickCopy(tile?.body, locale)
  const value = tile?.value
  const claimIds = tile?.claimIds ?? []
  const imgAlt = pickCopy(tile?.alt, locale)
  const [imageBroken, setImageBroken] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)

  const youTubeId = useMemo(() => getYouTubeId(tile?.youtubeUrl), [tile?.youtubeUrl])
  const thumbnail = youTubeId
    ? `https://i.ytimg.com/vi/${youTubeId}/hqdefault.jpg`
    : null
  const resolvedImageSrc = useMemo(
    () => resolvePublicUrl(tile?.src),
    [tile?.src],
  )

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/6 p-4 shadow-[0_14px_46px_rgba(0,0,0,0.42)] transition will-change-transform hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8 active:scale-[0.99]">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at 20% 20%, rgba(34,197,94,0.14), transparent 48%), radial-gradient(600px circle at 80% 10%, rgba(34,211,238,0.18), transparent 55%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.02)',
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title ? (
            <div className="text-xs font-semibold tracking-wide text-white/60">
              {title}
            </div>
          ) : null}

          {kind === 'metric' && value ? (
            <div className="mt-2 text-3xl font-extrabold leading-tight tabular-nums text-white">
              {value}
            </div>
          ) : null}
        </div>

        <SourceBadge claimIds={claimIds} />
      </div>

      {kind === 'image' && resolvedImageSrc && !imageBroken ? (
        <figure className="mt-3">
          <img
            src={resolvedImageSrc}
            alt={imgAlt || ''}
            loading="lazy"
            decoding="async"
            className="h-44 w-full rounded-xl border border-white/10 object-cover md:h-48"
            onError={() => setImageBroken(true)}
          />
        </figure>
      ) : null}

      {kind === 'video' && youTubeId ? (
        <div className="mt-3">
          {!videoLoaded ? (
            <button
              type="button"
              onClick={() => setVideoLoaded(true)}
              className="relative w-full overflow-hidden rounded-xl border border-white/12 bg-white/6 text-left transition hover:border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={`${title || 'Video'} (YouTube)`}
            >
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover md:h-48"
                />
              ) : (
                <div className="h-44 w-full md:h-48" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur">
                  <span className="sr-only">Play</span>
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    aria-hidden="true"
                    className="translate-x-[1px] text-white"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          ) : (
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/12 bg-black">
              <iframe
                title={title || 'YouTube video'}
                src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      ) : null}

      {kind !== 'image' && kind !== 'video' && body ? (
        <p className="mt-3 text-base leading-normal text-white/75">{body}</p>
      ) : null}

      {Array.isArray(tile?.keywords) && tile.keywords.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tile.keywords.map((k) => (
            <Keyword key={k}>{k}</Keyword>
          ))}
        </div>
      ) : null}
    </div>
  )
}

