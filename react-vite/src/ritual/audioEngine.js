/**
 * Audio Engine for Exhale App
 * Generates calming ambient sounds and accurate binaural beats using Web Audio API
 */

let audioContext = null
let masterGain = null
let activeNodes = []
let audioUnlocked = false

// Frequency ranges for brainwave states
const BRAINWAVES = {
  delta: { min: 0.5, max: 4, description: 'Deep sleep, healing' },
  theta: { min: 4, max: 8, description: 'Meditation, creativity' },
  alpha: { min: 8, max: 13, description: 'Relaxed focus, calm' },
  beta: { min: 13, max: 30, description: 'Alert, concentration' },
  gamma: { min: 30, max: 50, description: 'Peak cognition, insight' }, // Capped at 50Hz for comfort
}

// Base frequency for binaural beats (carrier tone)
const BASE_FREQUENCY = 200

/**
 * Initialize the audio context (must be called after user interaction)
 * On mobile, this needs to be called on every user tap to ensure audio works
 */
export function initAudio() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      masterGain = audioContext.createGain()
      masterGain.gain.value = 0.5
      masterGain.connect(audioContext.destination)
    }
    
    // Always try to resume on mobile - needed for iOS/Android
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('🔊 Audio context resumed')
        audioUnlocked = true
      }).catch(e => {
        console.warn('Audio resume failed:', e)
      })
    }
    
    // iOS/Telegram workaround: create and play a very short silent tone
    // This "unlocks" the audio context
    if (audioContext.state !== 'running') {
      const silentOsc = audioContext.createOscillator()
      const silentGain = audioContext.createGain()
      silentGain.gain.value = 0
      silentOsc.connect(silentGain)
      silentGain.connect(audioContext.destination)
      silentOsc.start()
      silentOsc.stop(audioContext.currentTime + 0.001)
    } else {
      audioUnlocked = true
    }
    
    return audioContext
  } catch (e) {
    console.warn('Audio init error:', e)
    return null
  }
}

/**
 * Check if audio is currently working
 */
export function isAudioWorking() {
  return audioContext && audioContext.state === 'running' && audioUnlocked
}

/**
 * Get audio context state for debugging
 */
export function getAudioState() {
  return {
    hasContext: !!audioContext,
    state: audioContext?.state || 'none',
    unlocked: audioUnlocked,
  }
}

/**
 * Force unlock audio with an audible micro-beep (for stubborn browsers like Telegram)
 * Call this on a direct user tap
 */
export function forceUnlockAudio() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      masterGain = audioContext.createGain()
      masterGain.gain.value = 0.5
      masterGain.connect(audioContext.destination)
    }
    
    // Resume first
    const resumePromise = audioContext.state === 'suspended' 
      ? audioContext.resume() 
      : Promise.resolve()
    
    resumePromise.then(() => {
      // Play a very short, quiet beep to truly unlock audio
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      
      osc.frequency.value = 440 // A4 note
      gain.gain.value = 0.01 // Very quiet
      
      osc.connect(gain)
      gain.connect(audioContext.destination)
      
      osc.start()
      // Fade out quickly
      gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02)
      osc.stop(audioContext.currentTime + 0.05)
      
      audioUnlocked = true
      console.log('🔊 Audio force unlocked with micro-beep')
    }).catch(e => {
      console.warn('Force unlock failed:', e)
    })
    
    return true
  } catch (e) {
    console.warn('Force unlock error:', e)
    return false
  }
}

/**
 * Stop all currently playing sounds
 */
export function stopAllSounds() {
  activeNodes.forEach((node) => {
    try {
      if (node.stop) node.stop()
      if (node.disconnect) node.disconnect()
    } catch (e) {
      // Node already stopped
    }
  })
  activeNodes = []
}

/**
 * Set master volume (0-1)
 */
export function setVolume(value) {
  if (masterGain) {
    masterGain.gain.setTargetAtTime(value, audioContext.currentTime, 0.1)
  }
}

/**
 * Create a noise generator (white, pink, or brown noise)
 */
