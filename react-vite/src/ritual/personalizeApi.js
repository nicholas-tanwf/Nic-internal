/**
 * Client-side API for personalizing ritual scripts
 * Calls the serverless function to get AI-personalized scripts
 * 
 * In development: Falls back to original scripts (API not available)
 * In production (Vercel): Uses the serverless function with OpenAI
 */

// API endpoint - works both locally and on Vercel
const API_URL = '/api/personalize-script'

// Check if we're in development mode
const IS_DEV = import.meta.env.DEV

/**
 * Personalize a single ritual's script based on user input
 * NOTE: For cohesive journeys, use personalizeAllScripts instead
 */
export async function personalizeScript({ userInput, ritual, emotionalState, tags, stepIndex = 0, totalSteps = 1, prevCategory = '' }) {
  // In development, use client-side personalization
  if (IS_DEV) {
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
    const personalizedScript = addContextToScript(
      ritual.script, userInput, tags, stepIndex, totalSteps, ritual.category, prevCategory
    )
    return { script: personalizedScript, personalized: true }
  }

  // In production, could call API but for now use client-side
  const personalizedScript = addContextToScript(
    ritual.script, userInput, tags, stepIndex, totalSteps, ritual.category, prevCategory
  )
  return { script: personalizedScript, personalized: true }
}

/**
 * Client-side fallback personalization (for dev mode)
 * Creates a cohesive journey across all ritual steps
 */

// Context openers for the FIRST step only - acknowledges how user is feeling
const JOURNEY_OPENERS = {
  'anxious': "I sense the anxiety. Let's work through it together.",
  'stressed': "That stress is heavy. Let's lighten the load.",
  'tired': "You're running low. Let's restore your energy gently.",
  'low': "It's okay to feel down. Let's lift you up a little.",
  'panic': "You're safe here. This will pass. I'm with you.",
  'grieving': "Your grief is valid. Let's honor it together.",
  'burnout': "You've given so much. It's time to receive.",
  'insomnia': "Sleep is coming. Let's prepare your mind.",
  'inspired': "That creative energy is powerful. Let's channel it.",
  'grateful': "Gratitude opens the heart. Let's deepen it.",
  'adhd': "Your brain works differently. Let's work with it.",
  'ocd': "The thoughts are just thoughts. Let's find distance.",
  'scattered': "Let's gather your focus. One step at a time.",
  'wired': "That restless energy needs direction. Let's channel it.",
  'irritated': "Frustration is valid. Let's release it safely.",
}

// Transition phrases for steps 2, 3, 4, etc. - varied and contextual
const STEP_TRANSITIONS = {
  // Generic transitions based on step position
  2: [
    "Building on that...",
    "Now let's go deeper.",
    "Good. Next...",
    "Continuing...",
  ],
  3: [
    "You're doing great. Let's shift gears.",
    "Almost there. This one's important.",
    "Keep that momentum going.",
    "Nice progress. Now...",
  ],
  4: [
    "Final stretch. Let's make it count.",
    "One more piece to complete your practice.",
    "Bringing it all together now.",
    "Last step. Stay with me.",
  ],
  5: [
    "Bonus round. You've earned this.",
    "Going the extra mile.",
    "One more for good measure.",
  ],
}

// Category-specific transitions (more contextual)
const CATEGORY_TRANSITIONS = {
  'breathwork': [
    "Now let's breathe.",
    "Time for breath work.",
    "Let your breath guide you.",
  ],
  'meditation': [
    "Let's quiet the mind.",
    "Now for stillness.",
    "Time to go inward.",
  ],
  'journaling': [
    "Put pen to paper.",
    "Time to write.",
    "Let your thoughts flow out.",
  ],
  'movement': [
    "Time to move your body.",
    "Let's get physical.",
    "Movement is medicine.",
  ],
  'sound': [
    "Now, just listen.",
    "Let sound wash over you.",
    "Tune in to the frequencies.",
  ],
  'mindset': [
    "Shifting perspective now.",
    "Time for a mindset shift.",
    "Let's reframe things.",
  ],
  'brainwave': [
    "Syncing your brainwaves.",
    "Let the frequencies work.",
    "Tuning your mind.",
  ],
  'adhd': [
    "Let's work with your brain.",
    "Time to harness your focus.",
    "Using your strengths now.",
  ],
  'ocd': [
    "Let's create some distance.",
    "Practicing presence now.",
    "Building your resilience.",
  ],
  'peak': [
    "Let's amplify this energy.",
    "Channeling your peak state.",
    "Riding this wave higher.",
  ],
  'connection': [
    "Opening your heart now.",
    "Time to connect.",
    "Expanding outward.",
  ],
  'manifest': [
    "Visualizing your future.",
    "Setting powerful intentions.",
    "Calling it in now.",
  ],
  'panic': [
    "You're safe. Grounding now.",
    "Emergency reset activated.",
    "Rapid calm incoming.",
  ],
  'burnout': [
    "Gentle care coming.",
    "Time for restoration.",
    "Recovery mode activated.",
  ],
  'grief': [
    "Holding space for you.",
    "Moving through this gently.",
    "It's okay to feel.",
  ],
  'sleep': [
    "Preparing for rest.",
    "Winding down now.",
    "Sleep is coming.",
  ],
}

