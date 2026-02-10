import { getAlignedBreathDuration } from './breath.jsx'

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const toLower = (s) => String(s ?? '').toLowerCase()
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

/**
 * Map emotional state to breath pattern type
 */
function getBreathState(state) {
  // Upshift states use box breathing
  if (['upshift', 'energized', 'motivated', 'inspired', 'happy'].includes(state)) {
    return 'upshift'
  }
  // Gentle states use soft breathing
  if (['gentle', 'tired', 'low', 'sad', 'lonely'].includes(state)) {
    return 'gentle'
  }
  // Default to downshift (calming extended exhale)
  return 'downshift'
}

/**
 * 30+ Micro-Ritual Components
 * Each has: id, label, category, minutes, kind, states (which emotional states it helps)
 */
const MICRO_RITUALS = [
  // BREATHWORK (8)
  { id: 'physiological-sigh', label: 'Physiological Sigh', category: 'breathwork', minutes: 2, kind: 'breath', states: ['stressed', 'anxious', 'downshift'], description: 'Double inhale, long exhale - instant calm' },
  { id: 'box-breathing', label: 'Box Breathing', category: 'breathwork', minutes: 3, kind: 'breath', states: ['anxious', 'scattered', 'steady'], description: 'Inhale 4, hold 4, exhale 4, hold 4' },
  { id: 'extended-exhale', label: 'Extended Exhale', category: 'breathwork', minutes: 3, kind: 'breath', states: ['stressed', 'wired', 'downshift'], description: 'Inhale 4, exhale 8 - activates rest mode' },
  { id: 'alternate-nostril', label: 'Alternate Nostril', category: 'breathwork', minutes: 4, kind: 'breath', states: ['anxious', 'scattered', 'steady'], description: 'Balance left and right brain hemispheres' },
  { id: '478-breath', label: '4-7-8 Breath', category: 'breathwork', minutes: 3, kind: 'breath', states: ['wired', 'insomnia', 'downshift'], description: 'Inhale 4, hold 7, exhale 8 - natural tranquilizer' },
  { id: 'energizing-breath', label: 'Energizing Breath', category: 'breathwork', minutes: 2, kind: 'breath', states: ['tired', 'low', 'upshift'], description: 'Quick inhales to boost energy' },
  { id: 'coherent-breathing', label: 'Coherent Breathing', category: 'breathwork', minutes: 4, kind: 'breath', states: ['anxious', 'stressed', 'steady'], description: '5 breaths per minute for heart coherence' },
  { id: 'lions-breath', label: "Lion's Breath", category: 'breathwork', minutes: 2, kind: 'breath', states: ['irritated', 'frustrated', 'downshift'], description: 'Release tension and frustration' },

  // MEDITATION (6)
  { id: 'grounding-54321', label: '5-4-3-2-1 Grounding', category: 'meditation', minutes: 2, kind: 'meditation', states: ['anxious', 'stressed', 'downshift'], description: 'Engage all 5 senses to anchor to now' },
  { id: 'body-scan', label: 'Body Scan', category: 'meditation', minutes: 4, kind: 'meditation', states: ['stressed', 'wired', 'downshift'], description: 'Scan from head to toe, release tension' },
  { id: 'loving-kindness', label: 'Loving Kindness', category: 'meditation', minutes: 3, kind: 'meditation', states: ['low', 'lonely', 'gentle'], description: 'Send compassion to yourself and others' },
  { id: 'visualization', label: 'Safe Place Visualization', category: 'meditation', minutes: 3, kind: 'meditation', states: ['anxious', 'stressed', 'downshift'], description: 'Imagine your peaceful sanctuary' },
  { id: 'mindful-awareness', label: 'Mindful Awareness', category: 'meditation', minutes: 3, kind: 'meditation', states: ['scattered', 'distracted', 'steady'], description: 'Notice thoughts without judgment' },
  { id: 'focus-meditation', label: 'Single Point Focus', category: 'meditation', minutes: 2, kind: 'meditation', states: ['scattered', 'upshift'], description: 'Focus on one thing to sharpen attention' },

  // JOURNALING (5)
  { id: 'name-it', label: 'Name It to Tame It', category: 'journaling', minutes: 3, kind: 'journal', states: ['anxious', 'stressed', 'downshift'], description: 'Write what you are really feeling' },
  { id: 'gratitude', label: 'Gratitude List', category: 'journaling', minutes: 2, kind: 'journal', states: ['low', 'tired', 'gentle'], description: 'Write 3 things you are grateful for' },
  { id: 'brain-dump', label: 'Brain Dump', category: 'journaling', minutes: 3, kind: 'journal', states: ['scattered', 'overwhelmed', 'steady'], description: 'Empty your mind onto paper' },
  { id: 'future-self', label: 'Future Self Letter', category: 'journaling', minutes: 4, kind: 'journal', states: ['low', 'unmotivated', 'upshift'], description: 'Write from your best future self' },
  { id: 'cognitive-reframe', label: 'Cognitive Reframe', category: 'journaling', minutes: 3, kind: 'journal', states: ['anxious', 'irritated', 'steady'], description: 'Challenge and rewrite negative thoughts' },

  // MOVEMENT (5)
  { id: 'progressive-relaxation', label: 'Progressive Muscle Relaxation', category: 'movement', minutes: 4, kind: 'movement', states: ['stressed', 'wired', 'downshift'], description: 'Tense and release muscle groups' },
  { id: 'gentle-stretch', label: 'Gentle Stretching', category: 'movement', minutes: 3, kind: 'movement', states: ['tired', 'stiff', 'gentle'], description: 'Slow stretches for neck, shoulders, back' },
  { id: 'shaking', label: 'Shake It Out', category: 'movement', minutes: 2, kind: 'movement', states: ['stressed', 'anxious', 'downshift'], description: 'Shake your body to release tension' },
  { id: 'power-pose', label: 'Power Pose', category: 'movement', minutes: 1, kind: 'movement', states: ['low', 'unmotivated', 'upshift'], description: 'Stand tall, expand, build confidence' },
  { id: 'yoga-flow', label: 'Mini Yoga Flow', category: 'movement', minutes: 4, kind: 'movement', states: ['stressed', 'stiff', 'gentle'], description: 'Simple sun salutation sequence' },

  // SOUND/AUDIO (4)
  { id: 'nature-sounds', label: 'Nature Soundscape', category: 'sound', minutes: 3, kind: 'sound', states: ['stressed', 'wired', 'downshift'], description: 'Ocean, rain, or forest sounds' },
  { id: 'binaural-beats', label: 'Binaural Beats', category: 'sound', minutes: 4, kind: 'sound', states: ['anxious', 'scattered', 'steady'], description: 'Frequency tones for brain entrainment' },
  { id: 'humming', label: 'Humming/Toning', category: 'sound', minutes: 2, kind: 'sound', states: ['stressed', 'anxious', 'downshift'], description: 'Hum to activate vagus nerve' },
  { id: 'solfeggio', label: 'Solfeggio Frequencies', category: 'sound', minutes: 3, kind: 'sound', states: ['low', 'tired', 'gentle'], description: 'Healing frequency tones' },

  // MANIFESTATION/MINDSET (4)
  { id: 'affirmations', label: 'Power Affirmations', category: 'mindset', minutes: 2, kind: 'mindset', states: ['low', 'unmotivated', 'upshift'], description: 'Speak empowering statements aloud' },
  { id: 'intention-setting', label: 'Intention Setting', category: 'mindset', minutes: 2, kind: 'mindset', states: ['scattered', 'unmotivated', 'upshift'], description: 'Set a clear intention for your day' },
  { id: 'emotional-release', label: 'Emotional Release', category: 'mindset', minutes: 3, kind: 'mindset', states: ['frustrated', 'angry', 'downshift'], description: 'Acknowledge and release emotions' },
  { id: 'self-compassion', label: 'Self-Compassion Pause', category: 'mindset', minutes: 2, kind: 'mindset', states: ['low', 'self-critical', 'gentle'], description: 'Speak kindly to yourself' },

  // BRAINWAVE FREQUENCIES (5)
  { id: 'alpha-waves', label: 'Alpha Wave Session', category: 'brainwave', minutes: 4, kind: 'brainwave', states: ['stressed', 'anxious', 'downshift'], description: '8-12 Hz - relaxed alertness, calm focus', frequency: 10 },
  { id: 'theta-waves', label: 'Theta Wave Session', category: 'brainwave', minutes: 4, kind: 'brainwave', states: ['wired', 'insomnia', 'downshift'], description: '4-8 Hz - deep relaxation, creativity, meditation', frequency: 6 },
  { id: 'delta-waves', label: 'Delta Wave Session', category: 'brainwave', minutes: 5, kind: 'brainwave', states: ['insomnia', 'exhausted', 'gentle'], description: '0.5-4 Hz - deep sleep, healing, regeneration', frequency: 2 },
  { id: 'beta-waves', label: 'Beta Wave Session', category: 'brainwave', minutes: 3, kind: 'brainwave', states: ['tired', 'unfocused', 'upshift'], description: '12-30 Hz - active thinking, alertness, focus', frequency: 18 },
  { id: 'gamma-waves', label: 'Gamma Wave Session', category: 'brainwave', minutes: 3, kind: 'brainwave', states: ['scattered', 'adhd', 'upshift'], description: '30-100 Hz - peak awareness, cognitive processing', frequency: 40 },

  // ADHD-SPECIFIC (6)
  { id: 'adhd-body-double', label: 'Body Double Focus', category: 'adhd', minutes: 3, kind: 'adhd', states: ['adhd', 'scattered', 'upshift'], description: 'Guided accountability for task initiation' },
  { id: 'adhd-pomodoro', label: 'Micro-Pomodoro', category: 'adhd', minutes: 3, kind: 'adhd', states: ['adhd', 'scattered', 'upshift'], description: '3-min focused sprint with reward' },
  { id: 'adhd-fidget-reset', label: 'Fidget & Reset', category: 'adhd', minutes: 2, kind: 'movement', states: ['adhd', 'restless', 'steady'], description: 'Controlled movement break to reset focus' },
  { id: 'adhd-time-anchor', label: 'Time Anchoring', category: 'adhd', minutes: 2, kind: 'adhd', states: ['adhd', 'time-blind', 'steady'], description: 'Build awareness of time passing' },
  { id: 'adhd-task-chunking', label: 'Task Chunking', category: 'adhd', minutes: 2, kind: 'journal', states: ['adhd', 'overwhelmed', 'steady'], description: 'Break big task into tiny next steps' },
  { id: 'adhd-dopamine-menu', label: 'Dopamine Menu', category: 'adhd', minutes: 2, kind: 'mindset', states: ['adhd', 'unmotivated', 'upshift'], description: 'Quick healthy dopamine hits' },

  // OCD-SPECIFIC (6)
  { id: 'ocd-erp-mini', label: 'Mini ERP Exercise', category: 'ocd', minutes: 4, kind: 'ocd', states: ['ocd', 'compulsive', 'steady'], description: 'Gentle exposure and response prevention' },
  { id: 'ocd-thought-defusion', label: 'Thought Defusion', category: 'ocd', minutes: 3, kind: 'ocd', states: ['ocd', 'intrusive', 'downshift'], description: 'Observe thoughts without engaging' },
  { id: 'ocd-uncertainty-sit', label: 'Sitting with Uncertainty', category: 'ocd', minutes: 3, kind: 'ocd', states: ['ocd', 'anxious', 'steady'], description: 'Build tolerance for not knowing' },
  { id: 'ocd-wave-surfing', label: 'Urge Surfing', category: 'ocd', minutes: 3, kind: 'ocd', states: ['ocd', 'compulsive', 'downshift'], description: 'Ride the urge wave without acting' },
  { id: 'ocd-grounding', label: 'OCD Grounding Reset', category: 'ocd', minutes: 2, kind: 'meditation', states: ['ocd', 'spiraling', 'downshift'], description: 'Break rumination cycle with senses' },
  { id: 'ocd-self-compassion', label: 'OCD Self-Compassion', category: 'ocd', minutes: 2, kind: 'mindset', states: ['ocd', 'self-critical', 'gentle'], description: 'Kindness for intrusive thought struggles' },

  // POSITIVE STATE - AMPLIFY & CHANNEL (8)
  { id: 'flow-activation', label: 'Flow State Activation', category: 'peak', minutes: 3, kind: 'peak', states: ['inspired', 'creative', 'amplify'], description: 'Enter deep creative flow state' },
  { id: 'energy-amplify', label: 'Energy Amplification', category: 'peak', minutes: 2, kind: 'peak', states: ['happy', 'energized', 'amplify'], description: 'Boost and expand positive energy' },
  { id: 'passion-channel', label: 'Passion Channeling', category: 'peak', minutes: 3, kind: 'peak', states: ['passionate', 'motivated', 'amplify'], description: 'Direct passionate energy into action' },
  { id: 'joy-expansion', label: 'Joy Expansion', category: 'peak', minutes: 2, kind: 'meditation', states: ['happy', 'joyful', 'amplify'], description: 'Expand and radiate feelings of joy' },
  { id: 'creative-burst', label: 'Creative Burst', category: 'peak', minutes: 3, kind: 'peak', states: ['inspired', 'creative', 'amplify'], description: 'Capture and channel creative inspiration' },
  { id: 'momentum-builder', label: 'Momentum Builder', category: 'peak', minutes: 2, kind: 'mindset', states: ['motivated', 'energized', 'amplify'], description: 'Build unstoppable forward momentum' },
  { id: 'peak-intention', label: 'Peak State Intention', category: 'peak', minutes: 3, kind: 'mindset', states: ['inspired', 'motivated', 'amplify'], description: 'Set powerful intentions from your peak' },
  { id: 'success-anchor', label: 'Success Anchoring', category: 'peak', minutes: 2, kind: 'peak', states: ['happy', 'confident', 'amplify'], description: 'Create triggers to return to this state' },

  // POSITIVE STATE - GRATITUDE & CONNECTION (6)
  { id: 'gratitude-amplify', label: 'Gratitude Amplification', category: 'connection', minutes: 3, kind: 'journal', states: ['grateful', 'content', 'amplify'], description: 'Deepen and expand gratitude practice' },
  { id: 'love-expansion', label: 'Love Expansion', category: 'connection', minutes: 3, kind: 'meditation', states: ['loving', 'connected', 'amplify'], description: 'Extend love to wider circles' },
  { id: 'appreciation-savor', label: 'Appreciation Savoring', category: 'connection', minutes: 2, kind: 'meditation', states: ['happy', 'content', 'amplify'], description: 'Deeply savor what is good right now' },
  { id: 'connection-ritual', label: 'Connection Ritual', category: 'connection', minutes: 3, kind: 'mindset', states: ['loving', 'connected', 'amplify'], description: 'Strengthen bonds with loved ones' },
  { id: 'celebrate-wins', label: 'Celebrate Your Wins', category: 'connection', minutes: 2, kind: 'journal', states: ['proud', 'accomplished', 'amplify'], description: 'Acknowledge and celebrate achievements' },
  { id: 'pay-it-forward', label: 'Pay It Forward', category: 'connection', minutes: 2, kind: 'mindset', states: ['grateful', 'generous', 'amplify'], description: 'Plan acts of kindness for others' },

  // POSITIVE STATE - VISION & MANIFESTATION (4)
  { id: 'vision-activation', label: 'Vision Activation', category: 'manifest', minutes: 4, kind: 'meditation', states: ['inspired', 'motivated', 'amplify'], description: 'Vividly visualize your ideal future' },
  { id: 'goal-supercharge', label: 'Goal Supercharge', category: 'manifest', minutes: 3, kind: 'journal', states: ['motivated', 'ambitious', 'amplify'], description: 'Clarify and energize your goals' },
  { id: 'abundance-mindset', label: 'Abundance Mindset', category: 'manifest', minutes: 2, kind: 'mindset', states: ['grateful', 'optimistic', 'amplify'], description: 'Shift to abundance thinking' },
  { id: 'confidence-boost', label: 'Confidence Boost', category: 'manifest', minutes: 2, kind: 'mindset', states: ['confident', 'proud', 'amplify'], description: 'Amplify self-belief and confidence' },

  // PANIC / ACUTE ANXIETY - EMERGENCY (5)
  { id: 'panic-sos', label: 'Panic SOS', category: 'panic', minutes: 2, kind: 'panic', states: ['panic', 'acute-anxiety', 'emergency'], description: 'Rapid calming for panic attacks' },
  { id: 'tipp-temperature', label: 'TIPP: Cold Reset', category: 'panic', minutes: 1, kind: 'panic', states: ['panic', 'acute-anxiety', 'emergency'], description: 'Use cold to activate dive reflex' },
  { id: 'panic-grounding', label: 'Emergency Grounding', category: 'panic', minutes: 2, kind: 'panic', states: ['panic', 'dissociated', 'emergency'], description: 'Fast 5-4-3-2-1 sensory anchor' },
  { id: 'safe-place-now', label: 'Safe Place NOW', category: 'panic', minutes: 2, kind: 'meditation', states: ['panic', 'unsafe', 'emergency'], description: 'Rapid safety visualization' },
  { id: 'panic-breathe', label: 'Panic Breathing', category: 'panic', minutes: 2, kind: 'breath', states: ['panic', 'hyperventilating', 'emergency'], description: 'Slow exhale to stop hyperventilation' },

  // SLEEP / INSOMNIA (6)
  { id: 'sleep-onset', label: 'Sleep Onset Ritual', category: 'sleep', minutes: 5, kind: 'sleep', states: ['insomnia', 'cant-sleep', 'sleep'], description: 'Guided transition into sleep' },
  { id: 'racing-thoughts-bed', label: 'Quiet Racing Thoughts', category: 'sleep', minutes: 3, kind: 'sleep', states: ['racing-thoughts', 'wired', 'sleep'], description: 'Empty the mind before sleep' },
  { id: 'body-scan-sleep', label: 'Sleep Body Scan', category: 'sleep', minutes: 4, kind: 'meditation', states: ['insomnia', 'tense', 'sleep'], description: 'Progressive relaxation for sleep' },
  { id: 'middle-night', label: 'Middle of Night Calm', category: 'sleep', minutes: 3, kind: 'sleep', states: ['woke-up', 'cant-sleep', 'sleep'], description: 'Return to sleep after waking' },
  { id: 'worry-dump-sleep', label: 'Bedtime Worry Dump', category: 'sleep', minutes: 2, kind: 'journal', states: ['worried', 'racing-thoughts', 'sleep'], description: 'Write worries to release them' },
  { id: 'sleep-story', label: 'Sleep Story Visualization', category: 'sleep', minutes: 4, kind: 'meditation', states: ['insomnia', 'restless', 'sleep'], description: 'Calming narrative to drift off' },

  // BURNOUT / EXHAUSTION (6)
  { id: 'burnout-acknowledge', label: 'Acknowledge the Burnout', category: 'burnout', minutes: 2, kind: 'mindset', states: ['burnout', 'exhausted', 'burnt'], description: 'Name it without judgment' },
  { id: 'permission-rest', label: 'Permission to Rest', category: 'burnout', minutes: 2, kind: 'mindset', states: ['burnout', 'guilty', 'burnt'], description: 'Release guilt about needing rest' },
  { id: 'energy-audit', label: 'Energy Audit', category: 'burnout', minutes: 3, kind: 'journal', states: ['burnout', 'depleted', 'burnt'], description: 'Identify what drains and fills you' },
  { id: 'boundary-set', label: 'Boundary Setting', category: 'burnout', minutes: 3, kind: 'mindset', states: ['burnout', 'overwhelmed', 'burnt'], description: 'Practice saying no' },
  { id: 'minimum-viable', label: 'Minimum Viable Day', category: 'burnout', minutes: 2, kind: 'journal', states: ['burnout', 'overwhelmed', 'burnt'], description: 'Define the bare minimum' },
  { id: 'tiny-joy', label: 'Tiny Joy Injection', category: 'burnout', minutes: 2, kind: 'mindset', states: ['burnout', 'numb', 'burnt'], description: 'Find one small pleasure' },

  // GRIEF / LOSS (6)
  { id: 'grief-wave', label: 'Riding the Grief Wave', category: 'grief', minutes: 3, kind: 'grief', states: ['grieving', 'loss', 'grief'], description: 'Let grief move through you' },
  { id: 'honor-ritual', label: 'Honoring Ritual', category: 'grief', minutes: 3, kind: 'grief', states: ['grieving', 'missing', 'grief'], description: 'Create space to remember' },
  { id: 'grief-breath', label: 'Grief Breathing', category: 'grief', minutes: 2, kind: 'breath', states: ['grieving', 'heavy', 'grief'], description: 'Breathe through the heaviness' },
  { id: 'continuing-bonds', label: 'Continuing Bonds', category: 'grief', minutes: 3, kind: 'meditation', states: ['grieving', 'missing', 'grief'], description: 'Stay connected to who you lost' },
  { id: 'grief-compassion', label: 'Grief Self-Compassion', category: 'grief', minutes: 2, kind: 'mindset', states: ['grieving', 'struggling', 'grief'], description: 'Be gentle with yourself in grief' },
  { id: 'meaning-making', label: 'Finding Meaning', category: 'grief', minutes: 3, kind: 'journal', states: ['grieving', 'lost', 'grief'], description: 'What does the loss teach you?' },

  // WORK / LIFE TRANSITIONS (6)
  { id: 'morning-activation', label: 'Morning Activation', category: 'transition', minutes: 3, kind: 'transition', states: ['groggy', 'morning', 'transition'], description: 'Energizing start to your day' },
  { id: 'post-work-decompress', label: 'Post-Work Decompress', category: 'transition', minutes: 3, kind: 'transition', states: ['work-stress', 'tension', 'transition'], description: 'Release work and arrive home' },
  { id: 'sunday-reset', label: 'Sunday Reset', category: 'transition', minutes: 4, kind: 'transition', states: ['sunday-scaries', 'dread', 'transition'], description: 'Prepare for the week with calm' },
  { id: 'pre-meeting-calm', label: 'Pre-Meeting Calm', category: 'transition', minutes: 2, kind: 'transition', states: ['nervous', 'presentation', 'transition'], description: 'Center yourself before meetings' },
  { id: 'interview-prep', label: 'Interview Confidence', category: 'transition', minutes: 3, kind: 'transition', states: ['interview', 'nervous', 'transition'], description: 'Build confidence before interviews' },
  { id: 'commute-transition', label: 'Commute Transition', category: 'transition', minutes: 2, kind: 'transition', states: ['commuting', 'transition'], description: 'Mental shift between contexts' },
]