function createNoiseGenerator(type = 'pink') {
  const bufferSize = 2 * audioContext.sampleRate
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const output = noiseBuffer.getChannelData(0)

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
  } else if (type === 'pink') {
    // Pink noise algorithm (Paul Kellet's refined method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  } else if (type === 'brown') {
    // Brown noise (integrated white noise)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 3.5 // Compensate for gain loss
    }
  }

  const noiseSource = audioContext.createBufferSource()
  noiseSource.buffer = noiseBuffer
  noiseSource.loop = true
  return noiseSource
}

/**
 * Create rain sound using filtered noise with random variations
 */
export function createRainSound(intensity = 0.5) {
  initAudio()
  
  const rainGain = audioContext.createGain()
  rainGain.gain.value = intensity * 0.4
  
  // Main rain layer (brown noise filtered)
  const mainRain = createNoiseGenerator('brown')
  const mainFilter = audioContext.createBiquadFilter()
  mainFilter.type = 'lowpass'
  mainFilter.frequency.value = 800
  mainFilter.Q.value = 0.5
  
  mainRain.connect(mainFilter)
  mainFilter.connect(rainGain)
  
  // High frequency "patter" layer
  const patter = createNoiseGenerator('white')
  const patterFilter = audioContext.createBiquadFilter()
  patterFilter.type = 'bandpass'
  patterFilter.frequency.value = 3000
  patterFilter.Q.value = 2
  
  const patterGain = audioContext.createGain()
  patterGain.gain.value = 0.05 * intensity
  
  patter.connect(patterFilter)
  patterFilter.connect(patterGain)
  patterGain.connect(rainGain)
  
  // Subtle modulation for natural variation
  const lfo = audioContext.createOscillator()
  lfo.frequency.value = 0.1
  const lfoGain = audioContext.createGain()
  lfoGain.gain.value = 0.1
  lfo.connect(lfoGain)
  lfoGain.connect(mainFilter.frequency)
  
  rainGain.connect(masterGain)
  
  mainRain.start()
  patter.start()
  lfo.start()
  
  activeNodes.push(mainRain, patter, lfo, mainFilter, patterFilter, rainGain, patterGain, lfoGain)
  
  return { stop: () => stopAllSounds() }
}

/**
 * Create a low drone/hum sound
 */
export function createDroneSound(baseFreq = 60, intensity = 0.3) {
  initAudio()
  
  const droneGain = audioContext.createGain()
  droneGain.gain.value = intensity * 0.3
  
  // Fundamental drone
  const osc1 = audioContext.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.value = baseFreq
  
  // Harmonic overtones
  const osc2 = audioContext.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = baseFreq * 2
  const osc2Gain = audioContext.createGain()
  osc2Gain.gain.value = 0.3
  
  const osc3 = audioContext.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.value = baseFreq * 3
  const osc3Gain = audioContext.createGain()
  osc3Gain.gain.value = 0.15
  
  // Subtle detuning for warmth
  const osc4 = audioContext.createOscillator()
  osc4.type = 'sine'
  osc4.frequency.value = baseFreq * 1.002
  const osc4Gain = audioContext.createGain()
  osc4Gain.gain.value = 0.5
  
  // Slow modulation
  const lfo = audioContext.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = audioContext.createGain()
  lfoGain.gain.value = 2
  lfo.connect(lfoGain)
  lfoGain.connect(osc1.frequency)
  
  osc1.connect(droneGain)
  osc2.connect(osc2Gain)
  osc2Gain.connect(droneGain)
  osc3.connect(osc3Gain)
  osc3Gain.connect(droneGain)
  osc4.connect(osc4Gain)
  osc4Gain.connect(droneGain)
  
  droneGain.connect(masterGain)
  
  osc1.start()
  osc2.start()
  osc3.start()
  osc4.start()
  lfo.start()
  
  activeNodes.push(osc1, osc2, osc3, osc4, lfo, droneGain, osc2Gain, osc3Gain, osc4Gain, lfoGain)
  
  return { stop: () => stopAllSounds() }
}

/**
 * Create nature/wind ambience
 */