// Same-category continuation phrases (when staying in same category)
const CONTINUATION_PHRASES = [
  "Continuing...",
  "Going deeper...",
  "Let's keep going.",
  "Next...",
  "Building on that...",
  "And now...",
]

// Final step phrases to signal the end is near
const FINAL_STEP_PHRASES = [
  "One last piece.",
  "Final step.",
  "To close...",
  "Finishing strong.",
  "Last one.",
]

function getStepTransition(stepIndex, totalSteps, category, prevCategory) {
  // First step - no transition needed (uses opener instead)
  if (stepIndex === 0) return null
  
  // Deterministic "random" based on step index for consistency
  const pseudoRandom = (stepIndex * 7 + totalSteps * 3) % 10 / 10
  
  // Final step - use closing phrase
  if (stepIndex === totalSteps - 1 && totalSteps > 2) {
    const idx = Math.floor(pseudoRandom * FINAL_STEP_PHRASES.length)
    return FINAL_STEP_PHRASES[idx]
  }
  
  // If switching categories, use category-specific transition
  if (category !== prevCategory && CATEGORY_TRANSITIONS[category]) {
    const options = CATEGORY_TRANSITIONS[category]
    const idx = Math.floor(pseudoRandom * options.length)
    return options[idx]
  }
  
  // Same category - use continuation phrase
  if (category === prevCategory) {
    const idx = Math.floor(pseudoRandom * CONTINUATION_PHRASES.length)
    return CONTINUATION_PHRASES[idx]
  }
  
  // Fallback: Use position-based transition
  const positionTransitions = STEP_TRANSITIONS[stepIndex + 1] || STEP_TRANSITIONS[2]
  const idx = Math.floor(pseudoRandom * positionTransitions.length)
  return positionTransitions[idx]
}

function addContextToScript(originalScript, userInput, tags = [], stepIndex = 0, totalSteps = 1, category = '', prevCategory = '') {
  if (!originalScript || originalScript.length === 0) return originalScript
  
  const personalizedScript = [...originalScript]
  
  if (stepIndex === 0) {
    // FIRST STEP: Add emotional opener
    let contextOpener = null
    for (const tag of tags) {
      if (JOURNEY_OPENERS[tag]) {
        contextOpener = JOURNEY_OPENERS[tag]
        break
      }
    }
    
    if (contextOpener) {
      personalizedScript[0] = `${contextOpener} ${personalizedScript[0]}`
    }
  } else {
    // SUBSEQUENT STEPS: Add transition phrase
    const transition = getStepTransition(stepIndex, totalSteps, category, prevCategory)
    if (transition) {
      personalizedScript[0] = `${transition} ${personalizedScript[0]}`
    }
  }
  
  return personalizedScript
}

/**
 * Personalize all rituals in a ritual array
 * Creates a cohesive journey - opener only on first step, transitions for rest
 */
export async function personalizeAllScripts({ userInput, rituals, emotionalState, tags }) {
  const startTime = Date.now()
  const totalSteps = rituals.length
  
  // Process rituals with awareness of their position in the journey
  const personalizedRituals = rituals.map((ritual, idx) => {
    const prevCategory = idx > 0 ? rituals[idx - 1].category : ''
    
    // In dev mode, do client-side personalization
    if (IS_DEV) {
      const personalizedScript = addContextToScript(
        ritual.script, 
        userInput, 
        tags, 
        idx, 
        totalSteps, 
        ritual.category,
        prevCategory
      )
      return {
        ...ritual,
        script: personalizedScript,
        _personalized: true,
      }
    }
    
    // In production, still do the same (API would handle this better)
    const personalizedScript = addContextToScript(
      ritual.script, 
      userInput, 
      tags, 
      idx, 
      totalSteps, 
      ritual.category,
      prevCategory
    )
    return {
      ...ritual,
      script: personalizedScript,
      _personalized: true,
    }
  })

  console.log(`✨ Personalized ${personalizedRituals.length}/${rituals.length} scripts as cohesive journey in ${Date.now() - startTime}ms`)

  return personalizedRituals
}

/**
 * Check if personalization API is available
 */
export async function checkPersonalizationAvailable() {
  try {
    const response = await fetch(API_URL, {
      method: 'OPTIONS',
    })
    return response.ok
  } catch {
    return false
  }
}