/**
 * Analyze user's check-in text to determine emotional state and needs
 */
export function analyzeCheckIn({ text }) {
  const t = toLower(text)

  const tags = []
  const add = (tag) => {
    if (!tags.includes(tag)) tags.push(tag)
  }

  const hit = (words) => words.some((w) => t.includes(w))

  // Detect emotional states
  if (hit(['anxious', 'anxiety', 'panic', 'nervous', 'worried', 'fear'])) add('anxious')
  if (hit(['stress', 'stressed', 'overwhelmed', 'overwhelm', 'pressure', 'too much'])) add('stressed')
  if (hit(['tired', 'exhausted', 'sleepy', 'burnt', 'burnout', 'drained', 'fatigued'])) add('tired')
  if (hit(['sad', 'down', 'low', 'lonely', 'empty', 'depressed', 'hopeless'])) add('low')
  if (hit(['angry', 'mad', 'irritated', 'frustrated', 'annoyed', 'rage'])) add('irritated')
  if (hit(['wired', 'restless', "can't sleep", 'insomnia', 'racing', 'hyper'])) add('wired')
  if (hit(['focus', 'distracted', 'scattered', 'procrast', 'unfocused'])) add('scattered')
  if (hit(['excited', 'energized', 'great', 'good', 'happy', 'motivated', 'pumped'])) add('up')
  if (hit(['unmotivated', 'lazy', 'stuck', 'blocked', 'uninspired'])) add('unmotivated')
  
  // POSITIVE STATES - for amplification
  if (hit(['inspired', 'inspiration', 'creative', 'creativity', 'ideas flowing', 'in the zone'])) add('inspired')
  if (hit(['passionate', 'passion', 'fired up', 'driven', 'ambitious', 'determined'])) add('passionate')
  if (hit(['in love', 'loving', 'loved', 'connected', 'close', 'intimate', 'warm'])) add('loving')
  if (hit(['joyful', 'joy', 'blissful', 'elated', 'ecstatic', 'thrilled'])) add('joyful')
  if (hit(['grateful', 'thankful', 'blessed', 'appreciative', 'fortunate'])) add('grateful')
  if (hit(['confident', 'unstoppable', 'powerful', 'strong', 'capable', 'invincible'])) add('confident')
  if (hit(['proud', 'accomplished', 'achieved', 'won', 'succeeded', 'did it'])) add('proud')
  if (hit(['content', 'peaceful', 'serene', 'calm', 'at ease', 'satisfied'])) add('content')
  if (hit(['optimistic', 'hopeful', 'positive', 'looking forward', 'bright future'])) add('optimistic')
  if (hit(['generous', 'giving', 'kind', 'helpful', 'want to help'])) add('generous')
  if (hit(['stiff', 'tense', 'tight', 'pain', 'ache', 'sore'])) add('stiff')
  if (hit(['lonely', 'isolated', 'disconnected', 'alone'])) add('lonely')
  if (hit(['self-critical', 'hate myself', 'worthless', 'failure', 'not good enough'])) add('self-critical')
  
  // ADHD-specific detection
  if (hit(['adhd', 'add', 'attention deficit', 'hyperfocus', 'executive function', 'time blind', 'cant start', "can't start", 'task paralysis', 'dopamine'])) add('adhd')
  if (hit(['restless', 'fidget', 'hyperactive', 'impulsive', 'bored easily'])) { add('adhd'); add('restless') }
  
  // OCD-specific detection
  if (hit(['ocd', 'obsessive', 'compulsive', 'intrusive thought', 'intrusive thoughts', 'ruminating', 'rumination', 'checking', 'contamination'])) add('ocd')
  if (hit(['spiral', 'spiraling', 'loop', 'looping', "can't stop thinking", 'stuck in head', 'repetitive thought'])) { add('ocd'); add('spiraling') }
  if (hit(['urge', 'compulsion', 'ritual', 'must do', 'have to do'])) add('compulsive')
  
  // PANIC / ACUTE ANXIETY detection
  if (hit(['panic', 'panic attack', 'panicking', 'freaking out', "can't breathe", 'heart racing', 'dying', 'emergency'])) add('panic')
  if (hit(['hyperventilat', 'breathing fast', 'shallow breath'])) { add('panic'); add('hyperventilating') }
  if (hit(['dissociat', 'unreal', 'detached', 'floating', 'not in my body', 'watching myself'])) { add('panic'); add('dissociated') }
  
  // SLEEP / INSOMNIA detection
  if (hit(["can't sleep", 'cant sleep', 'insomnia', 'wide awake', 'tossing and turning', "won't fall asleep"])) add('insomnia')
  if (hit(['woke up', 'middle of night', '3am', '4am', "can't get back to sleep"])) { add('insomnia'); add('woke-up') }
  if (hit(['racing thoughts', 'mind racing', 'thoughts wont stop', "can't turn off brain", 'overthinking at night'])) add('racing-thoughts')
  
  // BURNOUT detection
  if (hit(['burnout', 'burnt out', 'burned out', 'completely depleted', 'nothing left', 'running on empty'])) add('burnout')
  if (hit(['exhausted', 'drained', 'no energy left', 'beyond tired', 'bone tired'])) { add('burnout'); add('depleted') }
  if (hit(['numb', 'empty', 'going through motions', 'disconnected from work', "don't care anymore"])) { add('burnout'); add('numb') }
  
  // GRIEF / LOSS detection
  if (hit(['grief', 'grieving', 'loss', 'lost someone', 'passed away', 'died', 'death', 'mourning'])) add('grieving')
  if (hit(['miss them', 'missing them', 'miss him', 'miss her', 'wish they were here'])) { add('grieving'); add('missing') }
  if (hit(['heartbroken', 'broken heart', 'devastated', 'shattered'])) add('grieving')
  
  // WORK / TRANSITION detection
  if (hit(['sunday scaries', 'dreading monday', 'dreading work', 'hate mondays'])) add('sunday-scaries')
  if (hit(['after work', 'just got home', 'leaving office', 'end of work day', "can't switch off"])) add('work-stress')
  if (hit(['morning', 'just woke up', 'groggy', 'need to wake up', 'start the day'])) add('morning')
  if (hit(['interview', 'job interview', 'meeting', 'presentation', 'big meeting', 'important call'])) add('presentation')
  if (hit(['commute', 'commuting', 'on my way', 'heading to', 'traveling to work'])) add('commuting')

  // Determine overall state for ritual selection
  // Check for special states first (priority order matters!)
  const hasPanic = tags.includes('panic')
  const hasGrief = tags.includes('grieving')
  const hasBurnout = tags.includes('burnout')
  const hasInsomnia = tags.includes('insomnia') || tags.includes('racing-thoughts')
  const hasTransition = ['sunday-scaries', 'work-stress', 'morning', 'presentation', 'commuting'].some(t => tags.includes(t))
  const hasAdhd = tags.includes('adhd')
  const hasOcd = tags.includes('ocd')
  const hasPositive = ['inspired', 'passionate', 'loving', 'joyful', 'grateful', 'confident', 'proud', 'content', 'optimistic', 'generous'].some(t => tags.includes(t))
  
  const state =
    hasPanic
      ? 'emergency' // HIGHEST PRIORITY - panic needs immediate help
      : hasGrief
        ? 'grief-focus' // Grief needs special handling
        : hasBurnout
          ? 'burnout-focus' // Burnout needs recovery rituals
          : hasInsomnia
            ? 'sleep-focus' // Sleep issues need sleep rituals
            : hasTransition
              ? 'transition-focus' // Work/life transitions
              : hasOcd && (tags.includes('spiraling') || tags.includes('compulsive'))
                ? 'ocd-focus' // Special OCD state
                : hasAdhd
                  ? 'adhd-focus' // Special ADHD state
                  : hasPositive
                    ? 'amplify' // Positive state - amplify the good feelings
                    : tags.includes('stressed') || tags.includes('wired') || tags.includes('anxious')
                      ? 'downshift'
                      : tags.includes('scattered')
                        ? 'steady'
                        : tags.includes('low') || tags.includes('tired') || tags.includes('lonely')
                          ? 'gentle'
                          : tags.includes('up') || tags.includes('unmotivated')
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
  let score = 0
  if (tags.includes('low')) score -= 1
  if (tags.includes('tired')) score -= 1
  if (tags.includes('stressed')) score -= 1
  if (tags.includes('wired')) score -= 1
  if (tags.includes('irritated')) score -= 1
  if (tags.includes('anxious')) score -= 1
  if (tags.includes('lonely')) score -= 1
  if (tags.includes('self-critical')) score -= 1
  if (tags.includes('up')) score += 2
  if (tags.includes('unmotivated')) score -= 0.5
  return clamp(score, -2, 2)
}