export function createNatureSound(intensity = 0.4) {
  initAudio()
  
  const natureGain = audioContext.createGain()
  natureGain.gain.value = intensity * 0.3
  
  // Wind base (filtered pink noise)
  const wind = createNoiseGenerator('pink')
  const windFilter = audioContext.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = 400
  windFilter.Q.value = 1
  
  // Wind modulation (gusts)
  const windLfo = audioContext.createOscillator()
  windLfo.frequency.value = 0.15
  const windLfoGain = audioContext.createGain()
  windLfoGain.gain.value = 200
  windLfo.connect(windLfoGain)
  windLfoGain.connect(windFilter.frequency)
  
  // Volume modulation for natural variation
  const volLfo = audioContext.createOscillator()
  volLfo.frequency.value = 0.08
  const volLfoGain = audioContext.createGain()
  volLfoGain.gain.value = 0.1
  volLfo.connect(volLfoGain)
  volLfoGain.connect(natureGain.gain)
  
  wind.connect(windFilter)
  windFilter.connect(natureGain)
  natureGain.connect(masterGain)
  
  wind.start()
  windLfo.start()
  volLfo.start()
  
  activeNodes.push(wind, windFilter, windLfo, windLfoGain, volLfo, volLfoGain, natureGain)
  
  return { stop: () => stopAllSounds() }
}

/**
 * Create accurate binaural beats for specific brainwave state
 * @param {string} waveType - 'delta', 'theta', 'alpha', or 'beta'
 * @param {number} intensity - 0-1 volume
 */
export function createBinauralBeat(waveType = 'alpha', intensity = 0.4) {
  initAudio()
  
  const wave = BRAINWAVES[waveType]
  if (!wave) {
    console.warn(`Unknown wave type: ${waveType}, defaulting to alpha`)
    return createBinauralBeat('alpha', intensity)
  }
  
  // Calculate target frequency (middle of the range)
  const targetFreq = (wave.min + wave.max) / 2
  
  // Create stereo panner for each ear
  const binauralGain = audioContext.createGain()
  binauralGain.gain.value = intensity * 0.25
  
  // Left ear oscillator
  const leftOsc = audioContext.createOscillator()
  leftOsc.type = 'sine'
  leftOsc.frequency.value = BASE_FREQUENCY
  
  const leftPanner = audioContext.createStereoPanner()
  leftPanner.pan.value = -1 // Full left
  
  // Right ear oscillator (offset by target frequency)
  const rightOsc = audioContext.createOscillator()
  rightOsc.type = 'sine'
  rightOsc.frequency.value = BASE_FREQUENCY + targetFreq
  
  const rightPanner = audioContext.createStereoPanner()
  rightPanner.pan.value = 1 // Full right
  
  // Connect
  leftOsc.connect(leftPanner)
  leftPanner.connect(binauralGain)
  
  rightOsc.connect(rightPanner)
  rightPanner.connect(binauralGain)
  
  binauralGain.connect(masterGain)
  
  leftOsc.start()
  rightOsc.start()
  
  activeNodes.push(leftOsc, rightOsc, leftPanner, rightPanner, binauralGain)
  
  console.log(`🎧 Binaural beat: ${waveType} (${targetFreq}Hz) - Left: ${BASE_FREQUENCY}Hz, Right: ${BASE_FREQUENCY + targetFreq}Hz`)
  
  return { 
    stop: () => stopAllSounds(),
    frequency: targetFreq,
    waveType
  }
}

/**
 * Create Solfeggio frequency tones
 * Common healing frequencies: 396, 417, 528, 639, 741, 852 Hz
 */
export function createSolfeggioTone(frequency = 528, intensity = 0.3) {
  initAudio()
  
  const solGain = audioContext.createGain()
  solGain.gain.value = intensity * 0.2
  
  // Main tone
  const osc = audioContext.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = frequency
  
  // Subtle octave below for richness
  const oscLow = audioContext.createOscillator()
  oscLow.type = 'sine'
  oscLow.frequency.value = frequency / 2
  const lowGain = audioContext.createGain()
  lowGain.gain.value = 0.3
  
  // Very gentle tremolo
  const lfo = audioContext.createOscillator()
  lfo.frequency.value = 0.1
  const lfoGain = audioContext.createGain()
  lfoGain.gain.value = 0.02
  lfo.connect(lfoGain)
  lfoGain.connect(solGain.gain)
  
  osc.connect(solGain)
  oscLow.connect(lowGain)
  lowGain.connect(solGain)
  solGain.connect(masterGain)
  
  osc.start()
  oscLow.start()
  lfo.start()
  
  activeNodes.push(osc, oscLow, lfo, solGain, lowGain, lfoGain)
  
  return { stop: () => stopAllSounds() }
}

