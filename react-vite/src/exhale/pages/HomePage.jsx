import { useState, useEffect, useMemo } from 'react'
import { SmartAnalysis } from './SmartAnalysis.jsx'

// Glass card component
function GlassCard({ children, className = '', gradient = false }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl ${gradient ? 'bg-gradient-to-br from-white/5 to-transparent' : ''} ${className}`}>
      {children}
    </div>
  )
}

function formatDate(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
}

// Get weekly streak data
function getWeeklyStreakData() {
  try {
    const stored = localStorage.getItem('exhale-weekly-streak')
    if (stored) {
      const data = JSON.parse(stored)
      const currentWeekStart = getWeekStart(new Date())
      
      // Reset if new week
      if (data.weekStart !== currentWeekStart) {
        return { days: [], weekStart: currentWeekStart }
      }
      return data
    }
  } catch {}
  return { days: [], weekStart: getWeekStart(new Date()) }
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
  d.setDate(diff)
  return d.toDateString()
}

function getDayOfWeek() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1 // Convert to 0=Mon, 6=Sun
}

function updateWeeklyStreak() {
  const data = getWeeklyStreakData()
  const today = getDayOfWeek()
  
  if (!data.days.includes(today)) {
    data.days.push(today)
    localStorage.setItem('exhale-weekly-streak', JSON.stringify(data))
  }
  return data
}

function getUserName() {
  try {
    return localStorage.getItem('exhale-username') || 'Friend'
  } catch {
    return 'Friend'
  }
}

function setUserName(name) {
  try {
    localStorage.setItem('exhale-username', name)
  } catch {}
}

function getTopRituals() {
  try {
    const history = JSON.parse(localStorage.getItem('exhale-session-history') || '[]')
    const ritualCounts = {}
    
    history.forEach(session => {
      if (session.ritual) {
        session.ritual.forEach(r => {
          ritualCounts[r.label] = (ritualCounts[r.label] || 0) + 1
        })
      }
    })
    
    return Object.entries(ritualCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))
  } catch {
    return []
  }
}

function getSessionHistory() {
  try {
    return JSON.parse(localStorage.getItem('exhale-session-history') || '[]')
  } catch {
    return []
  }
}

/**
 * AI-powered contextual message based on user's historical patterns
 * Analyzes check-in times and moods to generate personalized insights
 * 
 * Pattern thresholds:
 * - 0 sessions: Generic welcome message
 * - 1-2 sessions: Time-of-day aware message
 * - 3+ sessions at similar time: Pattern-based personalized message
 */
function getContextualMessage(userName) {
  try {
    const history = JSON.parse(localStorage.getItem('exhale-session-history') || '[]')
    const now = new Date()
    const currentHour = now.getHours()
    
    // Define time periods
    const getTimePeriod = (hour) => {
      if (hour >= 5 && hour < 9) return 'early-morning'
      if (hour >= 9 && hour < 12) return 'morning'
      if (hour >= 12 && hour < 14) return 'midday'
      if (hour >= 14 && hour < 17) return 'afternoon'
      if (hour >= 17 && hour < 20) return 'evening'
      if (hour >= 20 && hour < 23) return 'night'
      return 'late-night'
    }
    
    const currentPeriod = getTimePeriod(currentHour)
    
    // Time-based messages for when we don't have patterns yet
    const timeAwareMessages = {
      'early-morning': "Starting the day early. What's on your mind this morning?",
      'morning': "Good morning. How are you feeling as the day begins?",
      'midday': "Midday pause. How's your energy holding up?",
      'afternoon': "Afternoon check-in. How are you navigating the day?",
      'evening': "Evening wind-down. What's been weighing on you today?",
      'night': "Winding down for the night. How are you feeling?",
      'late-night': "Late night thoughts. What's on your mind?",
    }
    
    // Generic messages for brand new users (0 sessions)
    const genericMessages = [
      "Take a moment to check in with yourself. How are you feeling?",
      "Your mind matters. What's going on inside today?",
      "A moment of reflection can change everything. How are you?",
      "Let's take a breath together. What's present for you right now?",
    ]
    
    // No history at all - show generic welcome
    if (history.length === 0) {
      const randomIndex = Math.floor(Math.random() * genericMessages.length)
      return genericMessages[randomIndex]
    }
    
    // 1-2 sessions - show time-aware message, building trust
    if (history.length < 3) {
      return timeAwareMessages[currentPeriod]
    }
    
    // 3+ sessions - analyze patterns and calculate numerical insights
    
    // Calculate mood improvement from before/after data
    let sessionsWithImprovement = 0
    let avgMoodBefore = 0
    let avgMoodAfter = 0
    let sessionsWithMoodData = 0
    
    history.forEach(entry => {
      const moodBefore = entry.analysis?.moodBefore
      const moodAfter = entry.moodAfter
      
      if (typeof moodBefore === 'number' && typeof moodAfter === 'number') {
        sessionsWithMoodData++
        avgMoodBefore += moodBefore
        avgMoodAfter += moodAfter
        
        if (moodAfter > moodBefore) {
          sessionsWithImprovement++
        }
      }
    })
    
    // Calculate averages and improvement percentage
    if (sessionsWithMoodData > 0) {
      avgMoodBefore = avgMoodBefore / sessionsWithMoodData
      avgMoodAfter = avgMoodAfter / sessionsWithMoodData
    }
    
    const avgImprovement = sessionsWithMoodData > 0 ? (avgMoodAfter - avgMoodBefore) : 0
    const improvementPercent = Math.round(Math.abs(avgImprovement) * 50) // Convert to 0-100% scale
    const improvementRate = sessionsWithMoodData > 0 ? Math.round((sessionsWithImprovement / sessionsWithMoodData) * 100) : 0
    
    // Build message with numerical insights if we have enough data (5+ sessions)
    if (sessionsWithMoodData >= 5) {
      if (improvementPercent >= 15 && avgImprovement > 0) {
        return `You're ${improvementPercent}% calmer after your rituals. ${history.length} sessions and counting.`
      }
      if (improvementRate >= 70) {
        return `${improvementRate}% of your sessions leave you feeling better. Your practice is working.`
      }
    }
    
    // Moderate data (3-4 sessions) - softer numerical message
    if (sessionsWithMoodData >= 3 && sessionsWithImprovement >= 2) {
      return `${sessionsWithImprovement} out of ${sessionsWithMoodData} sessions improved your mood. Keep going.`
    }
    
    // Get entries at similar time for pattern analysis
    const similarTimeEntries = history.filter(entry => {
      if (!entry.at) return false
      const entryHour = new Date(entry.at).getHours()
      return getTimePeriod(entryHour) === currentPeriod
    })
    
    // Count mood patterns at this time
    const moodCounts = {}
    
    similarTimeEntries.forEach(entry => {
      const state = entry.analysis?.state
      if (state) {
        moodCounts[state] = (moodCounts[state] || 0) + 1
      }
    })
    
    // Find most common mood
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    
    const timeLabels = {
      'early-morning': 'early mornings',
      'morning': 'mornings',
      'midday': 'around midday',
      'afternoon': 'afternoons',
      'evening': 'evenings',
      'night': 'at night',
      'late-night': 'late at night',
    }
    
    const moodDescriptions = {
      'downshift': 'overwhelmed',
      'upshift': 'energized',
      'gentle': 'reflective',
      'steady': 'balanced',
      'anxious': 'anxious',
      'stressed': 'stressed',
      'tired': 'tired',
      'scattered': 'scattered',
      'low': 'low',
      'wired': 'wired',
    }
    
    const timeLabel = timeLabels[currentPeriod] || 'at this time'
    
    // Pattern-based message with time context
    if (similarTimeEntries.length >= 2 && dominantMood) {
      const dominantCount = moodCounts[dominantMood]
      const patternStrength = dominantCount / similarTimeEntries.length
      
      if (patternStrength >= 0.5) {
        const feeling = moodDescriptions[dominantMood] || 'reflective'
        return `${timeLabel.charAt(0).toUpperCase() + timeLabel.slice(1)}, you usually feel ${feeling}. How's today?`
      }
    }
    
    // Fallback to session count insight
    if (history.length >= 5) {
      return `${history.length} check-ins. You're building a powerful habit.`
    }
    
    // Fallback to time-aware message
    return timeAwareMessages[currentPeriod]
    
  } catch (e) {
    console.warn('Error generating contextual message:', e)
    // Always return something
    return "Take a moment to check in with yourself. How are you feeling?"
  }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function HomePage({ onNavigate, onStartRitual }) {
  const [userName, setUserNameState] = useState(getUserName())
  const [isEditingName, setIsEditingName] = useState(false)
  const [streakData, setStreakData] = useState({ days: [], weekStart: '' })
  const [topRituals, setTopRituals] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [contextualMessage, setContextualMessage] = useState(null)
  
  const todayIndex = getDayOfWeek()
  const completedDays = streakData.days.length
  
  useEffect(() => {
    const data = updateWeeklyStreak()
    setStreakData(data)
    setTopRituals(getTopRituals())
    
    // Generate AI contextual message based on user patterns
    const message = getContextualMessage(userName)
    setContextualMessage(message)
    
    // Update date every minute
    const interval = setInterval(() => setCurrentDate(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])
  
  const handleNameSubmit = (e) => {
    e.preventDefault()
    setIsEditingName(false)
    setUserName(userName)
  }
  
  // Brand colors
  const brandOrange = '#F97316'
  const brandGreen = '#22C55E'
  const brandPurple = '#8B5CF6'
  const brandBlue = '#7DD3FC' // Baby blue
  
  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-10 pt-6">
      {/* Header - Logo */}
      <div className="flex items-center mb-4">
        {/* RiteSet Logo with diamond */}
        <div className="flex items-center gap-1">
          <span 
            className="text-white font-medium lowercase"
            style={{
              fontSize: '18px',
              fontFamily: '"SF Pro Rounded", "Nunito", -apple-system, system-ui, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            riteset
          </span>
          {/* Diamond sparkle */}
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="white"
            className="opacity-80"
          >
            <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
          </svg>
        </div>
      </div>
      
      {/* Date Pill */}
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span className="text-[12px] font-medium text-white/70">
          {formatDate(currentDate)}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="opacity-40">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      
      {/* Welcome Message */}
      <div className="mb-6">
        {isEditingName ? (
          <form onSubmit={handleNameSubmit} className="flex items-center gap-2">
            <span className="text-[15px] text-white/50">Welcome back, </span>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserNameState(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-[15px] text-white outline-none focus:border-orange-500/50 backdrop-blur-xl"
              autoFocus
              onBlur={handleNameSubmit}
            />
          </form>
        ) : (
          <button 
            onClick={() => setIsEditingName(true)}
            className="text-left group"
          >
            <span className="text-[15px] text-white/50">
              Welcome back, <span className="text-white/80 font-medium">{userName}</span>
            </span>
          </button>
        )}
        
        {/* AI-powered contextual insight - always shows */}
        <p 
          className="mt-2 text-[13px] leading-relaxed text-white/70"
        >
          {contextualMessage || "Take a moment to check in with yourself. How are you feeling?"}
        </p>
      </div>
      
      {/* Weekly Streak Card */}
      <GlassCard className="mb-5 p-5" gradient>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[14px] font-medium text-white/80">Weekly Streak</div>
            <div className="text-[11px] text-white/40 mt-0.5">Keep the momentum going</div>
          </div>
          <div className="text-[13px] font-semibold" style={{ color: brandBlue }}>
            {completedDays}/7 days
          </div>
        </div>
        
        {/* 7 Day Circles */}
        <div className="flex items-center justify-between">
          {DAYS.map((day, idx) => {
            const isCompleted = streakData.days.includes(idx)
            const isToday = idx === todayIndex
            
            return (
              <div key={day} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'border-2' 
                      : isToday 
                        ? 'border border-dashed border-white/30' 
                        : 'border border-white/10'
                  }`}
                  style={isCompleted ? {
                    borderColor: brandBlue,
                    background: `radial-gradient(circle at center, ${brandBlue}30, transparent 70%)`,
                    boxShadow: `0 0 20px ${brandBlue}40`
                  } : {}}
                >
                  {isCompleted && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brandBlue} strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${
                  isCompleted ? 'text-white/80' : isToday ? 'text-white/60' : 'text-white/30'
                }`}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
      </GlassCard>
      
      {/* Top Rituals */}
      {topRituals.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2.5">Your Top Rituals</div>
          <GlassCard className="divide-y divide-white/5">
            {topRituals.map((ritual, idx) => (
              <div 
                key={ritual.name}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white/80"
                    style={{ 
                      background: idx === 0 ? `linear-gradient(135deg, ${brandOrange}40, ${brandOrange}20)` :
                                 idx === 1 ? `linear-gradient(135deg, ${brandPurple}40, ${brandPurple}20)` :
                                 `linear-gradient(135deg, ${brandGreen}40, ${brandGreen}20)`,
                      border: `1px solid ${idx === 0 ? brandOrange : idx === 1 ? brandPurple : brandGreen}30`
                    }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[13px] font-medium text-white/80">{ritual.name}</span>
                </div>
                <span className="text-[11px] text-white/30">{ritual.count}x</span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}
      
      {/* Start Ritual Button - Premium glass chrome effect */}
      <button
        onClick={() => onStartRitual?.()}
        className="w-full mb-5 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] relative overflow-hidden group backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(125,211,252,0.25) 0%, rgba(56,189,248,0.15) 50%, rgba(125,211,252,0.2) 100%)',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.1) inset,
            0 1px 0 rgba(255,255,255,0.3) inset,
            0 -1px 0 rgba(0,0,0,0.1) inset,
            0 8px 32px rgba(56,189,248,0.2),
            0 2px 8px rgba(0,0,0,0.3)
          `,
        }}
      >
        {/* Top chrome highlight */}
        <div 
          className="absolute top-0 left-4 right-4 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          }}
        />
        {/* Glass reflection */}
        <div 
          className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
          }}
        />
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        {/* Inner glow */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(125,211,252,0.3) 0%, transparent 60%)',
          }}
        />
        <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Start Today's Ritual</span>
      </button>
      
      {/* Smart Analysis Section - inline */}
      <SmartAnalysis embedded />
    </div>
  )
}