function reflectionFor(state, tags) {
  if (state === 'emergency') {
    if (tags.includes('hyperventilating')) return "I hear you. Let's slow your breathing together. You are safe."
    if (tags.includes('dissociated')) return "You're safe. Let's bring you back to your body, gently."
    return "This is intense, but it will pass. I'm here with you. Let's get through this together."
  }
  if (state === 'grief-focus') {
    if (tags.includes('missing')) return "Missing them is a sign of how much you loved. Let yourself feel it."
    return "Grief is love with nowhere to go. Let's honor that love together."
  }
  if (state === 'burnout-focus') {
    if (tags.includes('numb')) return "Feeling nothing is your mind protecting you. Rest is not laziness—it's survival."
    if (tags.includes('depleted')) return "You've given too much. It's time to refill your cup."
    return "Burnout is real. You're not weak—you've been strong for too long."
  }
  if (state === 'sleep-focus') {
    if (tags.includes('racing-thoughts')) return "Your mind is busy. Let's gently quiet it together."
    if (tags.includes('woke-up')) return "Waking up is frustrating. Let's help you drift back."
    return "Sleep will come. Let's prepare your body and mind."
  }
  if (state === 'transition-focus') {
    if (tags.includes('sunday-scaries')) return "The dread is real, but the week hasn't happened yet. Let's find calm."
    if (tags.includes('work-stress')) return "Work stays at work. Let's help you fully arrive home."
    if (tags.includes('morning')) return "A new day, a fresh start. Let's wake up with intention."
    if (tags.includes('presentation')) return "Nerves mean you care. Let's turn that energy into confidence."
    return "Transitions are bridges. Let's cross this one mindfully."
  }
  if (state === 'amplify') {
    if (tags.includes('inspired')) return "That creative spark is powerful. Let's fan it into a flame."
    if (tags.includes('passionate')) return "This fire in you is rare. Let's channel it wisely."
    if (tags.includes('loving')) return "Love is your superpower right now. Let it expand."
    if (tags.includes('joyful')) return "This joy deserves to be savored and shared."
    if (tags.includes('grateful')) return "Gratitude multiplies what you appreciate. Let's deepen it."
    if (tags.includes('confident')) return "You're in your power. Let's anchor this feeling."
    if (tags.includes('proud')) return "You've earned this moment. Let's celebrate properly."
    return "You're in a beautiful state. Let's make the most of it."
  }
  if (state === 'ocd-focus') {
    if (tags.includes('spiraling')) return "The loop feels real, but you can step outside it. Let's break the cycle together."
    if (tags.includes('compulsive')) return "The urge is strong, but you're stronger. Let's ride this wave."
    return "Intrusive thoughts are visitors, not you. Let's create some distance."
  }
  if (state === 'adhd-focus') {
    if (tags.includes('restless')) return "Your brain craves stimulation. Let's give it something healthy."
    if (tags.includes('scattered')) return "Too many tabs open? Let's close a few and focus on one."
    return "ADHD brain works differently. Let's work with it, not against it."
  }
  if (state === 'downshift') {
    if (tags.includes('anxious')) return "Let's calm your nervous system first. You're safe."
    if (tags.includes('stressed')) return "Let's release that pressure. Your body needs to know it's okay."
    if (tags.includes('irritated')) return "Let's channel that energy and find your center."
    return "Let's bring you back to baseline. Slow and steady."
  }
  if (state === 'gentle') {
    if (tags.includes('tired')) return "Go easy on yourself. Small, nurturing steps today."
    if (tags.includes('low')) return "Be gentle with yourself. This too shall pass."
    if (tags.includes('lonely')) return "You're not alone. Let's reconnect with yourself first."
    return "Keep it soft today. You deserve kindness."
  }
  if (state === 'upshift') {
    if (tags.includes('unmotivated')) return "Let's spark some energy and find your why."
    return "Great energy to work with—let's channel it wisely."
  }
  if (tags.includes('scattered')) return "Let's quiet the noise and find your focus."
  return "Let's tune you back into steady. A reset awaits."
}

