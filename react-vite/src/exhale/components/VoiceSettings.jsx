import { useState, useEffect, useMemo } from 'react'
import {
  VOICE_GENDERS,
  VOICE_TONES,
  getVoicePreference,
  setVoicePreference,
  speakPreview,
  isVoiceSupported,
  initVoice,
  stopSpeaking,
} from '../../ritual/voiceEngine.js'
import { GlassPanel } from './GlassPanel.jsx'
import { loadHistory } from '../../ritual/storage.js'

// ============================================
// AMBIENT SOUNDS CONFIG
// ============================================
const AMBIENT_SOUNDS = [
  { id: 'rain', label: 'Rain', icon: '🌧️', description: 'Gentle rainfall' },
  { id: 'ocean', label: 'Ocean Waves', icon: '🌊', description: 'Calming sea sounds' },
  { id: 'forest', label: 'Forest', icon: '🌲', description: 'Birds and rustling leaves' },
  { id: 'fire', label: 'Fireplace', icon: '🔥', description: 'Crackling fire' },
  { id: 'wind', label: 'Wind', icon: '💨', description: 'Gentle breeze' },
  { id: 'thunder', label: 'Thunderstorm', icon: '⛈️', description: 'Distant thunder' },
  { id: 'stream', label: 'Stream', icon: '🏞️', description: 'Flowing water' },
  { id: 'night', label: 'Night', icon: '🌙', description: 'Crickets and calm' },
  { id: 'lofi', label: 'Lo-fi Drone', icon: '🎧', description: 'Ambient low hum' },
  { id: 'silence', label: 'Silence', icon: '🔇', description: 'No ambient sound' },
]

// ============================================
// RITUAL LENGTH OPTIONS
// ============================================
const RITUAL_LENGTHS = [
  { id: 5, label: '5 min', description: 'Quick reset' },
  { id: 10, label: '10 min', description: 'Balanced session' },
  { id: 20, label: '20 min', description: 'Deep ritual' },
]

// ============================================
// STORAGE HELPERS
// ============================================
function getAmbientPreferences() {
  try {
    const stored = localStorage.getItem('exhale_ambient_prefs')
    if (stored) return JSON.parse(stored)
  } catch {}
  // Default: rain and ocean enabled
  return { rain: true, ocean: true, forest: false, fire: false, wind: false, thunder: false, stream: false, night: false, lofi: false, silence: false }
}

function setAmbientPreferences(prefs) {
  try {
    localStorage.setItem('exhale_ambient_prefs', JSON.stringify(prefs))
  } catch {}
}

function getRitualLength() {
  try {
    const stored = localStorage.getItem('exhale_ritual_length')
    if (stored) return parseInt(stored, 10)
  } catch {}
  return 10 // Default 10 minutes
}

function setRitualLengthPref(mins) {
  try {
    localStorage.setItem('exhale_ritual_length', String(mins))
  } catch {}
}

function getSmartReminderSettings() {
  try {
    const stored = localStorage.getItem('exhale_smart_reminder')
    if (stored) return JSON.parse(stored)
  } catch {}
  return { enabled: false, optimalTime: null, notificationsAllowed: false }
}

function setSmartReminderSettings(settings) {
  try {
    localStorage.setItem('exhale_smart_reminder', JSON.stringify(settings))
  } catch {}
}

// ============================================
// SMART REMINDER ANALYSIS
// ============================================
function analyzeOptimalTime(history) {
  if (!history || history.length < 3) return null
  
  // Count check-ins by hour
  const hourCounts = {}
  for (const entry of history) {
    try {
      const hour = new Date(entry.at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    } catch {}
  }
  
  // Find the most common hour
  let maxHour = null
  let maxCount = 0
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count
      maxHour = parseInt(hour, 10)
    }
  }
  
  if (maxHour === null) return null
  
  // Format as readable time
  const ampm = maxHour >= 12 ? 'PM' : 'AM'
  const hour12 = maxHour % 12 || 12
  return { hour: maxHour, label: `${hour12}:00 ${ampm}`, count: maxCount }
}

// Tab configuration
const SETTINGS_TABS = [
  { id: 'voice', label: 'Voice', icon: '🎙️' },
  { id: 'sounds', label: 'Sounds', icon: '🎧' },
  { id: 'ritual', label: 'Ritual', icon: '⏱️' },
  { id: 'reminders', label: 'Reminders', icon: '🔔' },
]

