/**
 * The default language — the reference shape of every dictionary: another language repeats these
 * keys (`const uk: Dictionary = { … }`, texts only from the client's translations). One key per
 * component, texts exactly as on the live Webflow build (the approved copy): copy, image alt, aria-labels,
 * field labels, page titles and descriptions. Nothing here may be invented: a missing text is a `TODO`.
 */
export default {
  pages: {
    home: {
      /* From the visible copy (the Webflow build has only «Kulbit»); the site is noindex for good */
      title: 'Filmmaker Vision x AI Dimension | Kulbit',
      description: 'We blend human creative direction with advanced AI to deliver high-end, brand-aligned videos.',
    },
  },
  siteHeader: {
    /** sr-only name of the logo link */
    logo: 'Kulbit — home',
    projects: 'Projects',
  },
  hero: {
    /** «Filmmaker Vision x AI Dimension»: the accent part is blue */
    title: { lead: 'Filmmaker Vision x', accent: 'AI Dimension' },
    /** One sentence in three blocks; grey parts as on the site */
    statement: {
      blend: 'We blend',
      human: 'human creative direction',
      ai: 'with advanced AI',
      deliver: 'to deliver',
      quality: 'high-end, brand-aligned',
      videos: 'videos.',
    },
    pilot: 'Start Pilot',
    /** sr-only name of the sound toggle (aria-pressed tells on / off) */
    sound: 'Video sound',
  },
  ourClients: {
    /** «Our Clients / Awarded by»: the second part is red */
    title: { lead: 'Our Clients', accent: '/ Awarded by' },
    /** Grey parts as on the site */
    statement: {
      lead: 'Trusted',
      grey: 'by Forward-Thinking Brands across',
      industries: 'iGaming, automobile, Tech, Fashion,',
      amp: '&',
      last: 'Finance.',
    },
    /** Two facts; `next` replaces them when the last set (the festival awards) appears */
    facts: [
      {
        grey: 'Brand work',
        text: 'trusted by industry leaders.',
        next: { grey: 'Festival-recognized cinematic work.', text: '' },
      },
      {
        grey: 'Partnerships at',
        text: 'scale and quality.',
        next: { grey: 'Honored by', text: 'leading international film festivals.' },
      },
    ],
    /** Two lines */
    scroll: ['Scroll to see', 'more'],
    /** alt of the festival awards, in the order of the set */
    awards: [
      'Winner laurel wreath for Creation International Film Festival 2016.',
      'International Music Video Underground Winner 2018 emblem with stylized wings on each side.',
      'Laurel wreath with text: Best Music Video Kyiv Film Festival 2017.',
      "Laurel wreath with text 'BEST Cortometraje Vision'I Corte International Short Film Festival 2017'.",
      'California International Shorts Festival Best Music Video 2017 award laurel wreath design.',
      'Laurel wreaths surrounding text reading Best Video Music Salento International Film Festival 2017.',
    ],
  },
  projects: {
    title: 'Motion Cut',
    label: '/ by kulbit',
    /** alt of the video posters, in the order of the cards */
    posters: [
      'Three futuristic motorcyclists racing on a desert road with neon and fiery effects at sunset.',
      'Close-up of a dark futuristic robot head with a glowing blue horizontal visor in a dim setting.',
    ],
    /** The last card: «more soon...», the second word red */
    soon: { lead: 'more', accent: 'soon...' },
    soonAlt: 'Meditating samurai in a mossy forest with pink blossoms and a katana planted in the ground.',
  },
  ourServices: {
    title: 'our Services',
    /** One sentence; the grey parts as on the site */
    statement: [
      { text: 'A Comprehensive', grey: true },
      { text: 'AI Production', grey: false },
      { text: 'Architecture. From', grey: true },
      { text: 'strategic concept to global', grey: false },
      { text: 'scale.', grey: true },
    ],
    /**
     * The five cards in order: the red meta line(s), two columns of paragraphs (`list`: two bulleted lists) and the
     * tags. Card 3's texts come from Figma (the Webflow build repeats card 1 there); card 4 has no meta line.
     */
    cards: [
      {
        title: '1. Strategy & Pre-Visualization',
        meta: ['Timeline: 1–2 Weeks'],
        list: false,
        columns: [
          ['Script & Scenario Development, Creative Direction, AI Storyboarding, Concept Frames.', 'The blueprint of success.'],
          [
            'We lock the visual language and narrative arc before production begins, ensuring total alignment and eliminating costly downstream revisions.',
          ],
        ],
        tags: ['Creative Direction', 'Concept', 'AI Storyboarding', 'visual language'],
      },
      {
        title: '2. Brand Videos',
        meta: ['Timeline: 4–8 Weeks', 'Specs: 60–120 Seconds.'],
        list: false,
        columns: [
          [
            'Cinematic Brand Storytelling & Corporate Identity Films.',
            'High-fidelity, narrative-driven assets designed to define your market position.',
          ],
          ['We fuse emotional storytelling with high-end AI visuals to build long-term brand equity.'],
        ],
        tags: ['Storytelling', 'high-end AI visuals', 'Corporate Identity'],
      },
      {
        title: '3. Product Videos (KPI-Driven)',
        meta: ['Timeline: 3–4 Weeks'],
        list: false,
        columns: [
          [
            'The KPIs: Optimized for CVR (Conversion Rate), CTR (Click-Through Rate), VTR (View-Through Rate), CPV (Cost Per View), and ROAS (Return on Ad Spend).',
          ],
          [
            'Performance-first assets engineered to stop the scroll. We iterate rapidly on hooks and visuals to maximize your media spend efficiency.',
          ],
        ],
        tags: ['Optimization', 'Conversion Rate', 'AD', 'Performance'],
      },
      {
        title: '4. Global Scale & Adaptation',
        meta: [],
        list: false,
        columns: [
          ['50+ Languages Global Localization & Dynamic Video Variations.', 'Instantly adapt your master asset for any market.'],
          [
            'We utilize AI for lip-syncing and cultural adaptation, allowing you to launch global campaigns from a single creative source.',
          ],
        ],
        tags: ['50+ Languages', 'Localization', 'global campaigns'],
      },
      {
        title: '5. Extended Capabilities',
        meta: ['Product Showcase / 360° Videos'],
        list: true,
        columns: [
          ['Social Media Viral Videos', 'Explainer & Educational Content'],
          ['Motion Graphics', 'High-End 3D & Animation'],
        ],
        tags: ['Motion', 'High-End 3D', 'Social Media'],
      },
    ],
  },
  /** The screen between Our Services and the working process: the label, the statement and the pilot button */
  workingProcessIntro: {
    title: 'Working process',
    /** One sentence; the grey parts as on the site */
    statement: [
      { text: 'Simple. Transparent. Proven. A streamlined', grey: false },
      { text: 'workflow designed for the', grey: true },
      { text: 'speed', grey: false },
      { text: 'of', grey: true },
      { text: 'modern marketing.', grey: false },
    ],
    pilot: 'Start Your Pilot',
  },
  /** The working process: the diagram (its legend and the weeks under it) and the three stage cards */
  workingProcess: {
    /** The legend of the diagram: the blue line and the red one */
    legend: { kulbit: 'Kulbit', traditional: 'Traditional' },
    /** Under the diagram, left to right */
    weeks: ['(Week 1)', '(Week 2-3)', '(Week 4-8)', '(16 Weeks)'],
    /** Per stage: the label, the title, «The “Why”» in two lines and the tags by rows (one row = one branch of the
     * dashed line) */
    stages: [
      {
        label: 'Stage 1:',
        title: 'Concept & Control',
        why: [
          'The “Why”:',
          '“We lock the narrative and visual flow before generation begins. By defining the ‘bones’ of the video using traditional storyboards, we eliminate the randomness of AI.”',
        ],
        tags: [['Creative Brief'], ['Production-Ready Scripting'], ['Storyboard']],
      },
      {
        label: 'Stage 2:',
        title: 'AI Visualization & Preview',
        why: [
          'The “Why”:',
          '“This is the new Mood Board. Instead of static references, we generate actual AI style frames. You see the look, feel, and lighting early, allowing for instant iteration without cost.”',
        ],
        tags: [['Style Frames'], ['Motion Tests'], ['Style Transfer']],
      },
      {
        label: 'Stage 3:',
        title: 'Hybrid Mastery & Production',
        why: [
          'The “Why”:',
          '“Where raw AI meets human craftsmanship. Our compositors, animators, and sound engineers refine the output, removing artifacts and ensuring broadcast-standard audio-visual quality.”',
        ],
        tags: [['Mastering', 'High-Res Generation'], ['3D Integration', 'Sound Design'], ['Motion Graphics']],
      },
    ],
    /** Two lines */
    scroll: ['Scroll to see', 'more'],
  },
  /** Accessible names of the video player controls (the Webflow build has none: its controls are divs) */
  projectVideo: {
    start: 'Play video',
    play: 'Play',
    pause: 'Pause',
    seek: 'Seek',
    volume: 'Volume',
    fullscreen: 'Fullscreen',
  },
};
