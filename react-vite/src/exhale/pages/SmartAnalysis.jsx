import { useMemo, useState } from 'react'
import { loadHistory } from '../../ritual/storage.js'
import { GlassPanel } from '../components/GlassPanel.jsx'

function safeDateLabel(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

// ============================================
// MONTHLY CALENDAR HEATMAP
// ============================================
function MonthlyCalendar({ entries }) {
  const [monthOffset, setMonthOffset] = useState(0)
  
  const { calendarData, monthLabel, daysInMonth, startDay } = useMemo(() => {
    const now = new Date()
    const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDay = new Date(year, month, 1).getDay()
    const monthLabel = targetDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    
    // Build map of day -> entries for this month
    const dayMap = new Map()
    for (const e of entries) {
      try {
        const d = new Date(e.at)
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate()
          if (!dayMap.has(day)) dayMap.set(day, [])
          dayMap.get(day).push(e)
        }
      } catch {}
    }
    
    // Build calendar grid data
    const calendarData = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEntries = dayMap.get(d) ?? []
      // Average the before colors for this day, or use after color if improved
      let color = null
      let improved = false
      if (dayEntries.length > 0) {
        // Use the dominant mood color (most recent entry's after color)
        color = dayEntries[0].afterColor ?? dayEntries[0].beforeColor ?? '#666'
        // Check if mood improved (moved toward contented quadrant)
        const before = dayEntries[0].beforePos
        const after = dayEntries[0].afterPos
        if (before && after) {
          const beforeScore = before.x + (1 - before.y) // higher x, lower y = more contented
          const afterScore = after.x + (1 - after.y)
          improved = afterScore > beforeScore + 0.1
        }
      }
      calendarData.push({ day: d, color, count: dayEntries.length, improved })
    }
    
    return { calendarData, monthLabel, daysInMonth, startDay }
  }, [entries, monthOffset])
  
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-white/80">Monthly mood calendar</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset(o => o + 1)}
            className="h-6 w-6 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition"
          >
            ‹
          </button>
          <div className="text-[12px] text-white/60 min-w-[100px] text-center">{monthLabel}</div>
          <button
            onClick={() => setMonthOffset(o => Math.max(0, o - 1))}
            disabled={monthOffset === 0}
            className="h-6 w-6 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>
      <div className="pt-1 text-[12px] text-white/55">Each day shows your dominant mood color</div>
      
      {/* Calendar grid */}
      <div className="mt-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-white/40 font-medium">{d}</div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for start offset */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {calendarData.map(({ day, color, count, improved }) => (
            <div
              key={day}
              className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-transform hover:scale-110"
              style={{
                background: color 
                  ? `linear-gradient(135deg, ${color}dd, ${color}88)`
                  : 'rgba(255,255,255,0.05)',
                boxShadow: color ? `0 4px 12px ${color}40` : 'none',
              }}
            >
              <span className={`text-[11px] font-medium ${color ? 'text-white' : 'text-white/30'}`}>
                {day}
              </span>
              {count > 1 && (
                <span className="text-[8px] text-white/70">×{count}</span>
              )}
              {improved && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 flex items-center justify-center">
                  <span className="text-[8px]">↑</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-white/50">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-white/10" />
          <span>No session</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-400 flex items-center justify-center">
            <span className="text-[6px]">↑</span>
          </div>
          <span>Mood improved</span>
        </div>
      </div>
    </GlassPanel>
  )
}

// ============================================
// TOP RITUALS SUMMARY
// ============================================
function TopRituals({ entries }) {
  const topRituals = useMemo(() => {
    if (!entries.length) return []
    
    // Count occurrences of each ritual type
    const ritualCounts = new Map()
    
    for (const e of entries) {
      const ritualSteps = e.ritual ?? []
      for (const step of ritualSteps) {
        const key = step.id ?? step.label ?? 'unknown'
        const existing = ritualCounts.get(key) ?? { 
          id: key, 
          label: step.label ?? key, 
          kind: step.kind ?? 'meditation',
          count: 0,
          totalMinutes: 0
        }
        existing.count++
        existing.totalMinutes += step.minutes ?? 0
        ritualCounts.set(key, existing)
      }
    }
    
    // Sort by count and take top 3
    return Array.from(ritualCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  }, [entries])

  // Generate AI-style insights for each ritual
  const getInsight = (ritual, rank) => {
    const insights = {
      breath: [
        "Breathwork appears frequently in your rituals. Consider practicing 4-7-8 breathing during stressful moments.",
        "Your body responds well to breathing exercises. Try a 5-minute breath session before important meetings.",
        "Breathing techniques are your go-to. Keep a breathing app shortcut on your home screen.",
      ],
      meditation: [
        "Meditation keeps showing up for you. Try extending your practice by 2 minutes each week.",
        "Mindfulness is resonating with you. Consider a morning meditation ritual.",
        "You're drawn to stillness. Explore body scan meditations for deeper relaxation.",
      ],
      movement: [
        "Movement helps you reset. Try gentle stretching during work breaks.",
        "Physical release works for you. Consider yoga or tai chi for longer sessions.",
        "Your body needs to move to process emotions. Dance or walk when stressed.",
      ],
      journal: [
        "Writing helps you process. Keep a pocket notebook for quick thought dumps.",
        "Journaling clarifies your mind. Try morning pages for 5 minutes daily.",
        "You benefit from expressing thoughts. Voice memos work too when you can't write.",
      ],
      sound: [
        "Sound therapy calms your nervous system. Create a relaxation playlist.",
        "You respond to audio experiences. Try binaural beats during focus time.",
        "Healing frequencies work for you. Use them as background during work.",
      ],
      mindset: [
        "Affirmations and reframing help you. Write 3 affirmations on your mirror.",
        "Cognitive techniques resonate with you. Practice gratitude journaling.",
        "Mindset work suits you. Read one inspiring quote each morning.",
      ],
    }
    const kindInsights = insights[ritual.kind] ?? insights.meditation
    return kindInsights[rank % kindInsights.length]
  }

  // Icon for each ritual kind
  const getIcon = (kind) => {
    const icons = {
      breath: '🌬️',
      meditation: '🧘',
      movement: '🏃',
      journal: '📝',
      sound: '🎧',
      mindset: '💭',
    }
    return icons[kind] ?? '✨'
  }

  if (!topRituals.length) {
    return (
      <GlassPanel className="p-4">
        <div className="text-[14px] font-semibold text-white/80">Your top rituals</div>
        <div className="pt-1 text-[12px] text-white/55">
          Complete more sessions to see which practices resonate with you.
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="p-4">
      <div className="text-[14px] font-semibold text-white/80">Your top rituals</div>
      <div className="pt-1 text-[12px] text-white/55">
        These practices come up most in your sessions—consider incorporating them into your daily routine.
      </div>
      
      <div className="mt-4 space-y-3">
        {topRituals.map((ritual, idx) => (
          <div 
            key={ritual.id}
            className="rounded-xl bg-white/5 p-3 border border-white/10"
          >
            <div className="flex items-start gap-3">
              {/* Rank badge */}
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                style={{
                  background: idx === 0 ? 'linear-gradient(135deg, #FFD84A, #FF9408)' :
                             idx === 1 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                             'linear-gradient(135deg, #CD7F32, #A0522D)',
                }}
              >
                {getIcon(ritual.kind)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-white">{ritual.label}</div>
                  <div className="text-[11px] text-white/50">
                    {ritual.count}× • {Math.round(ritual.totalMinutes)} min total
                  </div>
                </div>
                
                {/* AI insight */}
                <div className="mt-1.5 text-[12px] text-white/60 leading-relaxed">
                  {getInsight(ritual, idx)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary tip */}
      <div className="mt-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-3">
        <div className="flex items-start gap-2">
          <span className="text-green-400 text-sm">💡</span>
          <div className="text-[12px] text-green-300/80 leading-relaxed">
            <strong>Pro tip:</strong> Schedule 5 minutes daily for your #1 practice. 
            Consistency matters more than duration.
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}

// ============================================
// TIME OF DAY PATTERNS (Radial Chart)
// ============================================
function TimeOfDayPatterns({ entries }) {
  const hourData = useMemo(() => {
    // Group entries by hour of day
    const hours = Array.from({ length: 24 }, () => ({ count: 0, totalEnergy: 0, totalStress: 0 }))
    
    for (const e of entries) {
      try {
        const hour = new Date(e.at).getHours()
        hours[hour].count++
        // Use position as energy/stress proxy
        if (e.beforePos) {
          hours[hour].totalEnergy += e.beforePos.x // x = energy level
          hours[hour].totalStress += e.beforePos.y // y = stress level (inverted)
        }
      } catch {}
    }
    
    // Calculate averages and normalize
    const maxCount = Math.max(...hours.map(h => h.count), 1)
    return hours.map((h, i) => ({
      hour: i,
      count: h.count,
      intensity: h.count / maxCount,
      avgEnergy: h.count ? h.totalEnergy / h.count : 0.5,
      avgStress: h.count ? h.totalStress / h.count : 0.5,
    }))
  }, [entries])
  
  const cx = 120, cy = 120, r = 90
  
  return (
    <GlassPanel className="p-4">
      <div className="text-[14px] font-semibold text-white/80">Emotional rhythm</div>
      <div className="pt-1 text-[12px] text-white/55">When do you typically check-in?</div>
      
      <div className="mt-3 flex justify-center">
        <svg viewBox="0 0 240 240" className="h-[240px] w-[240px]">
          {/* Hour markers */}
          {[0, 6, 12, 18].map(h => {
            const angle = (h / 24) * Math.PI * 2 - Math.PI / 2
            const x = cx + Math.cos(angle) * (r + 15)
            const y = cy + Math.sin(angle) * (r + 15)
            const label = h === 0 ? '12am' : h === 6 ? '6am' : h === 12 ? '12pm' : '6pm'
            return (
              <text key={h} x={x} y={y + 4} fontSize="10" fill="rgba(255,255,255,0.4)" textAnchor="middle">
                {label}
              </text>
            )
          })}
          
          {/* Radial segments */}
          {hourData.map(({ hour, intensity, avgEnergy, avgStress }) => {
            if (intensity === 0) return null
            
            const startAngle = (hour / 24) * Math.PI * 2 - Math.PI / 2
            const endAngle = ((hour + 1) / 24) * Math.PI * 2 - Math.PI / 2
            const innerR = 30
            const outerR = innerR + intensity * 60
            
            // Color based on mood position
            const hue = avgEnergy > 0.5 
              ? (avgStress < 0.5 ? 140 : 40) // green or yellow
              : (avgStress < 0.5 ? 200 : 10) // blue or red
            const color = `hsl(${hue}, 70%, 55%)`
            
            const x1 = cx + Math.cos(startAngle) * innerR
            const y1 = cy + Math.sin(startAngle) * innerR
            const x2 = cx + Math.cos(startAngle) * outerR
            const y2 = cy + Math.sin(startAngle) * outerR
            const x3 = cx + Math.cos(endAngle) * outerR
            const y3 = cy + Math.sin(endAngle) * outerR
            const x4 = cx + Math.cos(endAngle) * innerR
            const y4 = cy + Math.sin(endAngle) * innerR
            
            return (
              <path
                key={hour}
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`}
                fill={color}
                opacity={0.7 + intensity * 0.3}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="0.5"
              />
            )
          })}
          
          {/* Center circle */}
          <circle cx={cx} cy={cy} r="25" fill="rgba(0,0,0,0.4)" />
          <text x={cx} y={cy + 4} fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">
            24h
          </text>
        </svg>
      </div>
      
      {/* Insights */}
      <div className="mt-2 text-center text-[11px] text-white/50">
        Larger segments = more check-ins at that hour
      </div>
    </GlassPanel>
  )
}

// ============================================
// WEEKLY PATTERN HEATMAP
// ============================================
function WeeklyPatterns({ entries }) {
  const heatmapData = useMemo(() => {
    // 7 days × 4 time blocks (morning, afternoon, evening, night)
    const grid = Array.from({ length: 7 }, () => 
      Array.from({ length: 4 }, () => ({ count: 0, totalStress: 0 }))
    )
    
    const timeBlock = (hour) => {
      if (hour >= 5 && hour < 12) return 0 // Morning
      if (hour >= 12 && hour < 17) return 1 // Afternoon
      if (hour >= 17 && hour < 21) return 2 // Evening
      return 3 // Night
    }
    
    for (const e of entries) {
      try {
        const d = new Date(e.at)
        const day = d.getDay()
        const block = timeBlock(d.getHours())
        grid[day][block].count++
        if (e.beforePos) {
          grid[day][block].totalStress += e.beforePos.y // y = stress
        }
      } catch {}
    }
    
    // Flatten and calculate averages
    const flat = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const blocks = ['Morning', 'Afternoon', 'Evening', 'Night']
    
    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < 4; b++) {
        const cell = grid[d][b]
        flat.push({
          day: d,
          dayLabel: days[d],
          block: b,
          blockLabel: blocks[b],
          count: cell.count,
          avgStress: cell.count ? cell.totalStress / cell.count : null,
        })
      }
    }
    
    return { flat, days, blocks }
  }, [entries])
  
  const { flat, days, blocks } = heatmapData
  const maxCount = Math.max(...flat.map(c => c.count), 1)
  
  return (
    <GlassPanel className="p-4">
      <div className="text-[14px] font-semibold text-white/80">Weekly patterns</div>
      <div className="pt-1 text-[12px] text-white/55">When are you most stressed? (color intensity = stress level)</div>
      
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[280px]">
          {/* Header row */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div /> {/* Empty corner */}
            {days.map(d => (
              <div key={d} className="text-center text-[10px] text-white/50 font-medium">{d}</div>
            ))}
          </div>
          
          {/* Data rows */}
          {blocks.map((block, bi) => (
            <div key={block} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-[9px] text-white/40 flex items-center justify-end pr-1">{block}</div>
              {days.map((_, di) => {
                const cell = flat.find(c => c.day === di && c.block === bi)
                const intensity = cell?.count ? cell.count / maxCount : 0
                const stress = cell?.avgStress ?? 0.5
                
                // Color: green (low stress) to red (high stress)
                const hue = 120 - stress * 120 // 120 = green, 0 = red
                const color = cell?.count 
                  ? `hsla(${hue}, 60%, 50%, ${0.3 + intensity * 0.7})`
                  : 'rgba(255,255,255,0.05)'
                
                return (
                  <div
                    key={di}
                    className="aspect-square rounded-md flex items-center justify-center transition-transform hover:scale-110"
                    style={{ background: color }}
                    title={`${days[di]} ${block}: ${cell?.count || 0} sessions`}
                  >
                    {cell?.count > 0 && (
                      <span className="text-[9px] text-white/80">{cell.count}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <div className="h-3 w-8 rounded" style={{ background: 'linear-gradient(90deg, hsl(120,60%,50%), hsl(0,60%,50%))' }} />
          <span className="text-[10px] text-white/50">Calm → Stressed</span>
        </div>
      </div>
    </GlassPanel>
  )
}

// ============================================
// EMOTIONAL TREND SPARKLINE
// ============================================

// Generate AI-style summary for a session - with user's actual input
function generateSessionSummary(entry, isSpike) {
  const input = entry.input ?? ''
  const tags = entry.analysis?.tags ?? []
  const date = new Date(entry.at)
  const dayName = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  
  // Get a snippet of what the user actually said (first 60 chars)
  const inputSnippet = input.length > 60 ? input.slice(0, 57).trim() + '...' : input
  const hasInput = input.trim().length > 0
  
  // Build context-aware summary
  if (isSpike) {
    // Positive spike
    if (hasInput) {
      return `${dayName}: You said "${inputSnippet}" — This was a high point in your mood.`
    }
    if (tags.length > 0) {
      return `${dayName}: You were feeling ${tags.slice(0, 2).join(' and ')}. A notably positive moment.`
    }
    return `${dayName}: Your mood peaked here. A good day!`
  } else {
    // Dip
    if (hasInput) {
      return `${dayName}: You shared "${inputSnippet}" — This weighed on your mood.`
    }
    if (tags.length > 0) {
      return `${dayName}: You were feeling ${tags.slice(0, 2).join(' and ')}. A challenging moment.`
    }
    return `${dayName}: Your mood dipped here. The ritual helped you process.`
  }
}

// Calculate last 3 days mood summary
function calculateRecentMoodSummary(entries) {
  if (entries.length < 2) return null
  
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Get entries from last 3 days and from 4-7 days ago
  const last3Days = entries.filter(e => {
    try { return new Date(e.at) >= threeDaysAgo } catch { return false }
  })
  const previous4Days = entries.filter(e => {
    try {
      const d = new Date(e.at)
      return d >= sevenDaysAgo && d < threeDaysAgo
    } catch { return false }
  })
  
  if (last3Days.length === 0) return null
  
  // Calculate average mood score for each period
  const calcAvg = (arr) => {
    if (arr.length === 0) return 50
    const sum = arr.reduce((acc, e) => {
      const pos = e.afterPos ?? e.beforePos ?? { x: 0.5, y: 0.5 }
      return acc + (pos.x * 50 + (1 - pos.y) * 50)
    }, 0)
    return sum / arr.length
  }
  
  const recentAvg = calcAvg(last3Days)
  const previousAvg = calcAvg(previous4Days)
  
  // Determine mood label based on score
  const getMoodLabel = (score) => {
    if (score >= 70) return 'contented'
    if (score >= 55) return 'balanced'
    if (score >= 40) return 'a bit low'
    return 'struggling'
  }
  
  // Calculate percentage change
  if (previous4Days.length > 0) {
    const change = ((recentAvg - previousAvg) / previousAvg) * 100
    const absChange = Math.abs(Math.round(change))
    
    if (absChange >= 5) {
      if (change > 0) {
        return {
          text: `You're ${absChange}% more ${getMoodLabel(recentAvg)} in the last 3 days`,
          type: 'positive',
          emoji: '↑'
        }
      } else {
        return {
          text: `You've been feeling ${absChange}% lower in the last 3 days`,
          type: 'negative', 
          emoji: '↓'
        }
      }
    }
  }
  
  // No significant change or no comparison data
  const moodLabel = getMoodLabel(recentAvg)
  if (recentAvg >= 60) {
    return {
      text: `You're feeling ${moodLabel} lately. Keep it up!`,
      type: 'positive',
      emoji: '✨'
    }
  } else if (recentAvg >= 45) {
    return {
      text: `You're holding steady. Small rituals help.`,
      type: 'neutral',
      emoji: '→'
    }
  } else {
    return {
      text: `You've been feeling low recently. Be gentle with yourself.`,
      type: 'negative',
      emoji: '💙'
    }
  }
}

function EmotionalTrend({ entries }) {
  const [timeRange, setTimeRange] = useState('7d') // '7d', '2w', '1m'
  const [activeInsight, setActiveInsight] = useState(null) // { idx, x, y, summary, isSpike }
  
  // Calculate recent mood summary (last 3 days vs previous)
  const recentSummary = useMemo(() => calculateRecentMoodSummary(entries), [entries])
  
  // Filter entries by time range
  const filteredEntries = useMemo(() => {
    const now = new Date()
    const cutoff = new Date()
    
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7)
    else if (timeRange === '2w') cutoff.setDate(now.getDate() - 14)
    else cutoff.setMonth(now.getMonth() - 1)
    
    return entries.filter(e => {
      try {
        return new Date(e.at) >= cutoff
      } catch {
        return false
      }
    })
  }, [entries, timeRange])
  
  const trendData = useMemo(() => {
    const recent = filteredEntries.slice().reverse()
    return recent.map((e, i) => {
      const pos = e.afterPos ?? e.beforePos ?? { x: 0.5, y: 0.5 }
      // Higher score = better mood (high energy, low stress)
      const score = pos.x * 50 + (1 - pos.y) * 50
      return { idx: i, score, color: e.afterColor ?? e.beforeColor ?? '#666', entry: e }
    })
  }, [filteredEntries])
  
  // Calculate linear regression for trendline
  const trendline = useMemo(() => {
    if (trendData.length < 2) return null
    
    const n = trendData.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    
    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += trendData[i].score
      sumXY += i * trendData[i].score
      sumX2 += i * i
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate expected value at each point
    const getExpected = (i) => slope * i + intercept
    
    return { start: intercept, end: slope * (n - 1) + intercept, slope, getExpected }
  }, [trendData])
  
  // Detect spikes and dips (significant deviations from trendline)
  const anomalies = useMemo(() => {
    if (!trendline || trendData.length < 3) return []
    
    const threshold = 12 // Points deviation needed to be significant
    const results = []
    
    for (let i = 0; i < trendData.length; i++) {
      const expected = trendline.getExpected(i)
      const actual = trendData[i].score
      const deviation = actual - expected
      
      if (Math.abs(deviation) > threshold) {
        results.push({
          idx: i,
          isSpike: deviation > 0,
          deviation,
          entry: trendData[i].entry,
        })
      }
    }
    
    // Limit to max 3 most significant anomalies
    return results
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
      .slice(0, 3)
  }, [trendData, trendline])
  
  // Calculate trend direction from trendline slope
  const trending = useMemo(() => {
    if (!trendline) return 'stable'
    if (trendline.slope > 1) return 'up'
    if (trendline.slope < -1) return 'down'
    return 'stable'
  }, [trendline])
  
  const timeRangeOptions = [
    { value: '7d', label: '7 days' },
    { value: '2w', label: '2 weeks' },
    { value: '1m', label: '1 month' },
  ]
  
  if (trendData.length < 2) {
    return (
      <GlassPanel className="p-4">
        <div className="text-[14px] font-semibold text-white/80">Mood Trend</div>
        <div className="pt-1 text-[12px] text-white/55">
          Complete more sessions to see your emotional wellbeing trend.
        </div>
      </GlassPanel>
    )
  }
  
  const w = 300, h = 100, pad = 20
  const maxScore = 100
  const xScale = (i) => pad + (i / (trendData.length - 1)) * (w - pad * 2)
  const yScale = (s) => h - pad - (s / maxScore) * (h - pad * 2)
  
  // Build smooth curve path
  const pathD = trendData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.score)}`).join(' ')
  
  const handleAnomalyClick = (anomaly) => {
    const x = xScale(anomaly.idx)
    const y = yScale(trendData[anomaly.idx].score)
    const summary = generateSessionSummary(anomaly.entry, anomaly.isSpike)
    
    if (activeInsight?.idx === anomaly.idx) {
      setActiveInsight(null)
    } else {
      setActiveInsight({ idx: anomaly.idx, x, y, summary, isSpike: anomaly.isSpike })
    }
  }
  
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-white/80">Mood Trend</div>
        {/* Time range toggle */}
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
          {timeRangeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setTimeRange(opt.value); setActiveInsight(null) }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                timeRange === opt.value 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Recent mood summary one-liner */}
      {recentSummary && (
        <div className={`mt-2 px-3 py-2 rounded-lg text-[13px] font-medium ${
          recentSummary.type === 'positive' 
            ? 'bg-green-500/15 text-green-300' 
            : recentSummary.type === 'negative'
              ? 'bg-orange-500/15 text-orange-300'
              : 'bg-white/10 text-white/70'
        }`}>
          <span className="mr-1.5">{recentSummary.emoji}</span>
          {recentSummary.text}
        </div>
      )}
      
      <div className="pt-2 flex items-center justify-between">
        <div className="text-[12px] text-white/55">
          {filteredEntries.length} sessions
          {anomalies.length > 0 && (
            <span className="ml-2 text-white/40">• Tap markers for insights</span>
          )}
        </div>
        <div className={`text-[12px] flex items-center gap-1 ${
          trending === 'up' ? 'text-green-400' : trending === 'down' ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {trending === 'up' ? '↑ Improving' : trending === 'down' ? '↓ Declining' : '→ Stable'}
        </div>
      </div>
      
      <div className="mt-3 relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#29D38B" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#29D38B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="trendLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF9408" />
              <stop offset="50%" stopColor="#29D38B" />
              <stop offset="100%" stopColor="#29D38B" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={pad} y1={yScale(25)} x2={w - pad} y2={yScale(25)} stroke="rgba(255,255,255,0.06)" />
          <line x1={pad} y1={yScale(50)} x2={w - pad} y2={yScale(50)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          <line x1={pad} y1={yScale(75)} x2={w - pad} y2={yScale(75)} stroke="rgba(255,255,255,0.06)" />
          
          {/* Area fill */}
          <path
            d={`${pathD} L ${xScale(trendData.length - 1)} ${h - pad} L ${xScale(0)} ${h - pad} Z`}
            fill="url(#trendGrad)"
          />
          
          {/* Main mood line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="url(#trendLineGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Trendline (linear regression) */}
          {trendline && (
            <line
              x1={xScale(0)}
              y1={yScale(trendline.start)}
              x2={xScale(trendData.length - 1)}
              y2={yScale(trendline.end)}
              stroke={trending === 'up' ? 'rgba(41, 211, 139, 0.5)' : 
                      trending === 'down' ? 'rgba(255, 107, 107, 0.5)' : 
                      'rgba(255, 216, 74, 0.5)'}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}
          
          {/* Anomaly markers (spikes and dips) */}
          {anomalies.map((a) => {
            const x = xScale(a.idx)
            const y = yScale(trendData[a.idx].score)
            const isActive = activeInsight?.idx === a.idx
            
            return (
              <g 
                key={a.idx} 
                onClick={() => handleAnomalyClick(a)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse animation ring */}
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 12 : 8}
                  fill="none"
                  stroke={a.isSpike ? 'rgba(41, 211, 139, 0.4)' : 'rgba(255, 107, 107, 0.4)'}
                  strokeWidth="2"
                  className={isActive ? '' : 'animate-ping'}
                  style={{ animationDuration: '2s' }}
                />
                {/* Icon background */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={a.isSpike ? '#29D38B' : '#FF6B6B'}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="1"
                />
                {/* Icon */}
                <text
                  x={x}
                  y={y + 3}
                  fontSize="10"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {a.isSpike ? '↑' : '↓'}
                </text>
              </g>
            )
          })}
          
          {/* Y-axis labels */}
          <text x={pad - 3} y={yScale(75) + 3} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="end">Good</text>
          <text x={pad - 3} y={yScale(25) + 3} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="end">Low</text>
        </svg>
        
        {/* Insight popup */}
        {activeInsight && (
          <div 
            className="absolute z-10 w-[85%] left-1/2 -translate-x-1/2 rounded-xl bg-black/90 border border-white/20 p-3 shadow-xl animate-[fadeInUp_0.2s_ease-out]"
            style={{ top: '100%', marginTop: '8px' }}
          >
            <div className="flex items-start gap-2">
              <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm ${
                activeInsight.isSpike ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {activeInsight.isSpike ? '↑' : '↓'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-white/90 leading-relaxed">
                  {activeInsight.summary}
                </div>
              </div>
              <button 
                onClick={() => setActiveInsight(null)}
                className="flex-shrink-0 text-white/40 hover:text-white/70 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className={`flex items-center justify-center gap-4 text-[10px] text-white/40 ${activeInsight ? 'mt-16' : 'mt-2'}`}>
        <div className="flex items-center gap-1">
          <div className="h-0.5 w-4 rounded bg-gradient-to-r from-orange-400 to-green-400" />
          <span>Mood</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`h-0.5 w-4 rounded border-dashed border-t-2 ${
            trending === 'up' ? 'border-green-400/50' : 
            trending === 'down' ? 'border-red-400/50' : 
            'border-yellow-400/50'
          }`} />
          <span>Trend</span>
        </div>
        {anomalies.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-red-400" />
            <span>Insight</span>
          </div>
        )}
      </div>
    </GlassPanel>
  )
}

function swatchStyle(hex) {
  return {
    background: hex,
    boxShadow: `0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.10) inset`,
  }
}

/**
 * Consolidate raw feeling tags into display-friendly emotion categories
 * Groups similar emotions together for cleaner visualization
 */
function consolidateFeelings(tags) {
  const feelings = []
  const add = (f) => !feelings.includes(f) && feelings.push(f)
  
  // Map raw tags to consolidated feeling categories
  const tagMap = {
    // Anxiety family
    'anxious': 'anxious',
    'nervous': 'anxious', 
    'worried': 'anxious',
    'panic': 'anxious',
    'hyperventilating': 'anxious',
    
    // Stress family
    'stressed': 'stressed',
    'overwhelmed': 'stressed',
    'burnout': 'stressed',
    'depleted': 'stressed',
    'pressure': 'stressed',
    
    // Low energy family
    'tired': 'tired',
    'exhausted': 'tired',
    'fatigued': 'tired',
    'drained': 'tired',
    
    // Sadness family
    'low': 'sad',
    'sad': 'sad',
    'lonely': 'sad',
    'grieving': 'sad',
    'missing': 'sad',
    'empty': 'sad',
    
    // Anger family
    'irritated': 'frustrated',
    'frustrated': 'frustrated',
    'angry': 'frustrated',
    'annoyed': 'frustrated',
    
    // Restlessness family
    'wired': 'restless',
    'restless': 'restless',
    'racing-thoughts': 'restless',
    'insomnia': 'restless',
    
    // Focus issues
    'scattered': 'unfocused',
    'distracted': 'unfocused',
    'adhd': 'unfocused',
    'unmotivated': 'unfocused',
    
    // Positive emotions
    'up': 'positive',
    'happy': 'positive',
    'excited': 'positive',
    'energized': 'positive',
    'motivated': 'positive',
    
    'inspired': 'inspired',
    'creative': 'inspired',
    'passionate': 'inspired',
    
    'grateful': 'grateful',
    'thankful': 'grateful',
    'blessed': 'grateful',
    
    'confident': 'confident',
    'proud': 'confident',
    'accomplished': 'confident',
    
    'calm': 'peaceful',
    'peaceful': 'peaceful',
    'content': 'peaceful',
    'serene': 'peaceful',
    
    // Self-perception
    'self-critical': 'self-critical',
    'insecure': 'self-critical',
    
    // Context-specific (keep as-is for pattern detection)
    'ocd': 'ocd',
    'spiraling': 'ocd',
    'compulsive': 'ocd',
  }
  
  for (const tag of tags) {
    const consolidated = tagMap[tag] || tag
    add(consolidated)
  }
  
  return feelings
}

/**
 * AI-like keyword extraction for user issues/topics
 * Detects common life stressors and areas of concern from check-in text
 */
function extractTopics(text) {
  const t = String(text ?? '').toLowerCase()
  const topics = []
  const add = (k) => (topics.includes(k) ? null : topics.push(k))
  
  // WORK & CAREER
  if (/(work|job|boss|manager|coworker|colleague|meeting|deadline|email|office|project|client|presentation|interview|promotion|fired|layoff|career|workplace|workload|overtime|9.to.5)/.test(t)) add('work')
  
  // RELATIONSHIPS & SOCIAL
  if (/(relationship|partner|boyfriend|girlfriend|husband|wife|spouse|marriage|dating|breakup|broke up|ex |divorce|single|love life)/.test(t)) add('relationships')
  if (/(friend|friends|friendship|social|lonely|alone|isolated|no one|nobody|left out|excluded)/.test(t)) add('social')
  if (/(family|mom|dad|mother|father|parent|sibling|brother|sister|kids|children|son|daughter|relatives)/.test(t)) add('family')
  
  // HEALTH & BODY
  if (/(health|sick|illness|disease|doctor|hospital|medication|medicine|chronic|pain|ache|injury|symptom|diagnosis)/.test(t)) add('health')
  if (/(sleep|insomnia|can't sleep|tired|exhausted|fatigue|rest|wake up|waking up|nightmare)/.test(t)) add('sleep')
  if (/(body|weight|fat|diet|eating|food|appetite|hungry|binge|restrict|gym|exercise|workout|fitness)/.test(t)) add('body image')
  
  // MONEY & FINANCES
  if (/(money|financial|finance|rent|bills|debt|loan|credit|savings|broke|poor|expensive|afford|pay|salary|income|budget)/.test(t)) add('money')
  
  // MENTAL HEALTH
  if (/(therapy|therapist|counselor|psychiatrist|medication|mental health|depression|anxiety disorder|diagnosis|treatment)/.test(t)) add('mental health')
  if (/(self.esteem|self.worth|confidence|insecure|not good enough|imposter|fraud|failure|worthless|hate myself)/.test(t)) add('self-worth')
  
  // PRODUCTIVITY & GOALS
  if (/(procrastinat|distract|focus|concentrate|productive|lazy|unmotivated|stuck|blocked|overwhelm|too much|behind)/.test(t)) add('productivity')
  if (/(goal|dream|future|plan|purpose|meaning|direction|lost|confused about life|what am i doing)/.test(t)) add('life direction')
  
  // EDUCATION & LEARNING
  if (/(school|college|university|class|exam|test|study|homework|grade|professor|student|degree|graduate)/.test(t)) add('school')
  
  // LIFE CHANGES & TRANSITIONS
  if (/(moving|move|relocation|new city|new job|starting|ending|change|transition|uncertain|unknown)/.test(t)) add('change')
  if (/(decision|choose|choice|stuck between|don't know what|should i|which path)/.test(t)) add('decisions')
  
  // TIME & BALANCE
  if (/(time|busy|rushed|no time|too much to do|balance|juggling|overwhelmed|schedule|calendar|behind)/.test(t)) add('time pressure')
  if (/(rest|relax|break|vacation|burnout|burnt out|running on empty|need a break)/.test(t)) add('burnout')
  
  // IDENTITY & GROWTH
  if (/(identity|who am i|finding myself|lost myself|change|growing|growth|becoming|authentic|true self)/.test(t)) add('identity')
  if (/(creative|creativity|art|music|writing|project|passion|hobby|side hustle)/.test(t)) add('creativity')
  
  // ENVIRONMENT & LIVING
  if (/(home|apartment|roommate|living situation|space|environment|clutter|mess|clean)/.test(t)) add('living space')
  if (/(city|urban|noise|crowd|commute|traffic|neighborhood)/.test(t)) add('environment')
  
  return topics
}

function buildGraph(entries) {
  // Build a light co-occurrence graph: topics <-> feelings
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
    const rawTags = e.analysis?.tags ?? []
    // Use consolidated feelings for cleaner display
    const feelings = consolidateFeelings(rawTags)
    
    for (const t of topics) ensure('topic', t).weight += 1
    for (const feeling of feelings) ensure('state', feeling).weight += 1
    
    // Create edges between topics and feelings
    for (const t of topics) {
      for (const feeling of feelings) {
        incEdge(nodeId('topic', t), nodeId('state', feeling))
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()).sort((a, b) => b.weight - a.weight).slice(0, 16),
    edges,
  }
}

// ============================================
// RADIAL CONSTELLATION
// ============================================
function RadialConstellation({ graph }) {
  const MAX_PER_TYPE = 6
  
  const allNodes = graph.nodes
  const emotions = allNodes.filter(n => n.type === 'state').slice(0, MAX_PER_TYPE)
  const issues = allNodes.filter(n => n.type === 'topic').slice(0, MAX_PER_TYPE)
  const nodes = [...emotions, ...issues]
  const maxWeight = Math.max(...nodes.map(n => n.weight), 1)
  
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const innerRing = 50
  const outerRing = 105
  
  const pos = new Map()
  
  emotions.forEach((n, idx) => {
    const ang = (idx / Math.max(emotions.length, 1)) * Math.PI * 2 - Math.PI / 2
    pos.set(n.id, { x: cx + Math.cos(ang) * innerRing, y: cy + Math.sin(ang) * innerRing, angle: ang })
  })
  
  issues.forEach((n, idx) => {
    const offset = issues.length > 0 ? Math.PI / issues.length : 0
    const ang = (idx / Math.max(issues.length, 1)) * Math.PI * 2 - Math.PI / 2 + offset
    pos.set(n.id, { x: cx + Math.cos(ang) * outerRing, y: cy + Math.sin(ang) * outerRing, angle: ang })
  })

  const edges = []
  for (const [key, weight] of graph.edges.entries()) {
    const [a, b] = key.split('__')
    if (!pos.has(a) || !pos.has(b) || weight < 1) continue
    edges.push({ a, b, w: weight })
  }
  
  const getNodeSize = (weight) => 6 + (weight / maxWeight) * 6

  return (
    <GlassPanel className="p-4">
      {/* Title only at top */}
      <div className="text-[13px] font-semibold text-white/80">Mood Universe</div>
      
      <div className="relative mt-2 flex justify-center" style={{ height: `${size}px` }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ maxWidth: size }}>
          <defs>
            <filter id="diffuse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            {/* Premium glow filters */}
            <filter id="glowWhite" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowOrange" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowBlue" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          
          {/* Orbit rings */}
          <circle cx={cx} cy={cy} r={innerRing} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx={cx} cy={cy} r={outerRing} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3 6" />
          
          {/* Connections */}
          {edges.map((e, i) => {
            const A = pos.get(e.a), B = pos.get(e.b)
            if (!A || !B) return null
            const midAngle = (A.angle + B.angle) / 2
            const midR = (innerRing + outerRing) / 2 * 0.5
            return (
              <path key={i} d={`M ${A.x} ${A.y} Q ${cx + Math.cos(midAngle) * midR} ${cy + Math.sin(midAngle) * midR} ${B.x} ${B.y}`}
                fill="none" stroke={`rgba(255,255,255,${0.1 + e.w * 0.05})`} strokeWidth={1 + e.w * 0.2} strokeLinecap="round" />
            )
          })}
          
          {/* Center - "You" in white */}
          <circle cx={cx} cy={cy} r={18} fill="rgba(255,255,255,0.15)" filter="url(#glowWhite)" />
          <circle cx={cx} cy={cy} r={12} fill="#FFFFFF" />
          <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fontWeight="600" fill="rgba(60,60,70,0.9)">you</text>
          
          {/* Feelings - Orange */}
          {emotions.map((n) => {
            const p = pos.get(n.id)
            if (!p) return null
            const r = getNodeSize(n.weight)
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r={r + 5} fill="rgba(249,115,22,0.3)" filter="url(#glowOrange)" />
                <circle cx={p.x} cy={p.y} r={r} fill="#F97316" />
                <text x={p.x} y={p.y + r + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)">{n.label}</text>
              </g>
            )
          })}
          
          {/* Topics - Baby blue */}
          {issues.map((n) => {
            const p = pos.get(n.id)
            if (!p) return null
            const r = getNodeSize(n.weight)
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r={r + 5} fill="rgba(125,211,252,0.3)" filter="url(#glowBlue)" />
                <circle cx={p.x} cy={p.y} r={r} fill="#7DD3FC" />
                <text x={p.x} y={p.y + r + 10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.7)">{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend at bottom - premium style */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          <span className="text-[10px] text-white/50 font-medium">you</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="text-[10px] text-white/50 font-medium">feelings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#7DD3FC] shadow-[0_0_8px_rgba(125,211,252,0.5)]" />
          <span className="text-[10px] text-white/50 font-medium">topics</span>
        </div>
      </div>
    </GlassPanel>
  )
}

// ============================================
// SANKEY FLOW DIAGRAM
// ============================================
function SankeyFlow({ graph }) {
  const MAX_PER_TYPE = 6
  
  const allNodes = graph.nodes
  const emotions = allNodes.filter(n => n.type === 'state').slice(0, MAX_PER_TYPE)
  const issues = allNodes.filter(n => n.type === 'topic').slice(0, MAX_PER_TYPE)
  
  const edges = []
  for (const [key, weight] of graph.edges.entries()) {
    const [a, b] = key.split('__')
    const fromNode = emotions.find(n => n.id === a) || issues.find(n => n.id === a)
    const toNode = issues.find(n => n.id === b) || emotions.find(n => n.id === b)
    if (!fromNode || !toNode || weight < 1) continue
    // Ensure emotion -> issue direction
    const isEmotion = emotions.find(n => n.id === a)
    if (isEmotion) edges.push({ from: a, to: b, w: weight })
    else edges.push({ from: b, to: a, w: weight })
  }
  
  const w = 320, h = 240
  const leftX = 60, rightX = 260
  const nodeH = 24
  const gap = 8
  
  // Position emotions on left, issues on right
  const emotionY = {}
  const totalEmotionH = emotions.length * nodeH + (emotions.length - 1) * gap
  const emotionStartY = (h - totalEmotionH) / 2
  emotions.forEach((n, i) => { emotionY[n.id] = emotionStartY + i * (nodeH + gap) })
  
  const issueY = {}
  const totalIssueH = issues.length * nodeH + (issues.length - 1) * gap
  const issueStartY = (h - totalIssueH) / 2
  issues.forEach((n, i) => { issueY[n.id] = issueStartY + i * (nodeH + gap) })
  
  const maxWeight = Math.max(...edges.map(e => e.w), 1)

  // Emotion colors (orange shades)
  const emotionColors = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED']
  // Issue colors (baby blue shades)
  const issueColors = ['#7DD3FC', '#38BDF8', '#0EA5E9', '#0284C7', '#0369A1', '#075985']

  return (
    <GlassPanel className="p-4">
      {/* Title only at top */}
      <div className="text-[13px] font-semibold text-white/80">Mood Flow</div>
      <div className="text-[11px] text-white/40 mt-0.5">Feelings flow into what triggers them</div>
      
      <div className="relative mt-2 flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
          <defs>
            <filter id="sankeyDiffuse" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id="sankeyGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Gradients for flows - orange to baby blue */}
            {edges.map((e, i) => (
              <linearGradient key={i} id={`flow${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.5" />
              </linearGradient>
            ))}
          </defs>
          
          {/* Flow ribbons */}
          {edges.map((e, i) => {
            const y1 = emotionY[e.from]
            const y2 = issueY[e.to]
            if (y1 === undefined || y2 === undefined) return null
            
            const ribbonH = Math.max(3, (e.w / maxWeight) * 14)
            const cy1 = y1 + nodeH / 2
            const cy2 = y2 + nodeH / 2
            
            const d = `
              M ${leftX + 40} ${cy1 - ribbonH / 2}
              C ${(leftX + rightX) / 2} ${cy1 - ribbonH / 2}, ${(leftX + rightX) / 2} ${cy2 - ribbonH / 2}, ${rightX - 40} ${cy2 - ribbonH / 2}
              L ${rightX - 40} ${cy2 + ribbonH / 2}
              C ${(leftX + rightX) / 2} ${cy2 + ribbonH / 2}, ${(leftX + rightX) / 2} ${cy1 + ribbonH / 2}, ${leftX + 40} ${cy1 + ribbonH / 2}
              Z
            `
            return <path key={i} d={d} fill={`url(#flow${i})`} opacity={0.7} />
          })}
          
          {/* Emotion nodes (left) - Orange */}
          {emotions.map((n, i) => {
            const y = emotionY[n.id]
            const color = emotionColors[Math.min(i, emotionColors.length - 1)]
            return (
              <g key={n.id}>
                <rect x={leftX - 35} y={y} width={75} height={nodeH} rx={12} fill={color} opacity={0.3} filter="url(#sankeyGlow)" />
                <rect x={leftX - 35} y={y} width={75} height={nodeH} rx={12} fill={color} />
                <text x={leftX} y={y + nodeH / 2 + 3} textAnchor="middle" fontSize="9" fontWeight="500" fill="rgba(255,255,255,0.9)">{n.label}</text>
              </g>
            )
          })}
          
          {/* Issue nodes (right) - Baby blue */}
          {issues.map((n, i) => {
            const y = issueY[n.id]
            const color = issueColors[Math.min(i, issueColors.length - 1)]
            return (
              <g key={n.id}>
                <rect x={rightX - 35} y={y} width={70} height={nodeH} rx={12} fill={color} opacity={0.3} filter="url(#sankeyGlow)" />
                <rect x={rightX - 35} y={y} width={70} height={nodeH} rx={12} fill={color} />
                <text x={rightX} y={y + nodeH / 2 + 3} textAnchor="middle" fontSize="9" fontWeight="500" fill="rgba(255,255,255,0.9)">{n.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend at bottom - premium style */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="text-[10px] text-white/50 font-medium">feelings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#7DD3FC] shadow-[0_0_8px_rgba(125,211,252,0.5)]" />
          <span className="text-[10px] text-white/50 font-medium">topics</span>
        </div>
      </div>
    </GlassPanel>
  )
}

// ============================================
// MATRIX HEATMAP
// ============================================
function MatrixHeatmap({ graph }) {
  const MAX_PER_TYPE = 6
  
  const allNodes = graph.nodes
  const emotions = allNodes.filter(n => n.type === 'state').slice(0, MAX_PER_TYPE)
  const issues = allNodes.filter(n => n.type === 'topic').slice(0, MAX_PER_TYPE)
  
  // Build weight lookup
  const weightMap = new Map()
  for (const [key, weight] of graph.edges.entries()) {
    weightMap.set(key, weight)
  }
  
  const getWeight = (emotionId, issueId) => {
    return weightMap.get(`${emotionId}__${issueId}`) || weightMap.get(`${issueId}__${emotionId}`) || 0
  }
  
  const maxWeight = Math.max(...Array.from(graph.edges.values()), 1)
  
  const cellSize = 36
  const labelW = 65
  const labelH = 50
  const w = labelW + issues.length * cellSize + 10
  const h = labelH + emotions.length * cellSize + 10
  
  // Color scale: transparent -> coral -> orange
  const getColor = (weight) => {
    if (weight === 0) return 'rgba(255,255,255,0.03)'
    const t = weight / maxWeight
    const r = Math.round(255)
    const g = Math.round(180 - t * 60)
    const b = Math.round(136 - t * 50)
    return `rgba(${r},${g},${b},${0.3 + t * 0.6})`
  }

  return (
    <GlassPanel className="p-4">
      <div className="text-[13px] font-semibold text-white/80">Matrix heatmap</div>
      <div className="text-[11px] text-white/40 mt-0.5">Darker = stronger connection</div>
      
      <div className="relative mt-3 flex justify-center overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h, maxWidth: w }}>
          <defs>
            <filter id="matrixDiffuse" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          
          {/* Column headers (topics) */}
          {issues.map((issue, col) => (
            <text
              key={issue.id}
              x={labelW + col * cellSize + cellSize / 2}
              y={labelH - 8}
              textAnchor="middle"
              fontSize="8"
              fill="rgba(125,211,192,0.8)"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              transform={`rotate(-45, ${labelW + col * cellSize + cellSize / 2}, ${labelH - 8})`}
            >
              {issue.label.length > 8 ? issue.label.slice(0, 7) + '…' : issue.label}
            </text>
          ))}
          
          {/* Rows */}
          {emotions.map((emotion, row) => (
            <g key={emotion.id}>
              {/* Row label */}
              <text
                x={labelW - 6}
                y={labelH + row * cellSize + cellSize / 2 + 3}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255,176,136,0.8)"
              >
                {emotion.label.length > 9 ? emotion.label.slice(0, 8) + '…' : emotion.label}
              </text>
              
              {/* Cells */}
              {issues.map((issue, col) => {
                const weight = getWeight(emotion.id, issue.id)
                const color = getColor(weight)
                return (
                  <g key={`${emotion.id}-${issue.id}`}>
                    <rect
                      x={labelW + col * cellSize + 2}
                      y={labelH + row * cellSize + 2}
                      width={cellSize - 4}
                      height={cellSize - 4}
                      rx={6}
                      fill={color}
                      filter={weight > 0 ? 'url(#matrixDiffuse)' : undefined}
                    />
                    <rect
                      x={labelW + col * cellSize + 2}
                      y={labelH + row * cellSize + 2}
                      width={cellSize - 4}
                      height={cellSize - 4}
                      rx={6}
                      fill={color}
                    />
                    {weight > 0 && (
                      <text
                        x={labelW + col * cellSize + cellSize / 2}
                        y={labelH + row * cellSize + cellSize / 2 + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="500"
                        fill="rgba(255,255,255,0.7)"
                      >
                        {weight}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-[9px] text-white/40">weak</span>
        <div className="flex gap-0.5">
          {[0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
            <div key={i} className="w-4 h-2 rounded-sm" style={{ background: `rgba(255,${180 - t * 60},${136 - t * 50},${0.3 + t * 0.6})` }} />
          ))}
        </div>
        <span className="text-[9px] text-white/40">strong</span>
      </div>
    </GlassPanel>
  )
}

// ============================================
// TOPOLOGY COMPARISON
// ============================================
function GraphViz({ graph }) {
  return (
    <div className="space-y-4">
      <RadialConstellation graph={graph} />
      <SankeyFlow graph={graph} />
    </div>
  )
}

// ============================================
// SESSION HISTORY WITH PAGINATION
// ============================================

// Get mood label from position
function getMoodLabel(pos) {
  if (!pos) return 'neutral'
  const x = pos.x ?? 0.5
  const y = pos.y ?? 0.5
  
  // Quadrant-based mood labels
  // Top-left: Anxious (low x, low y)
  // Top-right: Angry (high x, low y)
  // Bottom-left: Depressed (low x, high y)
  // Bottom-right: Contented (high x, high y)
  
  if (x < 0.35 && y < 0.35) return 'anxious'
  if (x > 0.65 && y < 0.35) return 'angry'
  if (x < 0.35 && y > 0.65) return 'low'
  if (x > 0.65 && y > 0.65) return 'contented'
  if (x < 0.35) return 'tense'
  if (x > 0.65) return 'energized'
  if (y < 0.35) return 'stressed'
  if (y > 0.65) return 'calm'
  return 'balanced'
}

// Get mood shift description
function getMoodShift(beforePos, afterPos) {
  const before = getMoodLabel(beforePos)
  const after = getMoodLabel(afterPos)
  
  if (before === after) {
    return `${before} → maintained`
  }
  
  // Calculate improvement
  const beforeScore = (beforePos?.x ?? 0.5) + (1 - (beforePos?.y ?? 0.5))
  const afterScore = (afterPos?.x ?? 0.5) + (1 - (afterPos?.y ?? 0.5))
  
  if (afterScore > beforeScore + 0.2) {
    return `${before} → ${after} ✓`
  }
  
  return `${before} → ${after}`
}

function SessionHistory({ entries }) {
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)
  const COLLAPSED_COUNT = 3
  const EXPANDED_COUNT = 10
  
  const displayCount = expanded ? EXPANDED_COUNT : COLLAPSED_COUNT
  const totalPages = Math.ceil(entries.length / EXPANDED_COUNT)
  
  const visibleEntries = useMemo(() => {
    if (!expanded) {
      return entries.slice(0, COLLAPSED_COUNT)
    }
    const start = page * EXPANDED_COUNT
    return entries.slice(start, start + EXPANDED_COUNT)
  }, [entries, expanded, page])
  
  const currentRange = useMemo(() => {
    if (!expanded) return null
    const start = page * EXPANDED_COUNT + 1
    const end = Math.min((page + 1) * EXPANDED_COUNT, entries.length)
    return { start, end, total: entries.length }
  }, [expanded, page, entries.length])

  if (!entries.length) {
    return (
      <GlassPanel className="mt-4">
        <div className="text-[14px] font-semibold text-white/80">Session history</div>
        <div className="pt-2 text-[13px] text-white/55">
          No sessions yet—complete one ritual to see your history.
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-white/80">Session history</div>
        <div className="text-[12px] text-white/55">{entries.length} total</div>
      </div>
      
      <div className="mt-4 space-y-3">
        {visibleEntries.map((e) => {
          const moodShift = getMoodShift(e.beforePos, e.afterPos)
          const hasImproved = moodShift.includes('✓')
          const fromColor = e.beforeColor ?? '#666'
          const toColor = e.afterColor ?? '#666'
          
          return (
            <div 
              key={e.id} 
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background: `linear-gradient(135deg, ${fromColor}30, ${toColor}30)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px ${fromColor}15`,
              }}
            >
              {/* Gradient glow overlay */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${fromColor}40 0%, transparent 30%, transparent 70%, ${toColor}40 100%)`,
                }}
              />
              
              {/* Glass border */}
              <div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  border: `1px solid rgba(255,255,255,0.08)`,
                }}
              />
              
              <div className="relative flex items-center gap-3">
                {/* Color transition indicator */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div 
                    className="h-6 w-6 rounded-full border-2 border-white/20" 
                    style={{ background: fromColor }}
                  />
                  <svg width="14" height="14" viewBox="0 0 14 14" className="text-white/40">
                    <path d="M3 7h6M7 4.5l2.5 2.5-2.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div 
                    className="h-6 w-6 rounded-full border-2 border-white/20" 
                    style={{ background: toColor }}
                  />
                </div>
                
                {/* Session details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-medium text-white">
                      {safeDateLabel(e.at)}
                    </div>
                    {hasImproved && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 font-medium">
                        ↑ improved
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5 text-white/70">
                    {moodShift.replace(' ✓', '')}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Expand/Collapse button */}
      {entries.length > COLLAPSED_COUNT && !expanded && (
        <button
          onClick={() => { setExpanded(true); setPage(0) }}
          className="mt-3 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[12px] text-white/60 hover:text-white/80 transition-all flex items-center justify-center gap-1"
        >
          <span>Show more</span>
          <svg width="12" height="12" viewBox="0 0 12 12" className="mt-0.5">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      {/* Pagination controls */}
      {expanded && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-[11px] text-white/70 hover:bg-white/15 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M7.5 9l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Newer
          </button>
          
          <div className="text-[11px] text-white/50">
            {currentRange && `${currentRange.start}-${currentRange.end} of ${currentRange.total}`}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-[11px] text-white/70 hover:bg-white/15 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Older
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Collapse button */}
      {expanded && (
        <button
          onClick={() => { setExpanded(false); setPage(0) }}
          className="mt-2 w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[12px] text-white/60 hover:text-white/80 transition-all flex items-center justify-center gap-1"
        >
          <span>Show less</span>
          <svg width="12" height="12" viewBox="0 0 12 12" className="rotate-180">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </GlassPanel>
  )
}

function MoodMapHistory({ entries }) {
  const [timeRange, setTimeRange] = useState('7d') // '7d', '2w', '1m'
  const w = 320
  const h = 320
  const pad = 18
  const MAX_LINES = 10

  const toXY = (p) => ({
    x: pad + (p?.x ?? 0.5) * (w - pad * 2),
    y: pad + (p?.y ?? 0.5) * (h - pad * 2),
  })

  // Filter entries by time range
  const filteredEntries = useMemo(() => {
    const now = new Date()
    const cutoff = new Date()
    
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7)
    else if (timeRange === '2w') cutoff.setDate(now.getDate() - 14)
    else cutoff.setMonth(now.getMonth() - 1)
    
    return entries.filter(e => {
      try {
        return new Date(e.at) >= cutoff
      } catch {
        return false
      }
    })
  }, [entries, timeRange])

  // Aggregate if too many entries (max 10 lines)
  const displayEntries = useMemo(() => {
    if (filteredEntries.length <= MAX_LINES) return filteredEntries
    
    // Sample evenly across the filtered entries
    const step = Math.ceil(filteredEntries.length / MAX_LINES)
    const sampled = []
    for (let i = 0; i < filteredEntries.length && sampled.length < MAX_LINES; i += step) {
      sampled.push(filteredEntries[i])
    }
    return sampled
  }, [filteredEntries])

  const latest = displayEntries?.[0]
  const bgA = latest?.beforeColor ?? '#FF9408'
  const bgB = latest?.afterColor ?? '#29D38B'

  const timeRangeOptions = [
    { value: '7d', label: '7 days' },
    { value: '2w', label: '2 weeks' },
    { value: '1m', label: '1 month' },
  ]

  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-white/80">Map Shifts</div>
        {/* Time range toggle */}
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
          {timeRangeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                timeRange === opt.value 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-1 text-[12px] text-white/55">
        {filteredEntries.length} sessions • Arrows show movement direction
      </div>

      <div
        className="relative mt-3 h-[320px] w-full overflow-hidden rounded-[22px] border border-white/10 backdrop-blur-xl"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Subtle glass reflection at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.03] to-transparent" />

        <svg viewBox={`0 0 ${w} ${h}`} className="relative h-[320px] w-full">
          <defs>
            <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Arrow marker for direction */}
            <marker
              id="arrowHead"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.6)" />
            </marker>
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

          {displayEntries.map((e, idx) => {
            const a = toXY(e.beforePos)
            const b = toXY(e.afterPos)
            const gId = `g_${idx}`
            const alpha = Math.max(0.25, 0.7 - idx * 0.05)
            const strokeW = idx === 0 ? 3 : 2
            const dashClass = idx === 0 ? 'exhale-track-draw' : ''
            
            // Calculate arrow position (70% along the line)
            const arrowT = 0.7
            const arrowX = a.x + (b.x - a.x) * arrowT
            const arrowY = a.y + (b.y - a.y) * arrowT
            
            // Calculate angle for the arrow
            const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
            
            // Calculate line length to avoid showing arrow on very short lines
            const lineLength = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)

            return (
              <g key={e.id} filter="url(#glow)">
                <defs>
                  <linearGradient id={gId} x1={a.x} y1={a.y} x2={b.x} y2={b.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={e.beforeColor ?? '#FF9408'} stopOpacity={alpha} />
                    <stop offset="100%" stopColor={e.afterColor ?? '#29D38B'} stopOpacity={alpha} />
                  </linearGradient>
                </defs>

                {/* Main line */}
                <path
                  d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                  stroke={`url(#${gId})`}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  className={dashClass}
                  fill="none"
                />

                {/* Subtle arrow indicator (only if line is long enough) */}
                {lineLength > 20 && (
                  <g transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}>
                    <path
                      d="M-4,-3 L2,0 L-4,3"
                      fill="none"
                      stroke={`rgba(255,255,255,${alpha * 0.8})`}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}

                {/* start point */}
                <circle cx={a.x} cy={a.y} r={idx === 0 ? 5 : 4} fill={e.beforeColor ?? '#222'} opacity="0.9" />
                {/* end point */}
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={idx === 0 ? 5 : 4}
                  fill={e.afterColor ?? '#222'}
                  opacity="0.9"
                  className={idx === 0 ? 'exhale-node-pulse' : ''}
                />
              </g>
            )
          })}
        </svg>
      </div>
      
      {/* Legend */}
      {filteredEntries.length > MAX_LINES && (
        <div className="mt-2 text-center text-[10px] text-white/40">
          Showing {displayEntries.length} of {filteredEntries.length} sessions
        </div>
      )}
    </GlassPanel>
  )
}

export function SmartAnalysis({ embedded = false }) {
  const history = loadHistory()
  const recent = history.slice(0, 21)

  const graph = useMemo(() => buildGraph(history), [history])

  // When embedded, render without outer container (used in HomePage)
  if (embedded) {
    return (
      <>
        {/* Section Header */}
        <div className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-3 mt-2">
          Smart Analysis
        </div>
        
        {/* Mood Trend */}
        <div className="mb-4">
          <EmotionalTrend entries={recent} />
        </div>

        {/* Mood Map Shifts */}
        <div className="mb-4">
          <MoodMapHistory entries={recent} />
        </div>

        {/* Topology */}
        <div className="mb-4">
          <GraphViz graph={graph} />
        </div>

        {/* Your Top Rituals */}
        <div className="mb-4">
          <TopRituals entries={recent} />
        </div>

        {/* Weekly Patterns */}
        <div className="mb-4">
          <WeeklyPatterns entries={history} />
        </div>

        {/* Emotional Rhythm */}
        <div className="mb-4">
          <TimeOfDayPatterns entries={history} />
        </div>

        {/* Monthly Mood Calendar */}
        <div className="mb-4">
          <MonthlyCalendar entries={history} />
        </div>

        {/* Session History */}
        <div className="mb-4">
          <SessionHistory entries={history} />
        </div>
      </>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-28 pt-5 text-white">
      <div className="text-[15px] leading-relaxed text-white/65">
        Color‑tracked feelings + pattern recognition from what you share.
      </div>

      {/* 1. Mood Trend */}
      <div className="mt-4">
        <EmotionalTrend entries={recent} />
      </div>

      {/* 2. Mood Map Shifts */}
      <div className="mt-4">
        <MoodMapHistory entries={recent} />
      </div>

      {/* 3. Topology */}
      <div className="mt-5">
        <GraphViz graph={graph} />
      </div>

      {/* 4. Your Top Rituals */}
      <div className="mt-5">
        <TopRituals entries={recent} />
      </div>

      {/* 5. Weekly Patterns */}
      <div className="mt-5">
        <WeeklyPatterns entries={history} />
      </div>

      {/* 6. Emotional Rhythm */}
      <div className="mt-5">
        <TimeOfDayPatterns entries={history} />
      </div>

      {/* 7. Monthly Mood Calendar */}
      <div className="mt-5">
        <MonthlyCalendar entries={history} />
      </div>

      {/* Session History with Pagination */}
      <div className="mt-5">
        <SessionHistory entries={history} />
      </div>
    </div>
  )
}

