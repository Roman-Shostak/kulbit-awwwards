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
