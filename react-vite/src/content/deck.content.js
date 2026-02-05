export const SECTIONS = [
  {
    id: 's1',
    label: { en: '01', zh: '01' },
    a11yLabel: { en: 'Slide 1', zh: '第 1 页' },
    icon: 'spark',
    slides: ['s1'],
  },
  {
    id: 's2',
    label: { en: '02', zh: '02' },
    a11yLabel: { en: 'Slide 2', zh: '第 2 页' },
    icon: 'bolt',
    slides: ['s2'],
  },
  {
    id: 's3',
    label: { en: '03', zh: '03' },
    a11yLabel: { en: 'Slide 3', zh: '第 3 页' },
    icon: 'globe',
    slides: ['s3'],
  },
  {
    id: 's4',
    label: { en: '04', zh: '04' },
    a11yLabel: { en: 'Slide 4', zh: '第 4 页' },
    icon: 'target',
    slides: ['s4'],
  },
]

export const SLIDES = [
  {
    id: 's1',
    sectionId: 's1',
    title: {
      en: "Key findings of First Prompt — Asia's Flagship AI Conference",
      zh: 'First Prompt 关键发现 — 亚洲旗舰 AI 大会',
    },
    subtitle: {
      en: 'A concise team brief (4 slides) • Photos + reference videos included',
      zh: '团队简报（4 页）• 含现场照片 + 参考视频',
    },
    layout: 'title',
    heroImage: {
      src: '/photos/first-prompt/panel-borders.jpeg',
      alt: {
        en: 'Panel discussion on stage with audience in foreground.',
        zh: '舞台圆桌讨论，前景为观众。',
      },
    },
    companies: [
      {
        name: 'OpenAI',
        logoSlug: 'openai',
      },
      {
        name: 'Agora',
        logoSlug: 'agora',
      },
      {
        name: 'Moonshot AI',
        logoSlug: 'moonshot',
      },
      {
        name: 'Google DeepMind',
        logoSlug: 'google',
      },
      {
        name: 'AWS',
        logoSlug: 'amazonwebservices',
      },
      {
        name: 'Alibaba Cloud',
        logoSlug: 'alibabacloud',
      },
      {
        name: 'Notion',
        logoSlug: 'notion',
      },
      {
        name: 'Transfong Ventures',
      },
      {
        name: 'Granite Asia',
      },
      {
        name: 'Lightspeed',
        logoSlug: 'lightspeed',
      },
      {
        name: 'Airwallex',
        logoSlug: 'airwallex',
      },
      {
        name: 'WIZ.AI',
        logoSlug: 'wiz',
      },
      {
        name: 'January Capital',
      },
      {
        name: 'Oracle',
        logoSlug: 'oracle',
      },
      {
        name: 'Menlo Research',
      },
      {
        name: 'Augmentus Robotics',
      },
    ],
    claims: [],
  },
  {
    id: 's2',
    sectionId: 's2',
    title: { en: 'Insight 1 — AI is becoming a teammate', zh: '洞察 1 — AI 正在成为“队友”' },
    subtitle: {
      en: 'From chatbot → tool → teammate (2026)',
      zh: '从 Chatbot → Tool → Teammate（2026）',
    },
    layout: 'bento',
    tiles: [
      {
        kind: 'bullet',
        id: 's2-1',
        title: { en: 'THE SHIFT', zh: '趋势' },
        body: {
          en: 'AI is moving from “answering” to “doing” — a teammate that executes.',
          zh: 'AI 正从“回答”走向“执行”——成为能交付的队友。',
        },
      },
      {
        kind: 'bullet',
        id: 's2-2',
        title: { en: 'BUSINESS VALUE', zh: '价值' },
        body: {
          en: 'Economic value for businesses, personal super-assistants, and automated teammates for developers.',
          zh: '为企业创造经济价值：个人超级助理 + 开发者自动化队友。',
        },
      },
      {
        id: 's2-3',
        kind: 'image',
        title: { en: ' ', zh: ' ' },
        src: '/photos/first-prompt/evolution.jpeg',
        alt: {
          en: 'Conference room with a slide titled “Evolution of AI deployment”.',
          zh: '会议现场，屏幕展示“AI 部署演进”。',
        },
      },
    ],
    claims: [],
  },
  {
    id: 's3',
    sectionId: 's3',
    title: { en: 'Insight 2 — Speed + voice wins', zh: '洞察 2 — 速度 + 语音决定体验' },
    subtitle: {
      en: 'Lower latency + voice-first workflows change what’s possible',
      zh: '更低延迟 + 语音优先工作流，让新用法变得可行',
    },
    layout: 'bento',
    tiles: [
      {
        id: 's3-0',
        kind: 'metric',
        title: { en: 'TIMELINE SIGNAL', zh: '时间信号' },
        value: 'Q1 2026',
      },
      {
        id: 's3-1',
        kind: 'bullet',
        title: { en: 'GPT-5.x CAPABILITIES', zh: 'GPT-5.x 能力' },
        body: {
          en: 'Expected upgrades: stronger financial modelling + data analysis, better image generation, and more natural voice.',
          zh: '预期升级：更强的财务建模与数据分析、更好的图像生成、更自然的语音能力。',
        },
      },
      {
        id: 's3-2',
        kind: 'bullet',
        title: { en: 'VOICE IS BECOMING THE UI', zh: '语音正在成为入口' },
        body: {
          en: 'The conversation kept returning to: lag reduction, real-time translation, and seamless transcription. This opens the floor to “what else can voice do?” across workflows.',
          zh: '大家反复提到：降低延迟、实时翻译、无缝转写。这也引出一个问题：语音还能如何重塑更多工作流？',
        },
      },
      {
        id: 's3-3',
        kind: 'video',
        title: { en: 'Image gen', zh: '图像生成' },
        youtubeUrl: 'https://www.youtube.com/watch?v=DPBtd57p5Mg',
      },
      {
        id: 's3-4',
        kind: 'video',
        title: { en: 'Voice', zh: '语音' },
        youtubeUrl: 'https://www.youtube.com/watch?v=4jBcK0cYass',
      },
      {
        id: 's3-2b',
        kind: 'image',
        title: { en: ' ', zh: ' ' },
        src: '/photos/first-prompt/waiting-latency.jpeg',
        alt: {
          en: 'Slide titled “Waiting Kills the Conversation” with latency thresholds.',
          zh: '标题为“Waiting Kills the Conversation”的演示页，展示延迟阈值。',
        },
      },
      {
        id: 's3-5',
        kind: 'image',
        title: { en: ' ', zh: ' ' },
        src: '/photos/first-prompt/gpt-5-thinking.jpeg',
        alt: {
          en: 'Speaker on stage with a benchmark slide in the background.',
          zh: '演讲者在台上，背景为基准测试演示页。',
        },
      },
    ],
    claims: [],
  },
  {
    id: 's4',
    sectionId: 's4',
    title: { en: 'Insight 3 — The operating system of adoption', zh: '洞察 3 — 落地的“操作系统”' },
    subtitle: {
      en: 'Simplicity, readiness, and the global landscape',
      zh: '简洁性、就绪度与全球格局',
    },
    layout: 'bento',
    tiles: [
      {
        id: 's4-1',
        kind: 'bullet',
        title: { en: 'CLAUDE BUZZ', zh: 'CLAUDE 热议' },
        body: {
          en: 'A lot of buzz on what “agents” mean for non‑technical people (AI as a daily teammate, not a technical tool).',
          zh: '大家都在讨论：Agent 对非技术人群意味着什么（AI 作为日常队友，而不是技术工具）。',
        },
      },
      {
        id: 's4-2',
        kind: 'bullet',
        title: { en: 'INFRA READYNESS', zh: '基础设施就绪' },
        body: {
          en: 'Adoption fails without data + governance + security, and teams are actively simplifying workflows.',
          zh: '没有数据 + 治理 + 安全，AI 落地就会失败；团队也在主动简化工作流。',
        },
      },
      {
        id: 's4-3',
        kind: 'bullet',
        title: { en: 'TOOL SPRAWL', zh: '工具泛滥' },
        body: {
          en: 'Too many tools creates complexity, overwhelms teams, and reduces productivity — intuitive, easy-to-use systems are winning.',
          zh: '工具太多会制造复杂度、让团队不堪重负并降低生产力——直观、易用的系统更容易赢。',
        },
      },
      {
        id: 's4-4',
        kind: 'bullet',
        title: { en: 'CHINA × US', zh: '中美格局' },
        body: {
          en: 'China and the US remain dominant. Models trained in China vs globally can diverge due to training constraints.',
          zh: '中美仍是主导力量。中国境内训练的模型与全球训练模型可能因训练约束不同而出现差异。',
        },
      },
      {
        kind: 'bullet',
        id: 's4-5-sg',
        title: { en: 'SINGAPORE SIGNAL', zh: '新加坡信号' },
        body: {
          en: 'Singapore is emerging as a key destination for tech talent; companies are scaling here (e.g., Notion continuing expansion this year).',
          zh: '新加坡正成为科技人才的重要目的地；公司在此持续扩张（例如 Notion 今年仍在持续扩张）。',
        },
      },
      {
        id: 's4-img-1',
        kind: 'image',
        title: { en: ' ', zh: ' ' },
        src: '/photos/first-prompt/stage-trio.jpeg',
        alt: {
          en: 'Stage scene with multiple speakers and audience.',
          zh: '多位讲者在台上，观众在台下观看。',
        },
      },
      {
        id: 's4-img-2',
        kind: 'image',
        title: { en: ' ', zh: ' ' },
        src: '/photos/first-prompt/stage-wide.jpeg',
        alt: {
          en: 'Wide shot of the audience watching a stage talk.',
          zh: '观众席全景，观看台上演讲。',
        },
      },
      {
        id: 's4-6',
        kind: 'bullet',
        title: { en: 'CLOSING LINE', zh: '收尾' },
        body: {
          en: 'It’s not about doing something different. It’s about doing it better.',
          zh: '不是做不一样的事，而是把事情做得更好。',
        },
      },
    ],
    claims: [],
  },
]