function recommendationFor(state, tags) {
  if (state === 'emergency') {
    if (tags.includes('hyperventilating')) return 'Exhale slowly. Longer out than in. We will get through this.'
    if (tags.includes('dissociated')) return 'Feel your feet on the ground. Press your palms together. You are here.'
    return 'This will pass. Focus on my voice. Breathe with me.'
  }
  if (state === 'grief-focus') {
    if (tags.includes('missing')) return "There's no wrong way to grieve. Let the tears come if they need to."
    return 'Be gentle with yourself. Grief has no timeline.'
  }
  if (state === 'burnout-focus') {
    if (tags.includes('numb')) return 'Find one tiny thing that brings a flicker of feeling. Start there.'
    if (tags.includes('depleted')) return 'What is ONE thing you can take off your plate today?'
    return 'Rest is productive. Your worth is not your output.'
  }
  if (state === 'sleep-focus') {
    if (tags.includes('racing-thoughts')) return 'Write down what is on your mind. Get it out of your head.'
    if (tags.includes('woke-up')) return "Don't check the time. Keep eyes soft. Breathe slowly."
    return 'Your body knows how to sleep. Trust it.'
  }
  if (state === 'transition-focus') {
    if (tags.includes('sunday-scaries')) return 'Plan one good thing for Monday. Give yourself something to look forward to.'
    if (tags.includes('work-stress')) return 'Change clothes. Wash your face. Physically mark the transition.'
    if (tags.includes('morning')) return 'Avoid your phone for the first 10 minutes. Own your morning.'
    if (tags.includes('presentation')) return 'You know more than you think. Breathe and trust yourself.'
    return 'Mark this moment. Breathe. Now step into what is next.'
  }
  if (state === 'amplify') {
    if (tags.includes('inspired')) return 'Capture this energy now. Create something, even if small.'
    if (tags.includes('passionate')) return 'Channel this fire into your most important goal.'
    if (tags.includes('loving')) return 'Express it. Tell someone. Let love flow outward.'
    if (tags.includes('joyful')) return 'Savor this fully. Anchor it in your body.'
    if (tags.includes('grateful')) return 'Write it down. Gratitude deepens when recorded.'
    if (tags.includes('confident')) return 'Take bold action now while you feel unstoppable.'
    if (tags.includes('proud')) return 'You deserve to celebrate. Acknowledge your wins.'
    return 'Use this positive state to set intentions or take action.'
  }
  if (state === 'ocd-focus') {
    if (tags.includes('spiraling')) return 'Ground yourself in your senses. The loop can wait.'
    if (tags.includes('compulsive')) return "Don't resist the urge—observe it. It will pass."
    return 'Notice the thought. Label it. Let it float by.'
  }
  if (state === 'adhd-focus') {
    if (tags.includes('restless')) return 'Move your body first. Focus comes after.'
    if (tags.includes('scattered')) return 'Pick ONE tiny task. Just the first step.'
    return 'External structure is your friend. Use these tools.'
  }
  if (state === 'downshift') {
    if (tags.includes('anxious')) return 'Start with long exhales. Your body will follow.'
    if (tags.includes('stressed')) return 'Drop your shoulders. Unclench your jaw. Breathe.'
    return "Slow exhales tell your nervous system: we're safe now."
  }
  if (state === 'gentle') {
    if (tags.includes('tired')) return 'Choose rest over hustle. Even 10 minutes matters.'
    if (tags.includes('low')) return "One tiny act of self-care. That's all you need."
    return 'Be kind to yourself. Progress, not perfection.'
  }
  if (state === 'upshift') return 'Set one clear intention. Then protect it.'
  if (tags.includes('scattered')) return 'Write the ONE thing you want done. Just one.'
  return 'Try this 10-minute reset and notice what shifts.'
}

