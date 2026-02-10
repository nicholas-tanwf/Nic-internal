export const SOURCES = [
  {
    id: 'yt-gpt-image',
    publisher: 'YouTube',
    title: 'GPT-5.x: image generation demo (video)',
    url: 'https://www.youtube.com/watch?v=DPBtd57p5Mg',
    publishedAt: '2026-01-15',
    accessedAt: '2026-01-15',
  },
  {
    id: 'yt-gpt-voice',
    publisher: 'YouTube',
    title: 'GPT-5.x: voice demo (video)',
    url: 'https://www.youtube.com/watch?v=4jBcK0cYass',
    publishedAt: '2026-01-15',
    accessedAt: '2026-01-15',
  },
]

export const CLAIMS = [
  {
    id: 'gpt-5x-image-video',
    text: 'Video reference for GPT-5.x image generation capability (as shared).',
    type: 'qualitative',
    sourceIds: ['yt-gpt-image'],
    dateRange: '2026',
  },
  {
    id: 'gpt-5x-voice-video',
    text: 'Video reference for GPT-5.x voice capability (as shared).',
    type: 'qualitative',
    sourceIds: ['yt-gpt-voice'],
    dateRange: '2026',
  },
]

export const ASSETS = [
  {
    id: 'icons-lucide',
    type: 'icon',
    origin: 'lucide-react',
    license: 'ISC',
    attribution: 'Icons by Lucide (ISC).',
  },
  {
    id: 'first-prompt-photos',
    type: 'photo',
    origin: 'user-provided',
    license: 'user-owned',
    attribution:
      'Conference photos provided by the author; ensure you have permission before sharing externally.',
  },
]

