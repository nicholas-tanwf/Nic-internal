const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

const toLower = (s) => String(s ?? '').toLowerCase()

/**
 * MVP heuristic: convert a freeform check-in into a "state" we can act on.
 * This is intentionally simple for demo; later this is where LLM + safety layers live.
 */
export function analyzeCheckIn({ text }) {
  const t = toLower(text)

  const tags = []
  const add = (tag) => {
    if (!tags.includes(tag)) tags.push(tag)
  }

  const hit = (words) => words.some((w) => t.includes(w))

  if (hit(['anxious', 'anxiety', 'panic', 'overwhelmed', 'overwhelm', 'stress', 'stressed'])) add('stressed')
  if (hit(['tired', 'exhausted', 'sleepy', 'burnt', 'burnout'])) add('tired')
  if (hit(['sad', 'down', 'low', 'lonely', 'empty'])) add('low')
  if (hit(['angry', 'mad', 'irritated', 'frustrated'])) add('irritated')
  if (hit(['wired', 'restless', "can’t sleep", "can't sleep", 'insomnia'])) add('wired')
  if (hit(['focus', 'distracted', 'scattered', 'procrast'])) add('scattered')
  if (hit(['excited', 'energized', 'great', 'good'])) add('up')

  const state =
    tags.includes('stressed') || tags.includes('wired')
      ? 'downshift'
      : tags.includes('scattered')
        ? 'steady'
        : tags.includes('low') || tags.includes('tired')
          ? 'gentle'
          : tags.includes('up')
            ? 'upshift'
            : 'steady'

  const moodBefore = estimateMood(tags)
  const recommendation = recommendationFor(state, tags)

  return {
    state,
    tags,
    moodBefore,
    reflection: reflectionFor(state, tags),
    recommendation,
  }
}

function estimateMood(tags) {
  // -2..+2
  let score = 0
  if (tags.includes('low')) score -= 1
  if (tags.includes('tired')) score -= 1
  if (tags.includes('stressed')) score -= 1
  if (tags.includes('wired')) score -= 1
  if (tags.includes('irritated')) score -= 1
  if (tags.includes('up')) score += 1
  return clamp(score, -2, 2)
}

function reflectionFor(state, tags) {
  if (state === 'downshift')
    return 'Let’s get your body safe first. Then we’ll name what’s actually happening.'
  if (state === 'gentle') return 'Keep it soft today. Small steps count.'
  if (state === 'upshift') return 'Great energy—let’s channel it without burning out.'
  if (tags.includes('scattered')) return 'We’ll narrow to one thing and make it doable.'
  return 'Let’s tune you back into steady.'
}

function recommendationFor(state, tags) {
  if (state === 'downshift') return 'Drop your shoulders. Exhale longer than you inhale.'
  if (state === 'gentle') return 'Choose the smallest next action, then stop.'
  if (state === 'upshift') return 'Pick one priority and protect it with a 10‑minute block.'
  if (tags.includes('scattered')) return 'Write the “one thing” you want done today in a single sentence.'
  return 'Try a 10‑minute reset and see what changes.'
}

export function composeRitual({ analysis }) {
  const state = analysis?.state ?? 'steady'

  // Default split: 2 / 3 / 5 minutes. Can vary by state.
  const base = [
    {
      id: 'meditate',
      label: 'Grounding',
      minutes: state === 'upshift' ? 1 : 2,
      kind: 'meditation',
    },
    { id: 'journal', label: 'Name it', minutes: 3, kind: 'journal' },
    {
      id: 'breathe',
      label: state === 'upshift' ? 'Focus breath' : 'Nervous system breath',
      minutes: state === 'gentle' ? 4 : 5,
      kind: 'breath',
    },
  ]

  // Normalize to exactly 10 minutes by adjusting breath segment.
  const total = base.reduce((acc, s) => acc + s.minutes, 0)
  if (total !== 10) {
    base[2] = { ...base[2], minutes: clamp(base[2].minutes + (10 - total), 3, 7) }
  }

  return base.map((s) => ({
    ...s,
    seconds: s.minutes * 60,
    script: scriptFor(s.kind, { state }),
  }))
}

function scriptFor(kind, { state }) {
  if (kind === 'meditation') {
    if (state === 'downshift') {
      return [
        'Sit or lie down.',
        'Feel your body supported.',
        'Unclench your jaw. Drop your shoulders.',
        'Inhale gently through the nose.',
        'Exhale like you’re fogging a mirror—slow.',
      ]
    }
    if (state === 'upshift') {
      return [
        'Sit tall.',
        'Feel your feet or seat grounded.',
        'Let your gaze soften.',
        'One slow inhale, one slow exhale.',
        'Pick one intention for the next 10 minutes.',
      ]
    }
    return [
      'Notice 3 things you can see.',
      'Notice 2 things you can feel.',
      'Notice 1 thing you can hear.',
      'Let your breath return to natural.',
    ]
  }

  if (kind === 'journal') {
    return [
      'Finish the sentence: “The real thing underneath today is…”',
      'What do you need right now?',
      'What’s one tiny action that would help (even 1%)?',
    ]
  }

  // breath
  if (state === 'upshift') {
    return [
      'Box breath for focus.',
      'Inhale 4… hold 4… exhale 4… hold 4…',
      'Repeat gently. No strain.',
    ]
  }
  if (state === 'gentle') {
    return [
      'Soft breath for recovery.',
      'Inhale 4… exhale 6…',
      'Let the exhale be easy and long.',
    ]
  }
  return [
    'Downshift breath.',
    'Inhale 4… exhale 8…',
    'Long exhale tells your system: “we’re safe.”',
  ]
}