export function VoiceSettings() {
  const [activeTab, setActiveTab] = useState('voice')
  const [gender, setGender] = useState('female')
  const [toneId, setToneId] = useState('calm')
  const [supported, setSupported] = useState(true)
  const [previewing, setPreviewing] = useState(false)
  
  // New settings state
  const [ambientPrefs, setAmbientPrefsState] = useState(getAmbientPreferences())
  const [ritualLength, setRitualLengthState] = useState(getRitualLength())
  const [reminderSettings, setReminderSettingsState] = useState(getSmartReminderSettings())
  const [notificationStatus, setNotificationStatus] = useState('default')

  // Analyze optimal reminder time
  const optimalTime = useMemo(() => {
    const history = loadHistory()
    return analyzeOptimalTime(history)
  }, [])

  useEffect(() => {
    setSupported(isVoiceSupported())
    initVoice()
    
    const pref = getVoicePreference()
    setGender(pref.gender)
    setToneId(pref.toneId)
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
  }, [])

  const handleGenderChange = (newGender) => {
    setGender(newGender)
    setVoicePreference(newGender, toneId)
  }

  const handleToneChange = (newToneId) => {
    setToneId(newToneId)
    setVoicePreference(gender, newToneId)
  }

  const handlePreview = async () => {
    if (previewing) {
      stopSpeaking()
      setPreviewing(false)
      return
    }
    
    setPreviewing(true)
    setVoicePreference(gender, toneId)
    
    await speakPreview(gender, toneId)
    
    setPreviewing(false)
  }

  // Ambient sound toggle
  const handleAmbientToggle = (soundId) => {
    const newPrefs = { ...ambientPrefs, [soundId]: !ambientPrefs[soundId] }
    setAmbientPrefsState(newPrefs)
    setAmbientPreferences(newPrefs)
  }

  // Ritual length change
  const handleRitualLengthChange = (mins) => {
    setRitualLengthState(mins)
    setRitualLengthPref(mins)
  }

  // Smart reminder toggle
  const handleReminderToggle = async () => {
    if (!reminderSettings.enabled) {
      // Enabling - request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        setNotificationStatus(permission)
        if (permission !== 'granted') return
      }
      
      const newSettings = { 
        enabled: true, 
        optimalTime: optimalTime?.hour ?? 9,
        notificationsAllowed: Notification.permission === 'granted'
      }
      setReminderSettingsState(newSettings)
      setSmartReminderSettings(newSettings)
    } else {
      // Disabling
      const newSettings = { ...reminderSettings, enabled: false }
      setReminderSettingsState(newSettings)
      setSmartReminderSettings(newSettings)
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5',
              ].join(' ')}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ============================================ */}
      {/* VOICE TAB */}
      {/* ============================================ */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          {!supported ? (
            <GlassPanel>
              <div className="text-[15px] font-semibold text-white">Voice not supported</div>
              <div className="pt-2 text-[13px] text-white/60">
                Try Chrome or Safari for voice guidance.
              </div>
            </GlassPanel>
          ) : (
            <>
              {/* Gender Selection */}
              <div>
                <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-white/40">
                  Voice Type
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {VOICE_GENDERS.map((g) => {
                    const isSelected = gender === g.id
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleGenderChange(g.id)}
                        className={[
                          'relative flex items-center justify-center gap-2 rounded-2xl border py-4 transition-all duration-200',
                          isSelected
                            ? 'border-white/30 bg-white/15'
                            : 'border-white/10 bg-white/5 hover:border-white/20',
                        ].join(' ')}
                      >
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                            <svg className="h-2.5 w-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <span className="text-xl">{g.icon}</span>
                        <span className="text-[14px] font-semibold text-white">{g.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-white/40">
                  Tone & Style
                </div>
                <div className="space-y-2">
                  {VOICE_TONES.map((tone) => {
                    const isSelected = toneId === tone.id
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => handleToneChange(tone.id)}
                        className={[
                          'relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200',
                          isSelected
                            ? 'border-white/30 bg-white/15'
                            : 'border-white/10 bg-white/5 hover:border-white/20',
                        ].join(' ')}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl">
                          {tone.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-semibold text-white">{tone.label}</div>
                          <div className="text-[11px] text-white/50">{tone.description}</div>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                            <svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Preview Button */}
              <button
                type="button"
                onClick={handlePreview}
                className={[
                  'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all duration-200',
                  previewing
                    ? 'bg-white text-black'
                    : 'bg-white/15 text-white hover:bg-white/20',
                ].join(' ')}
              >
                {previewing ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black/40"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-black"></span>
                    </span>
                    Speaking...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Preview Voice
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SOUNDS TAB */}
      {/* ============================================ */}
      {activeTab === 'sounds' && (
        <div className="space-y-3">
          <div className="text-[12px] text-white/50">
            Choose which ambient sounds can play during your rituals
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AMBIENT_SOUNDS.map((sound) => {
              const isEnabled = ambientPrefs[sound.id]
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleAmbientToggle(sound.id)}
                  className={[
                    'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200',
                    isEnabled
                      ? 'border-white/25 bg-white/12'
                      : 'border-white/8 bg-white/4 opacity-50 hover:opacity-70',
                  ].join(' ')}
                >
                  <span className="text-lg">{sound.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-white">{sound.label}</div>
                  </div>
                  <div className={[
                    'h-5 w-8 rounded-full transition-all duration-200 flex items-center',
                    isEnabled ? 'bg-green-500' : 'bg-white/20',
                  ].join(' ')}>
                    <div className={[
                      'h-3.5 w-3.5 rounded-full bg-white shadow transition-all duration-200',
                      isEnabled ? 'translate-x-3.5' : 'translate-x-0.5',
                    ].join(' ')} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RITUAL TAB */}
      {/* ============================================ */}
      {activeTab === 'ritual' && (
        <div className="space-y-4">
          <div>
            <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-white/40">
              Session Duration
            </div>
            <div className="grid grid-cols-3 gap-3">
              {RITUAL_LENGTHS.map((option) => {
                const isSelected = ritualLength === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleRitualLengthChange(option.id)}
                    className={[
                      'relative flex flex-col items-center justify-center gap-1 rounded-2xl border py-5 transition-all duration-200',
                      isSelected
                        ? 'border-white/30 bg-white/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20',
                    ].join(' ')}
                  >
                    <span className="text-[20px] font-bold text-white">{option.label}</span>
                    <span className="text-[11px] text-white/50">{option.description}</span>
                    {isSelected && (
                      <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white">
                        <svg className="h-2.5 w-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <GlassPanel>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm">
                💡
              </div>
              <div className="text-[12px] leading-relaxed text-white/60">
                Your next ritual will be composed to fit this duration. Longer sessions include more variety.
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ============================================ */}
      {/* REMINDERS TAB */}
      {/* ============================================ */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {/* Smart Reminders */}
          <GlassPanel>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-400/20 text-lg">
                  🔔
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">Smart Reminders</div>
                  <div className="pt-0.5 text-[11px] text-white/50">
                    {optimalTime 
                      ? `You usually check in around ${optimalTime.label}`
                      : 'Complete a few sessions to learn your pattern'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReminderToggle}
                disabled={!optimalTime}
                className={[
                  'h-6 w-10 rounded-full transition-all duration-200 flex items-center shrink-0',
                  reminderSettings.enabled ? 'bg-green-500' : 'bg-white/20',
                  !optimalTime && 'opacity-40 cursor-not-allowed',
                ].join(' ')}
              >
                <div className={[
                  'h-4 w-4 rounded-full bg-white shadow transition-all duration-200',
                  reminderSettings.enabled ? 'translate-x-5' : 'translate-x-1',
                ].join(' ')} />
              </button>
            </div>
            
            {reminderSettings.enabled && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-[11px] text-green-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Reminder set for {optimalTime?.label}
                </div>
                {notificationStatus !== 'granted' && (
                  <div className="mt-2 text-[10px] text-yellow-400/80">
                    ⚠️ Enable browser notifications for alerts
                  </div>
                )}
              </div>
            )}
          </GlassPanel>

          {/* Apple Health */}
          <GlassPanel className="opacity-60">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-400/20 to-pink-400/20">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-[14px] font-semibold text-white">Apple Health</div>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
                    Coming Soon
                  </span>
                </div>
                <div className="pt-1 text-[11px] text-white/50 leading-relaxed">
                  Sync sleep patterns and mood data. Requires native iOS app.
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  )
}
