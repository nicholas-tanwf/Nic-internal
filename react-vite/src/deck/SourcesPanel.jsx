import { useEffect, useMemo, useRef } from 'react'
import { ASSETS, CLAIMS, SOURCES } from '../content/sources.content.js'

function pickCopy(value, locale) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return value?.[locale] ?? value?.en ?? ''
  return String(value)
}

function groupBySourceId() {
  const byId = new Map()
  for (const c of CLAIMS) {
    for (const sid of c.sourceIds ?? []) {
      if (!byId.has(sid)) byId.set(sid, [])
      byId.get(sid).push(c)
    }
  }
  return byId
}

export function SourcesPanel({ open, onClose, locale = 'en' }) {
  const closeBtnRef = useRef(null)

  const claimsBySource = useMemo(() => groupBySourceId(), [])

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus?.()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label={locale === 'zh' ? '关闭来源弹窗' : 'Close sources dialog'}
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1200px] px-4 pb-[max(env(safe-area-inset-bottom),16px)] md:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/55 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
            <div>
              <div className="text-sm font-semibold tracking-wide text-white/85">
                {locale === 'zh' ? '来源 / 署名' : 'Sources / Attribution'}
              </div>
              <div className="mt-1 text-sm text-white/65">
                {locale === 'zh'
                  ? '用于追溯引用、视频链接与素材署名（不增加幻灯片页数）。'
                  : 'Traceable references for videos and assets (without adding slides).'}
              </div>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="h-11 w-11 rounded-xl border border-white/15 bg-white/5 text-white/85 transition hover:border-white/25 hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={locale === 'zh' ? '关闭' : 'Close'}
              title={locale === 'zh' ? '关闭' : 'Close'}
            >
              <span className="sr-only">{locale === 'zh' ? '关闭' : 'Close'}</span>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
                className="mx-auto text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
            <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="text-xs font-semibold tracking-wide text-white/70">
                {locale === 'zh' ? '视频来源' : 'Video sources'}
              </h3>
              <ul className="mt-3 space-y-3">
                {SOURCES.map((s) => (
                  <li key={s.id} className="text-sm leading-normal">
                    <div className="font-semibold text-white/90">
                      {s.publisher}
                    </div>
                    <a
                      className="mt-1 inline-block text-white underline decoration-white/30 underline-offset-4 hover:decoration-white/60"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.title}
                    </a>
                    <div className="mt-1 text-xs text-white/60">
                      {locale === 'zh'
                        ? `访问：${s.accessedAt ?? '—'}`
                        : `Accessed: ${s.accessedAt ?? '—'}`}
                    </div>
                    {claimsBySource.get(s.id)?.length ? (
                      <ul className="mt-2 space-y-1">
                        {claimsBySource.get(s.id).map((c) => (
                          <li key={c.id} className="text-xs text-white/70">
                            - {c.text}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="text-xs font-semibold tracking-wide text-white/70">
                {locale === 'zh' ? '素材 / 署名' : 'Assets / attribution'}
              </h3>
              <ul className="mt-3 space-y-3 text-sm leading-normal text-white/85">
                {ASSETS.map((a) => (
                  <li key={a.id}>
                    <div className="font-semibold text-white/90">
                      {a.type.toUpperCase()}
                    </div>
                    <div className="mt-1 text-xs text-white/70">
                      {locale === 'zh'
                        ? `来源：${a.origin} • 许可：${a.license}`
                        : `Origin: ${a.origin} • License: ${a.license}`}
                    </div>
                    <div className="mt-1 text-sm text-white/85">
                      {a.attribution}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <h3 className="text-xs font-semibold tracking-wide text-white/70">
                {locale === 'zh' ? '提示' : 'Notes'}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-normal text-white/80">
                <li>
                  {locale === 'zh'
                    ? '本页用于“可追溯”，不等同于官方发布声明。'
                    : 'This panel provides traceability; it is not an official product announcement.'}
                </li>
                <li>
                  {locale === 'zh'
                    ? '如需对外分享，请再次确认照片与引用的授权范围。'
                    : 'If sharing externally, confirm photo permissions and citation scope again.'}
                </li>
                <li>
                  {locale === 'zh'
                    ? '为性能考虑，视频采用“点击后加载”。'
                    : 'For performance, videos load only after user interaction.'}
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