/**
 * Compose a personalized ritual from the 30+ micro-ritual components
 * Based on user's emotional state and detected tags
 * @param {Object} options
 * @param {Object} options.analysis - The check-in analysis
 * @param {number} [options.durationMinutes=10] - Target ritual duration in minutes
 */
export function composeRitual({ analysis, durationMinutes = 10 }) {
  const state = analysis?.state ?? 'steady'
  const tags = analysis?.tags ?? []

  // Get rituals that match the user's state or tags
  const matchingRituals = MICRO_RITUALS.filter((r) =>
    r.states.includes(state) || tags.some((t) => r.states.includes(t))
  )

  // If no matches, use steady-state rituals
  const pool = matchingRituals.length > 0 ? matchingRituals : MICRO_RITUALS.filter((r) => r.states.includes('steady'))

  // Group by category for variety
  const byCategory = {}
  for (const r of pool) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  // Build ritual with target duration
  const ritual = []
  let totalMinutes = 0
  const targetMinutes = durationMinutes
  const usedCategories = new Set()

  // Prioritize categories based on state
  const categoryPriority = getCategoryPriority(state, tags)

  for (const category of categoryPriority) {
    if (totalMinutes >= targetMinutes) break
    if (!byCategory[category] || byCategory[category].length === 0) continue

    const available = byCategory[category].filter((r) => 
      totalMinutes + r.minutes <= targetMinutes + 1 && // Allow slight overflow
      !ritual.some((existing) => existing.id === r.id)
    )

    if (available.length === 0) continue

    // Pick a random ritual from this category
    const selected = pick(available)
    ritual.push(selected)
    totalMinutes += selected.minutes
    usedCategories.add(category)
  }

  // Fill remaining time if needed
  while (totalMinutes < targetMinutes - 1 && pool.length > 0) {
    const available = pool.filter((r) =>
      totalMinutes + r.minutes <= targetMinutes + 1 &&
      !ritual.some((existing) => existing.id === r.id)
    )
    if (available.length === 0) break
    const selected = pick(available)
    ritual.push(selected)
    totalMinutes += selected.minutes
  }

  // Adjust last item to hit exactly 10 minutes if close
  if (ritual.length > 0 && totalMinutes !== targetMinutes) {
    const diff = targetMinutes - totalMinutes
    const last = ritual[ritual.length - 1]
    const adjustedMinutes = clamp(last.minutes + diff, 1, 6)
    ritual[ritual.length - 1] = { ...last, minutes: adjustedMinutes }
  }

  // Sort by a logical flow: emergency → grounding → processing → integration → amplification
  const flowOrder = ['panic', 'grief', 'burnout', 'sleep', 'transition', 'meditation', 'ocd', 'adhd', 'movement', 'breathwork', 'brainwave', 'journaling', 'mindset', 'peak', 'connection', 'manifest', 'sound']
  ritual.sort((a, b) => flowOrder.indexOf(a.category) - flowOrder.indexOf(b.category))

  return ritual.map((r) => {
    const baseSeconds = r.minutes * 60
    
    // For breath rituals, align duration to complete breath cycles
    if (r.kind === 'breath') {
      const breathState = getBreathState(state)
      const { alignedSeconds, cycles, cycleTime } = getAlignedBreathDuration(breathState, baseSeconds)
      
      return {
        ...r,
        seconds: alignedSeconds,
        breathCycles: cycles,
        breathCycleTime: cycleTime,
        breathState,
        script: scriptFor(r.id, { state }),
      }
    }
    
    return {
      ...r,
      seconds: baseSeconds,
      script: scriptFor(r.id, { state }),
    }
  })
}