/**
 * Create a humming/OM tone for vocal practices
 */
export function createHummingTone(baseFreq = 136.1, intensity = 0.25) {
  initAudio()
  
  // 136.1 Hz is the OM frequency
  const humGain = audioContext.createGain()
  humGain.gain.value = intensity * 0.2
  
  const osc = audioContext.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = baseFreq
  
  // Add slight formant-like filtering
  const filter = audioContext.createBiquadFilter()
  filter.type = 'peaking'
  filter.frequency.value = baseFreq * 3
  filter.Q.value = 5
  filter.gain.value = 3
  
  osc.connect(filter)
  filter.connect(humGain)
  humGain.connect(masterGain)
  
  osc.start()
  
  activeNodes.push(osc, filter, humGain)
  
  return { stop: () => stopAllSounds() }
}

/**
 * Composite sound presets for different ritual types
 */
export const SOUND_PRESETS = {
  // Breathing exercises
  'physio-sigh': () => {
    createRainSound(0.4)
    createDroneSound(55, 0.2)
  },
  'box-breathing': () => {
    createNatureSound(0.4)
    createBinauralBeat('alpha', 0.3)
  },
  '478-breathing': () => {
    createRainSound(0.5)
    createBinauralBeat('theta', 0.25)
  },
  'alternate-nostril': () => {
    createDroneSound(60, 0.25)
    createNatureSound(0.3)
  },
  'energizing-breath': () => {
    createBinauralBeat('beta', 0.2)
    createDroneSound(80, 0.15)
  },
  'coherent-breathing': () => {
    createBinauralBeat('alpha', 0.35)
    createRainSound(0.3)
  },
  'lions-breath': () => {
    createDroneSound(50, 0.3)
  },
  
  // Meditation
  'grounding-54321': () => {
    createNatureSound(0.5)
    createBinauralBeat('alpha', 0.2)
  },
  'body-scan': () => {
    createRainSound(0.4)
    createBinauralBeat('theta', 0.3)
  },
  'loving-kindness': () => {
    createDroneSound(60, 0.2)
    createBinauralBeat('alpha', 0.25)
  },
  'visualization': () => {
    createNatureSound(0.4)
    createBinauralBeat('theta', 0.35)
  },
  'mindful-awareness': () => {
    createRainSound(0.35)
    createBinauralBeat('alpha', 0.3)
  },
  'focus-meditation': () => {
    createBinauralBeat('alpha', 0.4)
    createDroneSound(70, 0.15)
  },
  
  // Sound-based rituals
  'nature-sounds': () => {
    createNatureSound(0.6)
    createRainSound(0.3)
  },
  'binaural-beats': () => {
    createBinauralBeat('theta', 0.5)
  },
  'humming': () => {
    createHummingTone(136.1, 0.3)
    createDroneSound(136.1 / 2, 0.15)
  },
  'solfeggio': () => {
    createSolfeggioTone(528, 0.4)
    createBinauralBeat('theta', 0.2)
  },
  
  // Journaling/mindset (ambient background)
  'name-it': () => {
    createRainSound(0.25)
  },
  'gratitude': () => {
    createNatureSound(0.25)
  },
  'brain-dump': () => {
    createRainSound(0.2)
    createDroneSound(55, 0.1)
  },
  'future-self': () => {
    createNatureSound(0.3)
    createBinauralBeat('alpha', 0.15)
  },
  'cognitive-reframe': () => {
    createRainSound(0.25)
  },
  
  // Movement (subtle background)
  'progressive-relaxation': () => {
    createBinauralBeat('theta', 0.25)
    createDroneSound(50, 0.2)
  },
  'gentle-stretch': () => {
    createNatureSound(0.3)
  },
  'shaking': () => {
    createBinauralBeat('beta', 0.15)
  },
  'power-pose': () => {
    createDroneSound(80, 0.2)
    createBinauralBeat('alpha', 0.2)
  },
  'yoga-flow': () => {
    createNatureSound(0.35)
    createBinauralBeat('alpha', 0.25)
  },
  
  // Mindset
  'affirmations': () => {
    createDroneSound(60, 0.15)
    createBinauralBeat('alpha', 0.2)
  },
  'intention-setting': () => {
    createNatureSound(0.25)
    createBinauralBeat('alpha', 0.2)
  },
  'emotional-release': () => {
    createRainSound(0.4)
    createBinauralBeat('theta', 0.3)
  },
  'self-compassion': () => {
    createRainSound(0.35)
    createDroneSound(55, 0.2)
  },
  
  // BRAINWAVE SESSIONS
  'alpha-waves': () => {
    createBinauralBeat('alpha', 0.5)
    createNatureSound(0.2)
  },
  'theta-waves': () => {
    createBinauralBeat('theta', 0.5)
    createRainSound(0.25)
  },
  'delta-waves': () => {
    createBinauralBeat('delta', 0.5)
    createDroneSound(40, 0.15)
  },
  'beta-waves': () => {
    createBinauralBeat('beta', 0.45)
    createDroneSound(80, 0.1)
  },
  'gamma-waves': () => {
    createBinauralBeat('gamma', 0.4)
    createDroneSound(100, 0.08)
  },
  
  // ADHD-SPECIFIC
  'adhd-body-double': () => {
    createBinauralBeat('beta', 0.25)
    createNatureSound(0.2)
  },
  'adhd-pomodoro': () => {
    createBinauralBeat('beta', 0.3)
    createDroneSound(70, 0.1)
  },
  'adhd-fidget-reset': () => {
    createBinauralBeat('beta', 0.2)
  },
  'adhd-time-anchor': () => {
    createBinauralBeat('alpha', 0.25)
    createDroneSound(60, 0.1)
  },
  'adhd-task-chunking': () => {
    createRainSound(0.25)
    createBinauralBeat('alpha', 0.2)
  },
  'adhd-dopamine-menu': () => {
    createBinauralBeat('beta', 0.2)
    createNatureSound(0.15)
  },
  
  // OCD-SPECIFIC
  'ocd-erp-mini': () => {
    createBinauralBeat('alpha', 0.35)
    createRainSound(0.3)
  },
  'ocd-thought-defusion': () => {
    createBinauralBeat('theta', 0.3)
    createNatureSound(0.25)
  },
  'ocd-uncertainty-sit': () => {
    createBinauralBeat('alpha', 0.3)
    createRainSound(0.35)
  },
  'ocd-wave-surfing': () => {
    createBinauralBeat('theta', 0.35)
    createDroneSound(55, 0.2)
  },
  'ocd-grounding': () => {
    createNatureSound(0.4)
    createBinauralBeat('alpha', 0.25)
  },
  'ocd-self-compassion': () => {
    createRainSound(0.4)
    createDroneSound(55, 0.15)
  },
  
  // POSITIVE STATE - AMPLIFY & CHANNEL
  'flow-activation': () => {
    createBinauralBeat('gamma', 0.3)
    createDroneSound(100, 0.1)
  },
  'energy-amplify': () => {
    createBinauralBeat('beta', 0.35)
    createDroneSound(80, 0.15)
  },
  'passion-channel': () => {
    createBinauralBeat('beta', 0.3)
    createDroneSound(90, 0.12)
  },
  'joy-expansion': () => {
    createBinauralBeat('alpha', 0.35)
    createNatureSound(0.3)
  },
  'creative-burst': () => {
    createBinauralBeat('gamma', 0.35)
    createDroneSound(110, 0.1)
  },
  'momentum-builder': () => {
    createBinauralBeat('beta', 0.35)
    createDroneSound(85, 0.12)
  },
  'peak-intention': () => {
    createBinauralBeat('alpha', 0.35)
    createDroneSound(70, 0.15)
  },
  'success-anchor': () => {
    createBinauralBeat('alpha', 0.3)
    createNatureSound(0.25)
  },
  
  // POSITIVE STATE - GRATITUDE & CONNECTION
  'gratitude-amplify': () => {
    createBinauralBeat('alpha', 0.3)
    createNatureSound(0.35)
  },
  'love-expansion': () => {
    createBinauralBeat('theta', 0.3)
    createDroneSound(60, 0.2)
  },
  'appreciation-savor': () => {
    createBinauralBeat('alpha', 0.35)
    createNatureSound(0.3)
  },
  'connection-ritual': () => {
    createBinauralBeat('alpha', 0.25)
    createRainSound(0.25)
  },
  'celebrate-wins': () => {
    createBinauralBeat('beta', 0.25)
    createDroneSound(75, 0.15)
  },
  'pay-it-forward': () => {
    createBinauralBeat('alpha', 0.3)
    createNatureSound(0.3)
  },
  
  // POSITIVE STATE - VISION & MANIFESTATION
  'vision-activation': () => {
    createBinauralBeat('theta', 0.4)
    createDroneSound(65, 0.2)
  },
  'goal-supercharge': () => {
    createBinauralBeat('beta', 0.3)
    createDroneSound(80, 0.15)
  },
  'abundance-mindset': () => {
    createBinauralBeat('alpha', 0.35)
    createNatureSound(0.3)
  },
  'confidence-boost': () => {
    createBinauralBeat('beta', 0.35)
    createDroneSound(90, 0.12)
  },
  
  // PANIC / EMERGENCY - calming, grounding
  'panic-sos': () => {
    createBinauralBeat('alpha', 0.4)
    createDroneSound(50, 0.25)
  },
  'tipp-temperature': () => {
    createDroneSound(45, 0.2)
  },
  'panic-grounding': () => {
    createNatureSound(0.35)
    createBinauralBeat('alpha', 0.3)
  },
  'safe-place-now': () => {
    createBinauralBeat('theta', 0.35)
    createNatureSound(0.3)
  },
  'panic-breathe': () => {
    createBinauralBeat('alpha', 0.35)
    createDroneSound(55, 0.2)
  },
  
  // SLEEP / INSOMNIA - very calming, delta/theta
  'sleep-onset': () => {
    createBinauralBeat('delta', 0.4)
    createRainSound(0.35)
  },
  'racing-thoughts-bed': () => {
    createBinauralBeat('theta', 0.35)
    createRainSound(0.3)
  },
  'body-scan-sleep': () => {
    createBinauralBeat('delta', 0.35)
    createDroneSound(40, 0.15)
  },
  'middle-night': () => {
    createBinauralBeat('delta', 0.4)
    createDroneSound(35, 0.1)
  },
  'worry-dump-sleep': () => {
    createRainSound(0.3)
    createBinauralBeat('theta', 0.2)
  },
  'sleep-story': () => {
    createBinauralBeat('theta', 0.35)
    createNatureSound(0.3)
  },
  
  // BURNOUT - gentle, nurturing
  'burnout-acknowledge': () => {
    createRainSound(0.35)
    createDroneSound(50, 0.15)
  },
  'permission-rest': () => {
    createBinauralBeat('theta', 0.3)
    createNatureSound(0.3)
  },
  'energy-audit': () => {
    createRainSound(0.25)
  },
  'boundary-set': () => {
    createBinauralBeat('alpha', 0.25)
    createDroneSound(60, 0.1)
  },
  'minimum-viable': () => {
    createRainSound(0.25)
  },
  'tiny-joy': () => {
    createNatureSound(0.3)
    createBinauralBeat('alpha', 0.2)
  },
  
  // GRIEF - gentle, supportive
  'grief-wave': () => {
    createRainSound(0.4)
    createDroneSound(50, 0.2)
  },
  'honor-ritual': () => {
    createBinauralBeat('theta', 0.3)
    createDroneSound(55, 0.2)
  },
  'grief-breath': () => {
    createBinauralBeat('alpha', 0.3)
    createRainSound(0.3)
  },
  'continuing-bonds': () => {
    createBinauralBeat('theta', 0.35)
    createNatureSound(0.25)
  },
  'grief-compassion': () => {
    createRainSound(0.35)
    createDroneSound(50, 0.15)
  },
  'meaning-making': () => {
    createBinauralBeat('alpha', 0.25)
    createNatureSound(0.25)
  },
  
  // WORK / LIFE TRANSITIONS
  'morning-activation': () => {
    createBinauralBeat('beta', 0.3)
    createNatureSound(0.25)
  },
  'post-work-decompress': () => {
    createBinauralBeat('alpha', 0.35)
    createNatureSound(0.3)
  },
  'sunday-reset': () => {
    createBinauralBeat('alpha', 0.3)
    createRainSound(0.3)
  },
  'pre-meeting-calm': () => {
    createBinauralBeat('alpha', 0.3)
    createDroneSound(60, 0.1)
  },
  'interview-prep': () => {
    createBinauralBeat('alpha', 0.25)
    createDroneSound(70, 0.12)
  },
  'commute-transition': () => {
    createBinauralBeat('alpha', 0.25)
    createNatureSound(0.2)
  },
}

