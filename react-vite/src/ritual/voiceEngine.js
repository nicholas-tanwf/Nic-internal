/**
 * Voice Engine for Exhale App
 * Provides calm voice guidance using Web Speech API
 */

// Voice gender options
export const VOICE_GENDERS = [
  { id: 'female', label: 'Female', icon: '♀' },
  { id: 'male', label: 'Male', icon: '♂' },
]

// Voice tone options - optimized for natural, calm delivery
export const VOICE_TONES = [
  {
    id: 'calm',
    label: 'Calm',
    description: 'Soft & soothing',
    icon: '🌙',
    settings: { pitch: 0.95, rate: 0.72 }, // Slower, slightly deeper for calm
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm & upbeat',
    icon: '☀️',
    settings: { pitch: 1.0, rate: 0.78 },
  },
  {
    id: 'confident',
    label: 'Confident',
    description: 'Clear & assured',
    icon: '💪',
    settings: { pitch: 0.9, rate: 0.75 }, // Deeper, measured pace
  },
]

const STORAGE_KEY = 'exhale-voice-preference'

let selectedVoice = null
let currentGender = 'female'
let currentTone = VOICE_TONES[0]
let voicesLoaded = false

// Known voice names by gender (for better matching)
const FEMALE_VOICE_NAMES = [
  'samantha', 'karen', 'moira', 'tessa', 'fiona', 'victoria', 'kate',
  'zira', 'hazel', 'susan', 'linda', 'emily', 'emma', 'olivia', 'ava',
  'sara', 'anna', 'allison', 'ewa', 'paulina', 'joana', 'lucia', 'mónica',
  'google us english female', 'google uk english female', 'microsoft zira',
  'female', 'woman', 'girl',
]

const MALE_VOICE_NAMES = [
  'daniel', 'alex', 'david', 'james', 'thomas', 'mark', 'george', 'fred',
  'oliver', 'ralph', 'albert', 'bruce', 'tom', 'lee', 'rishi', 'aaron',
  'google us english male', 'google uk english male', 'microsoft david',
  'male', 'man', 'guy',
]

// Premium/natural sounding voices to prioritize (in order of quality)
const PREMIUM_VOICE_INDICATORS = [
  'premium', 'enhanced', 'natural', 'neural', 'wavenet', 'online',
  'eloquence', 'compact', 'siri', 'google', 'microsoft', 'apple',
]

// Specific high-quality voices known to sound natural
const BEST_FEMALE_VOICES = [
  'samantha', // macOS/iOS - very natural
  'siri female', // iOS Siri
  'karen', // Australian, warm
  'moira', // Irish, gentle
  'tessa', // South African, soft
  'google us english', // Chrome
  'microsoft zira', // Windows
  'ava', // iOS
]

const BEST_MALE_VOICES = [
  'daniel', // macOS/iOS - very natural
  'siri male', // iOS Siri
  'alex', // macOS
  'tom', // UK English
  'google uk english male', // Chrome
  'microsoft david', // Windows
]

/**
 * Get saved voice preference
 */
export function getVoicePreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        gender: parsed.gender || 'female',
        toneId: parsed.toneId || 'calm',
      }
    }
  } catch (e) {
    // Ignore storage errors
  }
  return { gender: 'female', toneId: 'calm' }
}

/**
 * Save voice preference
 */
export function setVoicePreference(gender, toneId) {
  currentGender = gender
  currentTone = VOICE_TONES.find((t) => t.id === toneId) || VOICE_TONES[0]
  selectedVoice = null // Reset to re-select voice
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gender, toneId }))
  } catch (e) {
    // Ignore storage errors
  }
  
  // Re-select the best voice for new settings
  selectBestVoice()
}

/**
 * Initialize voices when available
 */
function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return
  
  voicesLoaded = true
  const pref = getVoicePreference()
  currentGender = pref.gender
  currentTone = VOICE_TONES.find((t) => t.id === pref.toneId) || VOICE_TONES[0]
  selectBestVoice()
}

/**
 * Score a voice based on how well it matches our criteria
 * Higher score = better voice for meditation/wellness
 */
function scoreVoice(voice, targetGender) {
  let score = 0
  const name = voice.name.toLowerCase()
  const lang = voice.lang.toLowerCase()
  
  // Must be English
  if (!lang.startsWith('en')) return -1000
  
  // Prefer US/UK/AU English (clearer for wellness content)
  if (lang.includes('us') || lang === 'en-us') score += 25
  if (lang.includes('gb') || lang === 'en-gb') score += 20
  if (lang.includes('au') || lang === 'en-au') score += 22 // Australian often sounds warmer
  
  // Check gender match
  const isFemaleVoice = FEMALE_VOICE_NAMES.some((n) => name.includes(n))
  const isMaleVoice = MALE_VOICE_NAMES.some((n) => name.includes(n))
  
  if (targetGender === 'female') {
    if (isFemaleVoice) score += 50
    if (isMaleVoice) score -= 100
  } else {
    if (isMaleVoice) score += 50
    if (isFemaleVoice) score -= 100
  }
  
  // Check against our curated best voice lists (highest priority)
  const bestList = targetGender === 'female' ? BEST_FEMALE_VOICES : BEST_MALE_VOICES
  const bestIndex = bestList.findIndex(v => name.includes(v))
  if (bestIndex >= 0) {
    // Higher score for voices earlier in the list (more preferred)
    score += 100 - (bestIndex * 10)
  }
  
  // Prefer premium/natural sounding voices
  if (PREMIUM_VOICE_INDICATORS.some((p) => name.includes(p))) {
    score += 30
  }
  
  // Local voices on Apple devices are often higher quality
  if (voice.localService) {
    score += 15
  }
  
  // Avoid voices with "compact" in the name (usually lower quality)
  if (name.includes('compact')) {
    score -= 20
  }
  
  // Bonus for voices that sound warmer/softer for wellness
  if (name.includes('enhanced') || name.includes('premium')) {
    score += 40
  }
  
  return score
}