function getCategoryPriority(state, tags) {
  if (state === 'emergency') {
    // PANIC: fastest calming techniques first
    return ['panic', 'breathwork', 'meditation', 'brainwave', 'movement', 'sound']
  }
  if (state === 'grief-focus') {
    // GRIEF: gentle processing, honoring, self-compassion
    return ['grief', 'meditation', 'mindset', 'journaling', 'breathwork', 'sound', 'brainwave']
  }
  if (state === 'burnout-focus') {
    // BURNOUT: rest, boundaries, tiny joys
    return ['burnout', 'mindset', 'journaling', 'meditation', 'sound', 'brainwave', 'breathwork']
  }
  if (state === 'sleep-focus') {
    // SLEEP: sleep-specific rituals, then relaxation
    return ['sleep', 'brainwave', 'meditation', 'breathwork', 'sound', 'journaling']
  }
  if (state === 'transition-focus') {
    // TRANSITIONS: transition rituals, then energy management
    return ['transition', 'breathwork', 'mindset', 'meditation', 'movement', 'brainwave', 'journaling']
  }
  if (state === 'amplify') {
    // Positive state: prioritize peak performance, connection, manifestation rituals
    return ['peak', 'manifest', 'connection', 'brainwave', 'mindset', 'journaling', 'meditation', 'movement', 'breathwork', 'sound']
  }
  if (state === 'ocd-focus') {
    // OCD: prioritize OCD-specific rituals, then grounding, then breathwork
    return ['ocd', 'meditation', 'breathwork', 'brainwave', 'mindset', 'movement', 'sound', 'journaling']
  }
  if (state === 'adhd-focus') {
    // ADHD: prioritize ADHD-specific rituals, movement for energy regulation, then focus tools
    return ['adhd', 'movement', 'brainwave', 'breathwork', 'mindset', 'meditation', 'journaling', 'sound']
  }
  if (state === 'downshift') {
    return ['breathwork', 'meditation', 'brainwave', 'movement', 'sound', 'journaling', 'mindset']
  }
  if (state === 'gentle') {
    return ['meditation', 'sound', 'brainwave', 'journaling', 'breathwork', 'mindset', 'movement']
  }
  if (state === 'upshift') {
    return ['mindset', 'movement', 'brainwave', 'breathwork', 'journaling', 'meditation', 'sound']
  }
  // steady
  return ['meditation', 'breathwork', 'brainwave', 'journaling', 'mindset', 'movement', 'sound']
}