// Track if we're currently crossfading to prevent overlaps
let isCrossfading = false
let crossfadeTimeout = null

/**
 * Crossfade to a new soundscape - smooth transition between sounds
 */
export function crossfadeToSound(ritualId, fadeOutDuration = 1.5, fadeInDuration = 1.5) {
  if (!masterGain || !audioContext) return
  
  // Clear any pending crossfade
  if (crossfadeTimeout) {
    clearTimeout(crossfadeTimeout)
    crossfadeTimeout = null
  }
  
  const currentVolume = masterGain.gain.value || 0.5
  
  // Smoothly fade out current sounds
  masterGain.gain.setTargetAtTime(0, audioContext.currentTime, fadeOutDuration / 3)
  
  isCrossfading = true
  
  // After fade out, switch sounds and fade in
  crossfadeTimeout = setTimeout(() => {
    stopAllSounds()
    
    // Start new sounds at zero volume
    masterGain.gain.value = 0
    
    const preset = SOUND_PRESETS[ritualId]
    if (preset) {
      preset()
      console.log(`🔊 Crossfading to soundscape: ${ritualId}`)
    } else {
      // Default calming ambience
      createRainSound(0.3)
      createBinauralBeat('alpha', 0.2)
      console.log(`🔊 Crossfading to default ambient: ${ritualId}`)
    }
    
    // Smooth fade in
    masterGain.gain.setTargetAtTime(currentVolume, audioContext.currentTime, fadeInDuration / 3)
    
    crossfadeTimeout = setTimeout(() => {
      isCrossfading = false
    }, fadeInDuration * 1000)
  }, fadeOutDuration * 1000)
}

