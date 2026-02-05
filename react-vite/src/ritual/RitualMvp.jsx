import { useEffect, useMemo, useState } from 'react'
import { analyzeCheckIn, composeRitual } from './ritualEngine.js'
import { loadHistory, pushHistory } from './storage.js'
import { useCountdown, useSpeechToText } from './hooks.js'
import { BreathVisual, phaseForBreath } from './breath.jsx'
import { IntroSplash } from './IntroSplash.jsx'
import { MoodMapPicker } from '../exhale/components/MoodMapPicker.jsx'
import {
  Card,
  GhostButton,
  OpenPlayerShell,
  OpenProgramCard,
  Pill,
  PrimaryButton,
  ProgressDots,
  SmallLink,
  TopBar,
  formatMinutesSeconds,
} from './ui.jsx'

const STEPS = ['mood', 'check-in', 'insight', 'ritual', 'wrap'] // keep aligned with UI dots
const nowIso = () => new Date().toISOString()

const coverForState = (state) =>
  ({ downshift: '/ritual/red-profile.jpg', gentle: '/ritual/season-blue.jpg', upshift: '/ritual/red-athlete.jpg' }[
    state
  ] ?? '/ritual/orange-portal.jpg')

export function RitualMvp({ onOpenDeck, embedded = false }) {
  const [step, setStep] = useState('mood')
  const [showIntro, setShowIntro] = useState(false)
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [ritual, setRitual] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [journalText, setJournalText] = useState('')
  const [history, setHistory] = useState(() => loadHistory())
  const [moodAfter, setMoodAfter] = useState(null)
  const [beforeColor, setBeforeColor] = useState('#FF9408')
  const [afterColor, setAfterColor] = useState('#29D38B')
  const [beforePos, setBeforePos] = useState({ x: 0.5, y: 0.5 })
  const [afterPos, setAfterPos] = useState({ x: 0.5, y: 0.5 })

  const speech = useSpeechToText()

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem('exhale-intro-seen')
      if (seen === '1') return
      window.sessionStorage.setItem('exhale-intro-seen', '1')
      setShowIntro(true)
    } catch {
      // If storage is blocked, still show intro once.
      setShowIntro(true)
    }
  }, [])

  const active = ritual[activeIdx]
  const secondsLeft = useCountdown({
    totalSeconds: active?.seconds ?? 0,
    running: step === 'ritual' && running,
    onDone: () => {
      setRunning(false)
      setActiveIdx((i) => Math.min(ritual.length - 1, i + 1))
    },
  })

  const totalSeconds = useMemo(() => ritual.reduce((acc, s) => acc + (s.seconds ?? 0), 0), [ritual])
  const completedSeconds = useMemo(() => {
    const before = ritual.slice(0, activeIdx).reduce((acc, s) => acc + (s.seconds ?? 0), 0)
    return before + Math.max(0, (active?.seconds ?? 0) - secondsLeft)
  }, [ritual, activeIdx, active, secondsLeft])

  const percent = totalSeconds ? Math.round((completedSeconds / totalSeconds) * 100) : 0
  const elapsedInModule = Math.max(0, (active?.seconds ?? 0) - secondsLeft)

  const startProcess = async () => {
    setProcessing(true)
    setAnalysis(null)
    setRitual([])
    setActiveIdx(0)
    setRunning(false)
    setMoodAfter(null)

    // Simulate "AI processing" for demo feel.
    await new Promise((r) => window.setTimeout(r, 650))

    const a = analyzeCheckIn({ text: input })
    const plan = composeRitual({ analysis: a })

    setAnalysis(a)
    setRitual(plan)
    setProcessing(false)
    setStep('insight')
  }

  const startRitual = () => {
    setStep('ritual')
    setRunning(true)
  }

  const skipModule = () => {
    setRunning(false)
    setActiveIdx((i) => Math.min(ritual.length - 1, i + 1))
  }

  const finish = () => {
    setRunning(false)
    setStep('wrap')
  }

  const saveSession = () => {
    if (!analysis) return
    const entry = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      at: nowIso(),
      input: input.slice(0, 1200),
      analysis,
      ritual: ritual.map(({ id, minutes, label, kind }) => ({ id, minutes, label, kind })),
      moodAfter: moodAfter ?? analysis.moodBefore,
      journalText: journalText.slice(0, 1200),
      beforeColor,
      afterColor,
      beforePos,
      afterPos,
    }
    const next = pushHistory(entry)
    setHistory(next)
  }

  const reset = () => {
    setStep('mood')
    setInput('')
    setAnalysis(null)
    setRitual([])
    setActiveIdx(0)
    setRunning(false)
    setJournalText('')
    setMoodAfter(null)
  }

  const stateLabel =
    analysis?.state === 'downshift'
      ? 'Downshift'
      : analysis?.state === 'upshift'
        ? 'Upshift'
        : analysis?.state === 'gentle'
          ? 'Gentle'
          : 'Steady'

  return (
    <div className={embedded ? 'text-white' : 'min-h-screen bg-[var(--ritual-bg)] text-white'}>
      {showIntro ? <IntroSplash onDone={() => setShowIntro(false)} /> : null}
      {!embedded ? (
        <>
          <TopBar
            title="Exhale"
            left={
              <SmallLink
                onClick={() => {
                  try {
                    onOpenDeck?.('intro')
                  } catch {
                    // ignore
                  }
                }}
              >
                Deck
              </SmallLink>
            }
            right={
              <SmallLink
                onClick={() => {
                  reset()
                }}
              >
                Reset
              </SmallLink>
            }
          />
          <ProgressDots step={step} steps={STEPS} />
        </>
      ) : null}

      <div className={embedded ? 'mx-auto w-full max-w-[520px] px-5 pb-28' : 'mx-auto w-full max-w-[520px] px-5 pb-8'}>
        {step === 'mood' && (
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold tracking-widest text-white/60">
                EXHALE
              </div>
              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[12px] font-semibold text-white/70 backdrop-blur">
                {beforeColor.toUpperCase()}
              </div>
            </div>

            <div className="pt-4 text-[26px] font-bold leading-tight tracking-[-0.02em]">
              SELECT YOUR CURRENT MOOD
            </div>
            <div className="pt-2 text-[14px] text-white/55">
              Drag the orb. Your color becomes today’s “before” mood.
            </div>

            <div className="mt-5">
              <MoodMapPicker
                value={beforeColor}
                onChange={(hex, pos) => {
                  setBeforeColor(hex)
                  if (pos) setBeforePos(pos)
                }}
              />
            </div>

            <div className="mt-5 space-y-3">
              <PrimaryButton onClick={() => setStep('check-in')}>Continue</PrimaryButton>
              <div className="text-center text-[12px] text-white/45">Tip: you can change it anytime.</div>
            </div>
          </div>
        )}
        {step === 'check-in' && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="text-[24px] font-bold leading-tight">How was your day, really?</div>
              <div className="text-[16px] leading-normal text-white/70">
                Talk or type for ~60 seconds. We’ll turn it into a bespoke 10‑minute ritual.
              </div>
            </div>

            <Card>
              <label className="block text-[14px] font-semibold text-white/80">Your check‑in</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What’s on your mind? What’s your body feeling?"
                className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              />

              <div className="mt-4 flex flex-col gap-3">
                <PrimaryButton onClick={startProcess} disabled={processing || input.trim().length < 12}>
                  {processing ? 'Processing…' : 'Generate my ritual'}
                </PrimaryButton>

                <button
                  type="button"
                  onClick={() => {
                    if (!speech.supported) return
                    if (speech.listening) speech.stop()
                    else
                      speech.start({
                        onText: (t) => {
                          setInput((prev) => (prev ? `${prev} ${t}` : t))
                        },
                      })
                  }}
                  disabled={!speech.supported}
                  className="h-12 w-full rounded-2xl border border-white/15 bg-white/5 px-5 text-[14px] font-semibold text-white/90 transition active:scale-[0.98] active:opacity-80 disabled:opacity-40"
                >
                  {speech.supported
                    ? speech.listening
                      ? 'Stop recording'
                      : 'Record voice (beta)'
                    : 'Voice input not available in this browser'}
                </button>

                {speech.error && (
                  <div className="text-[12px] text-rose-200/80">Voice error: {speech.error}</div>
                )}
              </div>
            </Card>

            {history.length > 0 && (
              <div className="pt-2">
                <div className="pb-2 text-[14px] font-semibold text-white/70">Recent</div>
                <div className="space-y-3">
                  {history.slice(0, 3).map((h) => (
                    <Card key={h.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold">{h.analysis?.state ?? 'steady'}</div>
                          <div className="pt-1 text-[12px] text-white/60">
                            {new Date(h.at).toLocaleString()}
                          </div>
                        </div>
                        <Pill>{(h.analysis?.tags ?? []).slice(0, 2).join(' • ') || '—'}</Pill>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'insight' && analysis && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="text-[24px] font-bold leading-tight">Today’s ritual</div>
              <div className="text-[16px] leading-normal text-white/70">
                {analysis.reflection}
              </div>
            </div>

            <div style={{ '--ritual-cover': `url(${coverForState(analysis.state)})` }}>
              <OpenProgramCard
                title={`${stateLabel} Reset`}
                subtitle={analysis.recommendation}
                chips={['Meditate', 'Journal', 'Breathe', 'Sound']}
                onStart={startRitual}
              />
            </div>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-semibold text-white/80">Your protocol</div>
                <Pill>{ritual.reduce((acc, s) => acc + s.minutes, 0)} min</Pill>
              </div>
              <div className="pt-3 space-y-2">
                {ritual.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <div className="text-[16px] font-semibold">{s.label}</div>
                    <div className="text-[14px] text-white/70">{s.minutes} min</div>
                  </div>
                ))}
              </div>
              {analysis.tags?.length ? (
                <div className="pt-4 flex flex-wrap gap-2">
                  {analysis.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              ) : null}
            </Card>

            <GhostButton onClick={() => setStep('check-in')}>Edit my check‑in</GhostButton>
          </div>
        )}

        {step === 'ritual' && analysis && active && (
          <div className="space-y-4 pt-3">
            <div style={{ '--ritual-cover': `url(${coverForState(analysis.state)})` }}>
              <OpenPlayerShell
                coverTitle={active.label}
                coverSubtitle={`${stateLabel} • Step ${activeIdx + 1}/${ritual.length}`}
              >
              <div className="flex items-center justify-between gap-3">
                <Pill>{formatMinutesSeconds(secondsLeft)}</Pill>
                <Pill>{percent}%</Pill>
              </div>

              <div className="mt-4 h-[2px] w-full bg-white/10">
                <div className="h-[2px] bg-white/70" style={{ width: `${percent}%` }} />
              </div>

              {active.kind === 'breath' ? (
                <div style={{ '--exhale-accent': beforeColor }}>
                  <BreathVisual
                    phase={phaseForBreath(analysis.state, elapsedInModule)}
                    beatKey={secondsLeft}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                {active.script?.map((line, idx) => (
                  <div
                    key={idx}
                    className={[
                      'leading-relaxed',
                      active.kind === 'breath' ? 'text-[14px] text-white/70' : 'text-[16px] text-white/85',
                    ].join(' ')}
                  >
                    {line}
                  </div>
                ))}
              </div>

              {active.kind === 'journal' && (
                <div className="pt-4">
                  <label className="block text-[12px] font-semibold text-white/60">Notes (optional)</label>
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="Type or paste your thoughts here…"
                    className="mt-2 min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[16px] leading-relaxed text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-5 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={skipModule}
                  className="h-12 rounded-2xl border border-white/15 bg-white/5 px-4 text-[14px] font-semibold text-white transition active:scale-[0.98] active:opacity-80"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className="h-12 rounded-2xl bg-white px-4 text-[14px] font-semibold text-black transition active:scale-[0.98] active:opacity-80"
                >
                  {running ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="h-12 rounded-2xl border border-white/15 bg-white/5 px-4 text-[14px] font-semibold text-white transition active:scale-[0.98] active:opacity-80"
                >
                  End
                </button>
              </div>
              </OpenPlayerShell>
            </div>
          </div>
        )}

        {step === 'wrap' && analysis && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="text-[24px] font-bold leading-tight">Nice. What changed?</div>
              <div className="text-[16px] leading-normal text-white/70">
                The app gets smarter if you give a quick after‑check.
              </div>
            </div>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-semibold text-white/80">Mood after</div>
                <Pill>{moodAfter ?? analysis.moodBefore}</Pill>
              </div>
              <input
                type="range"
                min={-2}
                max={2}
                step={1}
                value={moodAfter ?? analysis.moodBefore}
                onChange={(e) => setMoodAfter(Number(e.target.value))}
                className="mt-4 w-full"
                aria-label="Mood after"
              />
              <div className="mt-2 flex justify-between text-[12px] text-white/50">
                <span>Low</span>
                <span>Neutral</span>
                <span>High</span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[14px] font-semibold text-white/80">Mood after</div>
                <Pill>{afterColor.toUpperCase()}</Pill>
              </div>
              <div className="mt-3">
                <MoodMapPicker
                  value={afterColor}
                  onChange={(hex, pos) => {
                    setAfterColor(hex)
                    if (pos) setAfterPos(pos)
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px] text-white/55">
                <span>Before</span>
                <span className="text-white/40">→</span>
                <span>After</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-7 w-7 rounded-full" style={{ background: beforeColor }} />
                <div className="h-7 w-7 rounded-full" style={{ background: afterColor }} />
              </div>
            </Card>

            <div className="space-y-3">
              <PrimaryButton
                onClick={() => {
                  saveSession()
                  reset()
                }}
              >
                Save & done
              </PrimaryButton>
              <GhostButton onClick={reset}>Start again</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

