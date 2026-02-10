/**
 * Timed Prompts System
 * Spreads guidance prompts throughout the ritual duration
 * with gentle nudges in between
 */

// Gentle nudges/reminders that can be used between main prompts
const GENTLE_NUDGES = {
  breath: [
    'Keep breathing...',
    'Stay with it...',
    'You\'re doing great...',
    'Let each breath flow naturally...',
    'Notice how you feel...',
    'Soften your shoulders...',
    'Relax your jaw...',
    'Stay present...',
    'Continue at your own pace...',
    'Each breath brings calm...',
  ],
  meditation: [
    'Stay present...',
    'Gently return to focus...',
    'Notice, don\'t judge...',
    'Let thoughts pass...',
    'You\'re doing beautifully...',
    'Stay with this moment...',
    'Breathe and observe...',
    'Find stillness...',
    'Be here now...',
  ],
  movement: [
    'Move with intention...',
    'Listen to your body...',
    'No rush...',
    'Feel each movement...',
    'Release tension as you move...',
    'Stay connected to your breath...',
    'Honor your body\'s limits...',
  ],
  journal: [
    'Take your time...',
    'There\'s no wrong answer...',
    'Write what feels true...',
    'Let it flow...',
    'Be honest with yourself...',
  ],
  sound: [
    'Just listen...',
    'Let the sound wash over you...',
    'No effort needed...',
    'Simply receive...',
    'Let your mind float...',
  ],
  mindset: [
    'Believe in yourself...',
    'You are capable...',
    'Stay with this feeling...',
    'Let it sink in...',
    'Own this moment...',
  ],
}

/**
 * Generate timed prompts for a ritual step
 * @param {object} step - The ritual step with script and duration
 * @returns {Array} Array of { time: seconds, text: string, isNudge: boolean }
 */
export function generateTimedPrompts(step) {
  const totalSeconds = step.seconds ?? step.minutes * 60
  const script = step.script ?? []
  const kind = step.kind ?? 'meditation'
  const nudges = GENTLE_NUDGES[kind] ?? GENTLE_NUDGES.meditation
  
  const prompts = []
  
  if (script.length === 0) {
    // No script - add intro and nudges
    prompts.push({ time: 2, text: 'Let\'s begin...', isNudge: false })
    const nudgeInterval = Math.floor(totalSeconds / 5)
    for (let i = 1; i <= 4; i++) {
      prompts.push({
        time: i * nudgeInterval,
        text: nudges[i % nudges.length],
        isNudge: true,
      })
    }
    prompts.push({ time: totalSeconds - 5, text: 'Slowly come back...', isNudge: true })
    return prompts.sort((a, b) => a.time - b.time)
  }
  
  // KEY CHANGE: First instruction starts IMMEDIATELY (2 seconds in)
  // Then spread remaining instructions and nudges throughout
  
  // Add first script prompt immediately
  prompts.push({ time: 2, text: script[0], isNudge: false })
  
  // Calculate timing for remaining prompts
  const remainingScript = script.slice(1)
  const usableDuration = totalSeconds - 15 // Leave 15s at end for closing
  
  if (remainingScript.length > 0) {
    // Spread remaining script prompts evenly
    const interval = Math.floor(usableDuration / (remainingScript.length + 2))
    remainingScript.forEach((text, idx) => {
      const time = 10 + (idx + 1) * interval // Start from 10s, spread out
      prompts.push({ time, text, isNudge: false })
    })
  }
  
  // Add gentle nudges in the gaps
  const shuffledNudges = [...nudges].sort(() => Math.random() - 0.5)
  
  // Calculate nudge positions - fill gaps between script prompts
  const scriptTimes = prompts.map(p => p.time).sort((a, b) => a - b)
  let nudgeIdx = 0
  
  for (let i = 0; i < scriptTimes.length - 1; i++) {
    const gap = scriptTimes[i + 1] - scriptTimes[i]
    // If gap is large enough (> 25 seconds), add a nudge in the middle
    if (gap > 25 && nudgeIdx < shuffledNudges.length) {
      const nudgeTime = scriptTimes[i] + Math.floor(gap / 2)
      prompts.push({
        time: nudgeTime,
        text: shuffledNudges[nudgeIdx],
        isNudge: true,
      })
      nudgeIdx++
    }
  }
  
  // Add closing nudge near the end
  if (totalSeconds > 30) {
    prompts.push({
      time: totalSeconds - 8,
      text: 'Slowly come back...',
      isNudge: true,
    })
  }
  
  // Sort by time
  prompts.sort((a, b) => a.time - b.time)
  
  return prompts
}

/**
 * Get the current prompt based on elapsed time
 * @param {Array} prompts - Array of timed prompts
 * @param {number} elapsedSeconds - Current elapsed time
 * @returns {object|null} Current prompt or null
 */
export function getCurrentPrompt(prompts, elapsedSeconds) {
  if (!prompts?.length) return null
  
  // Find the most recent prompt that should have been shown
  let current = null
  for (const p of prompts) {
    if (p.time <= elapsedSeconds) {
      current = p
    } else {
      break
    }
  }
  return current
}

/**
 * Get the next upcoming prompt
 * @param {Array} prompts - Array of timed prompts
 * @param {number} elapsedSeconds - Current elapsed time
 * @returns {object|null} Next prompt or null
 */
export function getNextPrompt(prompts, elapsedSeconds) {
  if (!prompts?.length) return null
  return prompts.find(p => p.time > elapsedSeconds) ?? null
}

/**
 * Check if a prompt should be spoken now (within a small window)
 * @param {Array} prompts - Array of timed prompts
 * @param {number} elapsedSeconds - Current elapsed time
 * @param {Set} spokenSet - Set of already spoken prompt times
 * @returns {object|null} Prompt to speak or null
 */
export function getPromptToSpeak(prompts, elapsedSeconds, spokenSet) {
  if (!prompts?.length) return null
  
  for (const p of prompts) {
    // Check if this prompt's time has just been reached (within 1 second window)
    if (p.time <= elapsedSeconds && p.time > elapsedSeconds - 1.5) {
      if (!spokenSet.has(p.time)) {
        return p
      }
    }
  }
  return null
}