/**
 * Play the appropriate soundscape for a ritual (with optional crossfade)
 */
export function playRitualSound(ritualId, crossfade = true) {
  // Always ensure audio is initialized (especially for mobile)
  initAudio()
  
  if (!audioContext || audioContext.state !== 'running') {
    console.warn('🔇 Audio context not running, attempting resume...')
    if (audioContext) {
      audioContext.resume()
    }
  }
  
  if (crossfade && activeNodes.length > 0) {
    // Use crossfade for smooth transition
    crossfadeToSound(ritualId, 1.2, 1.2)
  } else {
    // Immediate start (first ritual or explicit request)
    stopAllSounds()
    
    const preset = SOUND_PRESETS[ritualId]
    if (preset) {
      preset()
      console.log(`🔊 Playing soundscape for: ${ritualId}`)
    } else {
      // Default calming ambience
      createRainSound(0.3)
      createBinauralBeat('alpha', 0.2)
      console.log(`🔊 Playing default ambient for: ${ritualId}`)
    }
  }
}

/**
 * Fade out all sounds
 */
export function fadeOut(duration = 2) {
  if (masterGain) {
    // Clear any pending crossfade
    if (crossfadeTimeout) {
      clearTimeout(crossfadeTimeout)
      crossfadeTimeout = null
    }
    
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, duration / 4)
    setTimeout(() => {
      stopAllSounds()
      masterGain.gain.value = 0.5
      isCrossfading = false
    }, duration * 1000)
  }
}

// Export wave types for UI
export const WAVE_TYPES = Object.entries(BRAINWAVES).map(([key, value]) => ({
  id: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
  range: `${value.min}-${value.max} Hz`,
  description: value.description,
}))
