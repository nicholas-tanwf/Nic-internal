import { useMemo } from 'react'
import { loadHistory } from '../../ritual/storage.js'
import { GlassPanel } from '../components/GlassPanel.jsx'

function safeDateLabel(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function swatchStyle(hex) {
  return {
    background: hex,
    boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset`,
  }
}

function extractTopics(text) {
  const t = String(text ?? '').toLowerCase()
  const topics = []
  const add = (k) => (topics.includes(k) ? null : topics.push(k))
  if (/(work|boss|job|meeting|deadline|email)/.test(t)) add('work')
  if (/(sleep|insomnia|tired|exhausted)/.test(t)) add('sleep')
  if (/(food|eat|eating|hungry|junk|sugar|caffeine|coffee)/.test(t)) add('food')
  if (/(relationship|partner|friend|family|alone|lonely)/.test(t)) add('connection')
  if (/(money|rent|bills|finance)/.test(t)) add('money')
  if (/(health|sick|pain|body)/.test(t)) add('body')
  return topics
}

function buildGraph(entries) {
  // Build a light co-occurrence graph: topics <-> tags
  const nodes = new Map()
  const edges = new Map()
  const nodeId = (type, label) => `${type}:${label}`
  const ensure = (type, label) => {
    const id = nodeId(type, label)
    if (!nodes.has(id)) nodes.set(id, { id, type, label, weight: 0 })
    return nodes.get(id)
  }
  const incEdge = (a, b) => {
    const key = a < b ? `${a}__${b}` : `${b}__${a}`
    edges.set(key, (edges.get(key) ?? 0) + 1)
  }

  for (const e of entries) {
    const topics = extractTopics(e.input)
    const tags = e.analysis?.tags ?? []
    for (const t of topics) ensure('topic', t).weight += 1
    for (const tag of tags) ensure('state', tag).weight += 1
    for (const t of topics) {
      for (const tag of tags) {
        incEdge(nodeId('topic', t), nodeId('state', tag))
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()).sort((a, b) => b.weight - a.weight).slice(0, 16),
    edges,
  }
}

function GraphViz({ graph }) {
  const nodes = graph.nodes
  const center = 160
  const r = 110
  const pos = new Map()
  nodes.forEach((n, idx) => {
    const ang = (idx / nodes.length) * Math.PI * 2 - Math.PI / 2
    pos.set(n.id, { x: center + Math.cos(ang) * r, y: center + Math.sin(ang) * r })
  })

  const edges = []
  for (const [key, w] of graph.edges.entries()) {
    const [a, b] = key.split('__')
    if (!pos.has(a) || !pos.has(b)) continue
    if (w < 2) continue
    edges.push({ a, b, w })
  }

  return (
    <GlassPanel className="p-4">
      <div className="text-[14px] font-semibold text-white/80">Topology</div>
      <div className="pt-1 text-[12px] text-white/55">Topics ↔ feelings (stronger lines = more frequent)</div>
      <svg viewBox="0 0 320 320" className="mt-3 h-[320px] w-full">
        {edges.map((e, i) => {
          const A = pos.get(e.a)
          const B = pos.get(e.b)
          const stroke = Math.min(0.6, 0.14 + e.w * 0.06)
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke={`rgba(255,148,8,${stroke})`}
              strokeWidth={1 + e.w * 0.5}
            />
          )
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id)
          const fill = n.type === 'topic' ? 'rgba(41,211,139,0.85)' : 'rgba(255,216,74,0.85)'
          return (
            <g key={n.id}>
              <circle cx={p.x} cy={p.y} r={8 + Math.min(8, n.weight)} fill={fill} />
              <text
                x={p.x}
                y={p.y + 22}
                textAnchor="middle"
                fontSize="11"
                fill="rgba(255,255,255,0.75)"
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
    </GlassPanel>
  )
}

function MoodMapHistory({ entries }) {
  const w = 320
  const h = 320
  const pad = 18

  const toXY = (p) => ({
    x: pad + (p?.x ?? 0.5) * (w - pad * 2),
    y: pad + (p?.y ?? 0.5) * (h - pad * 2),
  })

  const latest = entries?.[0]
  const bgA = latest?.beforeColor ?? '#FF9408'
  const bgB = latest?.afterColor ?? '#29D38B'

  return (
    <GlassPanel className="p-4">
      <div className="text-[14px] font-semibold text-white/80">Mood map shifts</div>
      <div className="pt-1 text-[12px] text-white/55">
        Anxious • Angry • Depressed • Contented (before → after)
      </div>

      <div
        className="relative mt-3 h-[320px] w-full overflow-hidden rounded-[22px] border border-white/10 bg-black/35"
        style={{
          background: [
            `radial-gradient(700px circle at 30% 25%, ${bgA}4d, transparent 55%)`,
            `radial-gradient(760px circle at 70% 80%, ${bgB40}, transparent 58%)`,
            'radial-gradient(900px circle at 55% 30%, rgba(255,255,255,0.06), transparent 58%)',
            'linear-gradient(180deg, rgba(16,12,8,0.25), rgba(16,12,8,0.85))',
          ].join(', '),
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 [filter:blur(16px)] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,148,8,0.22),rgba(41,211,139,0.18),rgba(255,216,74,0.14),rgba(255,148,8,0.22))]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.06),transparent_55%)]" />

        <svg viewBox={`0 0 ${w} ${h}`} className="relative h-[320px] w-full">
          <defs>
            <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* crosshair */}
          <line x1={w / 2} y1={pad} x2={w / 2} y2={h - pad} stroke="rgba(255,255,255,0.10)" />
          <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="rgba(255,255,255,0.10)" />

          {/* corner labels */}
          <text x={pad} y={pad + 12} fontSize="11" fill="rgba(255,255,255,0.55)" fontWeight="700">
            ANXIOUS
          </text>
          <text
            x={w - pad}
            y={pad + 12}
            fontSize="11"
            fill="rgba(255,255,255,0.55)"
            fontWeight="700"
            textAnchor="end"
          >
            ANGRY
          </text>
          <text x={pad} y={h - pad} fontSize="11" fill="rgba(255,255,255,0.55)" fontWeight="700">
            DEPRESSED
          </text>
          <text
            x={w - pad}
            y={h - pad}
            fontSize="11"
            fill="rgba(255,255,255,0.55)"
            fontWeight="700"
            textAnchor="end"
          >
            CONTENTED
          </text>

          {entries.slice(0, 14).map((e, idx) => {
            const a = toXY(e.beforePos)
            const b = toXY(e.afterPos)
            const gId = `g_${idx}`
            const alpha = Math.max(0.18, 0.55 - idx * 0.03)
            const strokeW = idx === 0 ? 3.5 : 2
            const dashClass = idx === 0 ? 'exhale-track-draw' : ''

            return (
              <g key={e.id} filter="url(#glow)">
                <defs>
                  <linearGradient id={gId} x1={a.x} y1={a.y} x2={b.x} y2={b.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={e.beforeColor ?? '#FF9408'} stopOpacity={alpha} />
                    <stop offset="100%" stopColor={e.afterColor ?? '#29D38B'} stopOpacity={alpha} />
                  </linearGradient>
                </defs>

                <path
                  d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                  stroke={`url(#${gId})`}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  className={dashClass}
                  fill="none"
                />

                {/* start point */}
                <circle cx={a.x} cy={a.y} r={idx === 0 ? 6 : 5} fill={e.beforeColor ?? '#222'} opacity="0.95" />
                {/* end point */}
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={idx === 0 ? 6 : 5}
                  fill={e.afterColor ?? '#222'}
                  opacity="0.95"
                  className={idx === 0 ? 'exhale-node-pulse' : ''}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </GlassPanel>
  )
}

export function SmartAnalysis() {
  const history = loadHistory()
  const recent = history.slice(0, 21)

  const graph = useMemo(() => buildGraph(history), [history])

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-28 pt-5 text-white">
      <div className="text-[26px] font-bold tracking-[-0.02em]">Smart analysis</div>
      <div className="pt-2 text-[15px] leading-relaxed text-white/65">
        Color‑tracked feelings + pattern recognition from what you share.
      </div>

      <GlassPanel className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[14px] font-semibold text-white/80">Daily color shift</div>
          <div className="text-[12px] text-white/55">{recent.length} sessions</div>
        </div>
        <div className="mt-4 space-y-3">
          {recent.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white/80">
                  {safeDateLabel(e.at)}
                </div>
                <div className="pt-0.5 text-[12px] text-white/50">
                  {(e.analysis?.tags ?? []).slice(0, 3).join(' • ') || '—'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full" style={swatchStyle(e.beforeColor ?? '#222')} />
                <div className="text-white/40">→</div>
                <div className="h-7 w-7 rounded-full" style={swatchStyle(e.afterColor ?? '#222')} />
              </div>
            </div>
          ))}
          {!recent.length ? (
            <div className="text-[13px] text-white/55">No sessions yet—complete one ritual to see patterns.</div>
          ) : null}
        </div>
      </GlassPanel>

      <div className="mt-5">
        <MoodMapHistory entries={recent} />
      </div>

      <div className="mt-5">
        <GraphViz graph={graph} />
      </div>
    </div>
  )
}