function scriptFor(ritualId, { state }) {
  const scripts = {
    // Breathwork
    'physiological-sigh': [
      'Double inhale through the nose—short, then full.',
      'Long, slow exhale through the mouth.',
      'This is the fastest way to calm your system.',
      'Repeat 3-5 times.',
    ],
    'box-breathing': [
      'Inhale for 4 counts.',
      'Hold for 4 counts.',
      'Exhale for 4 counts.',
      'Hold empty for 4 counts.',
      'Continue this square pattern.',
    ],
    'extended-exhale': [
      'Inhale gently for 4 counts.',
      'Exhale slowly for 8 counts.',
      'The long exhale activates your rest response.',
      'Let your body soften with each breath.',
    ],
    'alternate-nostril': [
      'Close your right nostril, inhale left.',
      'Close left nostril, exhale right.',
      'Inhale right, close, exhale left.',
      'Continue alternating. Find your rhythm.',
    ],
    '478-breath': [
      'Inhale through nose for 4 counts.',
      'Hold your breath for 7 counts.',
      'Exhale through mouth for 8 counts.',
      'This is a natural tranquilizer for the nervous system.',
    ],
    'energizing-breath': [
      'Quick, sharp inhales through the nose.',
      'Short exhales.',
      "Like you're pumping energy into your body.",
      'Stop if you feel dizzy.',
    ],
    'coherent-breathing': [
      'Inhale for 5 seconds.',
      'Exhale for 5 seconds.',
      '6 breaths per minute creates heart coherence.',
      'Your heart and brain sync up.',
    ],
    'lions-breath': [
      'Inhale deeply through your nose.',
      'Open your mouth wide, stick out tongue.',
      'Exhale with a "HA" sound.',
      'Release any frustration or tension.',
    ],

    // Meditation
    'grounding-54321': [
      'Name 5 things you can see.',
      'Name 4 things you can touch.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
    ],
    'body-scan': [
      'Start at the top of your head.',
      'Slowly scan down—forehead, jaw, neck...',
      'Notice tension. Breathe into it.',
      'Continue down to your toes.',
    ],
    'loving-kindness': [
      'May I be happy. May I be healthy.',
      'May I be safe. May I be at ease.',
      'Now extend this to someone you love.',
      'Then to all beings everywhere.',
    ],
    'visualization': [
      'Close your eyes. Imagine a safe, peaceful place.',
      'See the details—colors, light, textures.',
      'Feel the sensations—temperature, comfort.',
      'Rest here. You are safe.',
    ],
    'mindful-awareness': [
      'Notice your thoughts like clouds passing.',
      "You don't have to follow them.",
      'Just observe. No judgment.',
      'Return to your breath when you drift.',
    ],
    'focus-meditation': [
      'Choose one point of focus—breath, sound, or object.',
      'When your mind wanders, gently return.',
      'This strengthens your attention muscle.',
      'Stay with it.',
    ],

    // Journaling
    'name-it': [
      'Complete this sentence:',
      "\"The real thing I'm feeling right now is...\"",
      'Naming emotions reduces their intensity.',
      'Be honest. No one is reading this.',
    ],
    'gratitude': [
      "Write 3 things you're grateful for today.",
      'They can be tiny—a warm drink, a kind word.',
      'Feel the appreciation in your body.',
      'Gratitude shifts your brain chemistry.',
    ],
    'brain-dump': [
      'Write everything on your mind.',
      "Don't filter. Don't organize.",
      'Just empty it all onto paper.',
      'You can sort it later. For now, release.',
    ],
    'future-self': [
      'Write a letter from your future self.',
      'The version of you who figured this out.',
      'What advice do they have for you today?',
      'Trust their wisdom.',
    ],
    'cognitive-reframe': [
      "Write the thought that's bothering you.",
      'Is it 100% true? What evidence is there?',
      'How else could you see this?',
      'Write a more balanced perspective.',
    ],

    // Movement
    'progressive-relaxation': [
      'Start with your feet. Tense for 5 seconds.',
      'Release. Notice the difference.',
      'Move up—calves, thighs, stomach, arms, face.',
      'Tense, then release each area.',
    ],
    'gentle-stretch': [
      'Roll your neck gently in circles.',
      'Shrug shoulders up, then drop them.',
      'Stretch arms overhead. Side bends.',
      'Move slowly. Listen to your body.',
    ],
    'shaking': [
      'Stand and shake your hands loosely.',
      'Add your arms, shoulders, whole body.',
      'Animals do this to release trauma.',
      'Shake it all out. Let it go.',
    ],
    'power-pose': [
      'Stand tall. Feet hip-width apart.',
      'Hands on hips or arms raised in V.',
      'Chest open. Take up space.',
      '2 minutes changes your hormones.',
    ],
    'yoga-flow': [
      'Start in mountain pose.',
      'Reach up, fold forward.',
      'Step back to plank, lower down.',
      'Upward dog, downward dog. Repeat.',
    ],

    // Sound
    'nature-sounds': [
      'Close your eyes and listen.',
      'Imagine you are in nature.',
      'Ocean waves, rain, or forest.',
      'Let the sounds wash over you.',
    ],
    'binaural-beats': [
      'Put on headphones.',
      'Listen to the pulsing tones.',
      'Your brain waves will sync to the frequency.',
      'Just relax and receive.',
    ],
    'humming': [
      'Take a breath and hum as you exhale.',
      'Feel the vibration in your chest and head.',
      'This stimulates your vagus nerve.',
      'Continue for several breaths.',
    ],
    'solfeggio': [
      'Listen to the healing frequencies.',
      'Different tones affect different aspects.',
      'Let the sound move through you.',
      'No effort needed. Just receive.',
    ],

    // Mindset
    'affirmations': [
      'Speak these words aloud:',
      '"I am capable. I am enough."',
      '"I can handle what comes my way."',
      'Say them like you mean it.',
    ],
    'intention-setting': [
      'Complete this sentence:',
      '"Today, my intention is to..."',
      'Make it specific and positive.',
      'Carry this intention with you.',
    ],
    'emotional-release': [
      "Name the emotion you're holding.",
      'Where do you feel it in your body?',
      'Breathe into that space.',
      'Say: "I acknowledge you. I release you."',
    ],
    'self-compassion': [
      'Place a hand on your heart.',
      'Speak to yourself like a dear friend.',
      "\"This is hard, and that's okay.\"",
      "\"You're doing your best.\"",
    ],

    // BRAINWAVE SESSIONS
    'alpha-waves': [
      'Put on headphones for best effect.',
      'Close your eyes and relax.',
      'Alpha waves promote calm, focused awareness.',
      '8-12 Hz helps reduce stress and anxiety.',
      'Let the frequencies guide your brain to a relaxed state.',
    ],
    'theta-waves': [
      'Find a comfortable position.',
      'Theta waves access deep relaxation and creativity.',
      '4-8 Hz is the frequency of meditation and dreams.',
      'Let go of active thinking.',
      'Allow images and ideas to arise naturally.',
    ],
    'delta-waves': [
      'This is deep healing frequency.',
      'Delta waves are associated with deep sleep.',
      '0.5-4 Hz promotes regeneration and recovery.',
      'Let yourself sink into complete rest.',
      'Your body knows how to heal.',
    ],
    'beta-waves': [
      'Time to energize and focus.',
      'Beta waves sharpen mental alertness.',
      '12-30 Hz activates your thinking mind.',
      'Use this when you need to concentrate.',
      'Feel your mind becoming clearer and sharper.',
    ],
    'gamma-waves': [
      'Gamma waves are peak brain performance.',
      '30-100 Hz enhances memory and cognition.',
      'Associated with insight and "aha" moments.',
      'Stay alert but relaxed.',
      'Let your mind process at its highest level.',
    ],

    // ADHD-SPECIFIC RITUALS
    'adhd-body-double': [
      'Imagine someone is working alongside you.',
      "You're not alone in this task.",
      "Just start. Don't worry about finishing.",
      'Do the first tiny action right now.',
      'External accountability helps ADHD brains focus.',
    ],
    'adhd-pomodoro': [
      '3 minutes of focused work. That is all.',
      'Pick ONE small thing to do.',
      'Set your intention: "I will do X."',
      'When time is up, you get a reward.',
      "You can do anything for 3 minutes. Let's go.",
    ],
    'adhd-fidget-reset': [
      'Stand up and move your body.',
      'Shake your hands, roll your shoulders.',
      'March in place, swing your arms.',
      'ADHD brains need movement to focus.',
      'Now sit back down with fresh energy.',
    ],
    'adhd-time-anchor': [
      'Right now, it is this moment.',
      'How long is one minute? Count it.',
      'Notice how time feels when you pay attention.',
      'Set a timer for your next task.',
      'External time cues help ADHD brains.',
    ],
    'adhd-task-chunking': [
      "What's the task that feels overwhelming?",
      "What's the FIRST tiny step? Write it down.",
      'Make it so small you could do it in 2 minutes.',
      'Now write the next tiny step.',
      "You don't need to see the whole path—just the next step.",
    ],
    'adhd-dopamine-menu': [
      'Your brain needs dopamine to function.',
      'Unhealthy hits: scrolling, snacks, avoidance.',
      'Healthy hits: music, movement, cold water, completing a task.',
      'Pick ONE healthy dopamine hit right now.',
      'Reward your brain the right way.',
    ],

    // OCD-SPECIFIC RITUALS
    'ocd-erp-mini': [
      'We are going to practice sitting with discomfort.',
      'Think of a mild anxiety trigger (1-3 out of 10).',
      'Notice the urge to do a compulsion.',
      "Don't act on it. Just notice.",
      'The anxiety will peak and then decrease on its own.',
    ],
    'ocd-thought-defusion': [
      'Notice the intrusive thought.',
      "Say: \"I'm having the thought that...\"",
      'You are not your thoughts.',
      'Imagine the thought as a cloud floating by.',
      'You can observe it without engaging.',
    ],
    'ocd-uncertainty-sit': [
      "OCD hates uncertainty. Let's practice it.",
      'Think: "I might never know for sure, and that is okay."',
      'Uncertainty is uncomfortable, not dangerous.',
      'Breathe and let the discomfort exist.',
      'You are building tolerance. This is growth.',
    ],
    'ocd-wave-surfing': [
      'The urge to do a compulsion is like a wave.',
      'It will rise, peak, and fall.',
      'You do not need to act on it.',
      'Ride the wave. Breathe through it.',
      'You are stronger than the urge.',
    ],
    'ocd-grounding': [
      "You're caught in a loop. Let's break it.",
      'Name 5 things you can see right now.',
      'Touch something with texture. Describe it.',
      'What can you hear in this moment?',
      'You are here, now. Not in the thought.',
    ],
    'ocd-self-compassion': [
      'Having intrusive thoughts is not your fault.',
      'OCD is a brain pattern, not a character flaw.',
      'Place a hand on your heart.',
      'Say: "I am doing my best with a difficult brain."',
      'You deserve kindness, especially from yourself.',
    ],

    // POSITIVE STATE - AMPLIFY & CHANNEL
    'flow-activation': [
      'Close your eyes. Feel the creative energy.',
      'Let go of judgment. There are no bad ideas.',
      'Visualize yourself fully immersed in your work.',
      'Time dissolves. Only the creation exists.',
      'Now open your eyes and begin. Trust the flow.',
    ],
    'energy-amplify': [
      'Feel the positive energy in your body.',
      'Where is it strongest? Put your attention there.',
      'Breathe into that space. Let it expand.',
      'Imagine it radiating outward, filling the room.',
      'You are a beacon of positive energy.',
    ],
    'passion-channel': [
      'This fire inside you is precious.',
      'What is it calling you to do?',
      'Visualize yourself taking bold action.',
      'Feel the satisfaction of following through.',
      'Now commit: what is your next step?',
    ],
    'joy-expansion': [
      'Smile. Let it be genuine.',
      'Feel the joy in your chest. Let it spread.',
      'Think of someone you love. Send them this joy.',
      'Expand it further. To all beings.',
      'You are a source of light in the world.',
    ],
    'creative-burst': [
      'Your mind is alive with ideas right now.',
      'Capture them. Write, sketch, or speak them aloud.',
      'Do not filter. Do not judge.',
      'Quantity over quality. Let it all pour out.',
      'The gems will reveal themselves later.',
    ],
    'momentum-builder': [
      'You are already in motion. Feel it.',
      'What is the next small action you can take?',
      'Commit to it now. Out loud if possible.',
      'Stack another action on top. Keep going.',
      'Momentum is your superpower. Use it.',
    ],
    'peak-intention': [
      'You are at your best right now.',
      'From this state, what do you truly want?',
      'Speak your intention clearly.',
      'Feel it as if it is already happening.',
      'Carry this intention with you.',
    ],
    'success-anchor': [
      'Notice everything about this moment.',
      'How does your body feel? Where is the energy?',
      'Create a physical gesture to anchor this state.',
      'Press your fingers together, or touch your heart.',
      'This gesture is now your trigger to return here.',
    ],

    // POSITIVE STATE - GRATITUDE & CONNECTION
    'gratitude-amplify': [
      'Think of something you are grateful for.',
      'Now go deeper. Why are you grateful for it?',
      'Feel the appreciation in your body.',
      'Who else contributed to this blessing?',
      'Let gratitude overflow into every cell.',
    ],
    'love-expansion': [
      'Think of someone you love deeply.',
      'Feel that love fully. Let it fill you.',
      'Now extend it to someone you like.',
      'Now to someone neutral. They deserve love too.',
      'Finally, to all beings. May all beings be happy.',
    ],
    'appreciation-savor': [
      'What is good in your life right now?',
      'Choose one thing. Focus on it completely.',
      'Use all your senses. What do you notice?',
      'Let time slow down. Savor this fully.',
      'This moment is enough. You are enough.',
    ],
    'connection-ritual': [
      'Think of someone important to you.',
      'What do you appreciate about them?',
      'When did you last tell them?',
      'Plan a small act of connection this week.',
      'Relationships grow with intentional care.',
    ],
    'celebrate-wins': [
      'What have you accomplished recently?',
      'It does not have to be huge. Small wins count.',
      'Say it out loud: "I did this."',
      'Feel the pride. You earned it.',
      'Now plan your next win.',
    ],
    'pay-it-forward': [
      'Think of kindness you have received.',
      'How did it make you feel?',
      'Who could you share that feeling with?',
      'Plan one small act of kindness this week.',
      'Generosity multiplies. Pass it on.',
    ],

    // POSITIVE STATE - VISION & MANIFESTATION
    'vision-activation': [
      'Close your eyes. Breathe deeply.',
      'Imagine your life 1 year from now, at its best.',
      'See the details. Where are you? Who is there?',
      'How do you feel? What are you proud of?',
      'Hold this vision. It is pulling you forward.',
    ],
    'goal-supercharge': [
      'What is your most important goal right now?',
      'Why does it matter to you? Go deep.',
      'Imagine achieving it. Feel the success.',
      'What is one action you can take today?',
      'Commit to it now. You have the power.',
    ],
    'abundance-mindset': [
      'There is enough for everyone, including you.',
      "Other people's success does not diminish yours.",
      'What abundance already exists in your life?',
      'Say: "I attract opportunities and blessings."',
      'Believe it. The universe responds to your energy.',
    ],
    'confidence-boost': [
      'Stand or sit tall. Take up space.',
      'Recall a time you succeeded against odds.',
      'Feel that confidence. It is still in you.',
      'Say: "I am capable of amazing things."',
      'Now go prove it to yourself.',
    ],

    // PANIC / EMERGENCY
    'panic-sos': [
      'I am here with you. This will pass.',
      'Put your hand on your chest. Feel your heart.',
      'Breathe out slowly. Longer than you breathe in.',
      'You are safe. Your body is just scared.',
      'Keep breathing. The wave is cresting. It will fall.',
    ],
    'tipp-temperature': [
      'Get something cold - ice, cold water, frozen item.',
      'Hold it to your face, wrists, or neck.',
      'The cold activates your dive reflex.',
      'Your heart rate will slow automatically.',
      'Breathe. The cold is helping.',
    ],
    'panic-grounding': [
      'Name 5 things you can see. Say them out loud.',
      '4 things you can touch. Touch them now.',
      '3 things you can hear. Listen.',
      '2 things you can smell.',
      '1 thing you can taste. You are here. You are safe.',
    ],
    'safe-place-now': [
      'Close your eyes. You are going somewhere safe.',
      'Picture a place where nothing can hurt you.',
      'See the colors. Feel the temperature.',
      'You are protected here. Nothing can reach you.',
      'Stay here as long as you need.',
    ],
    'panic-breathe': [
      'Your breathing is fast. That is okay.',
      'We are going to slow it together.',
      'Breathe in for 4 counts.',
      'Now out for 8 counts. Slow and steady.',
      'Keep going. Your body is listening.',
    ],

    // SLEEP / INSOMNIA
    'sleep-onset': [
      'Your body is ready for rest.',
      'Let your eyes close softly.',
      'Each exhale takes you deeper.',
      'There is nothing you need to do.',
      'Just let yourself drift... drift... drift...',
    ],
    'racing-thoughts-bed': [
      'Your mind is busy. That is okay.',
      'Imagine each thought as a leaf on a stream.',
      'Watch it float by. Do not grab it.',
      'Another leaf comes. Let it go too.',
      'The stream keeps flowing. You are just watching.',
    ],
    'body-scan-sleep': [
      'Start at the top of your head. Let it soften.',
      'Your forehead... eyebrows... jaw... all releasing.',
      'Shoulders drop. Arms heavy. Hands open.',
      'Stomach soft. Legs melting into the bed.',
      'You are safe. You are relaxed. Sleep is coming.',
    ],
    'middle-night': [
      'You woke up. That is normal.',
      'Do not check the time. It does not matter.',
      'Keep your eyes soft. Stay in the dark.',
      'Breathe slowly. Your body remembers how to sleep.',
      'Let go... let go... let yourself drift back.',
    ],
    'worry-dump-sleep': [
      'What is on your mind right now?',
      'Write it down or say it out loud.',
      'These worries can wait until morning.',
      'Your job right now is just to rest.',
      'The problems will still be there. You can handle them tomorrow.',
    ],
    'sleep-story': [
      'Imagine you are walking on a quiet beach.',
      'The sand is warm under your feet.',
      'Waves lap gently. The rhythm is soothing.',
      'You find a soft place to lie down.',
      'The sun warms you. You are drifting... drifting...',
    ],

    // BURNOUT
    'burnout-acknowledge': [
      'You are burned out. Say it out loud.',
      '"I am burned out. This is real."',
      'It is not weakness. You gave too much.',
      'Your body and mind need recovery.',
      'Acknowledging it is the first step.',
    ],
    'permission-rest': [
      'You have permission to rest.',
      'Rest is not laziness. It is medicine.',
      'Your worth is not your productivity.',
      'Say: "I am allowed to do nothing."',
      'Mean it. You are allowed.',
    ],
    'energy-audit': [
      'What drained you this week?',
      'Write down the energy vampires.',
      'Now: what filled you up? Even a little?',
      'How can you do less of column A?',
      'How can you do more of column B?',
    ],
    'boundary-set': [
      'Think of something you need to say no to.',
      'Practice saying it: "No, I cannot do that."',
      'You do not need to explain or apologize.',
      '"No" is a complete sentence.',
      'Protecting your energy is not selfish.',
    ],
    'minimum-viable': [
      'Forget the ideal day. What is the minimum?',
      'What absolutely must happen today?',
      'Write down only 1-3 things.',
      'Everything else is bonus.',
      'Doing less is okay. Survival mode is valid.',
    ],
    'tiny-joy': [
      'Burnout makes everything gray.',
      'Can you find one tiny spark of pleasure?',
      'A warm drink? A soft texture? A favorite song?',
      'Do that thing right now if you can.',
      'Joy is built back in tiny pieces.',
    ],

    // GRIEF
    'grief-wave': [
      'Grief comes in waves. One is here now.',
      'You do not have to fight it.',
      'Let it wash over you. Cry if you need to.',
      'The wave will crest and fall.',
      'You will still be here when it passes.',
    ],
    'honor-ritual': [
      'Close your eyes. Picture them.',
      'What do you want to say to them?',
      'Say it out loud or in your heart.',
      'Light a candle, touch a photo, or just remember.',
      'They are still with you in this love.',
    ],
    'grief-breath': [
      'Grief is heavy. It sits on your chest.',
      'Breathe into that weight.',
      'Exhale slowly. Let some heaviness go.',
      'You do not have to carry it all at once.',
      'Breath by breath. Moment by moment.',
    ],
    'continuing-bonds': [
      'They are gone, but the bond is not.',
      'How do you still feel connected to them?',
      'What did they teach you? What lives on?',
      'Carry their best parts forward.',
      'Love does not end with death.',
    ],
    'grief-compassion': [
      'Grief is exhausting. You are doing hard work.',
      'There is no right way to grieve.',
      'Some days will be worse than others.',
      'Be as kind to yourself as you would to a friend.',
      'You are surviving an impossible thing.',
    ],
    'meaning-making': [
      'Loss changes us. That is okay.',
      'What has this taught you about life? About love?',
      'How might you honor them going forward?',
      'Meaning does not erase pain.',
      'But it can help you carry it.',
    ],

    // WORK / LIFE TRANSITIONS
    'morning-activation': [
      'You are awake. A new day begins.',
      'Take a deep breath. Fill your lungs.',
      'Stretch your body. Wake up your muscles.',
      'Set one intention for today.',
      'You are ready. Go gently.',
    ],
    'post-work-decompress': [
      'Work is over. Let it go.',
      'Shake out your hands. Roll your shoulders.',
      'Take 5 deep breaths. Release the tension.',
      'You are no longer at work. You are home.',
      'What do you need right now? Do that.',
    ],
    'sunday-reset': [
      'The week ahead is not here yet.',
      'Right now, you are safe. It is still Sunday.',
      'What is one thing you can look forward to?',
      'Prepare one small thing to make Monday easier.',
      'The week will come. You will handle it.',
    ],
    'pre-meeting-calm': [
      'The meeting is coming. You are prepared enough.',
      'Take three slow breaths.',
      'Unclench your jaw. Drop your shoulders.',
      'You know what you know. Trust yourself.',
      'You are ready.',
    ],
    'interview-prep': [
      'You got this interview for a reason.',
      'They already see potential in you.',
      'Stand tall. Take up space.',
      'Speak slowly. Pause is power.',
      'You are interviewing them too. You have value.',
    ],
    'commute-transition': [
      'You are between places. Use this time.',
      'Let go of where you were.',
      'Prepare for where you are going.',
      'Three breaths to mark the shift.',
      'Arrive fully present.',
    ],
  }

  return scripts[ritualId] ?? [
    'Follow along with this practice.',
    'Stay present with each moment.',
    'Notice how you feel.',
    'Breathe naturally.',
  ]
}
