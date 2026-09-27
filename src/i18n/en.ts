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
};