/**
 * Select the best available voice based on gender preference
 */
function selectBestVoice() {
  if (!window.speechSynthesis) return
  
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return
  
  // Score all voices
  const scoredVoices = voices
    .map((voice) => ({
      voice,
      score: scoreVoice(voice, currentGender),
    }))
    .filter((v) => v.score > -500) // Filter out wrong gender
    .sort((a, b) => b.score - a.score)
  
  if (scoredVoices.length > 0) {
    selectedVoice = scoredVoices[0].voice
    console.log(`🎙️ Selected voice: "${selectedVoice.name}" (score: ${scoredVoices[0].score}, gender: ${currentGender})`)
    
    // Log top 3 for debugging
    console.log('Top voice candidates:', scoredVoices.slice(0, 3).map((v) => `${v.voice.name} (${v.score})`))
  } else {
    // Fallback to any English voice
    selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0]
    console.log(`🎙️ Fallback voice: "${selectedVoice?.name}"`)
  }
}

/**
 * Check if speech synthesis is supported
 */
export function isVoiceSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Get all available voices for debugging
 */
export function getAvailableVoices() {
  if (!isVoiceSupported()) return []
  return window.speechSynthesis.getVoices()
}

/**
 * Initialize the voice engine
 */
export function initVoice() {
  if (!isVoiceSupported()) return false
  
  const pref = getVoicePreference()
  currentGender = pref.gender
  currentTone = VOICE_TONES.find((t) => t.id === pref.toneId) || VOICE_TONES[0]
  
  // Load voices (may be async)
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    loadVoices()
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true })
  }
  
  return true
}

/**
 * Add natural pauses to text for more human-like delivery
 * Uses SSML-like markers that Web Speech API can interpret
 */
function addNaturalPauses(text) {
  let processed = text
  
  // Add slight pauses after periods (already natural, just ensure spacing)
  processed = processed.replace(/\.\s+/g, '. ... ')
  
  // Add pauses after commas
  processed = processed.replace(/,\s+/g, ', .. ')
  
  // Add pauses around em-dashes
  processed = processed.replace(/—/g, ' ... ')
  processed = processed.replace(/ - /g, ' ... ')
  
  // Add emphasis pauses before key wellness words
  const emphasisWords = ['breathe', 'relax', 'let go', 'release', 'notice', 'feel', 'allow', 'gently', 'slowly', 'deeply']
  for (const word of emphasisWords) {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi')
    processed = processed.replace(regex, '.. $1')
  }
  
  // Clean up multiple consecutive pauses
  processed = processed.replace(/(\.\s*){3,}/g, '... ')
  
  return processed.trim()
}

/**
 * Speak a single line of text
 */
export function speak(text, options = {}) {
  if (!isVoiceSupported()) return Promise.resolve()
  if (!text?.trim()) return Promise.resolve()
  
  // Ensure voices are loaded
  if (!voicesLoaded) {
    loadVoices()
  }
  
  return new Promise((resolve) => {
    // Cancel any current speech first
    window.speechSynthesis.cancel()
    
    // Process text for more natural delivery
    const processedText = options.raw ? text : addNaturalPauses(text)
    
    const utterance = new SpeechSynthesisUtterance(processedText)
    
    // Apply tone settings
    const { pitch, rate } = options.tone?.settings || currentTone.settings
    utterance.pitch = options.pitch ?? pitch
    utterance.rate = options.rate ?? rate
    utterance.volume = options.volume ?? 0.9 // Slightly softer for intimacy
    
    // Apply selected voice
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
    
    utterance.onend = () => resolve()
    utterance.onerror = (e) => {
      console.warn('Speech error:', e)
      resolve()
    }
    
    // Small delay to ensure voice is ready
    setTimeout(() => {
      window.speechSynthesis.speak(utterance)
    }, 50)
  })
}

/**
 * Speak multiple lines with pauses
 */
export async function speakSequence(lines, options = {}) {
  if (!isVoiceSupported()) return
  if (!lines?.length) return
  
  const pauseBetween = options.pauseMs ?? 2000
  
  for (let i = 0; i < lines.length; i++) {
    if (options.signal?.aborted) break
    
    await speak(lines[i], options)
    
    if (i < lines.length - 1 && !options.signal?.aborted) {
      await new Promise((r) => setTimeout(r, pauseBetween))
    }
  }
}

/**
 * Stop all speech
 */
export function stopSpeaking() {
  if (!isVoiceSupported()) return
  window.speechSynthesis.cancel()
}

/**
 * Pause speech
 */
export function pauseSpeaking() {
  if (!isVoiceSupported()) return
  window.speechSynthesis.pause()
}

/**
 * Resume speech
 */
export function resumeSpeaking() {
  if (!isVoiceSupported()) return
  window.speechSynthesis.resume()
}

/**
 * Check if currently speaking
 */
export function isSpeakingNow() {
  if (!isVoiceSupported()) return false
  return window.speechSynthesis.speaking
}

/**
 * Speak a preview phrase for testing
 */
export function speakPreview(gender, toneId) {
  // Temporarily set the voice for preview
  const originalGender = currentGender
  const originalTone = currentTone
  
  currentGender = gender
  currentTone = VOICE_TONES.find((t) => t.id === toneId) || VOICE_TONES[0]
  selectBestVoice()
  
  return speak('Breathe in slowly. Let go of tension. You are safe.').then(() => {
    // Restore original settings if not saved
    currentGender = originalGender
    currentTone = originalTone
    selectBestVoice()
  })
}
