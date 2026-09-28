/**
 * The default language — the reference shape of every dictionary: another language repeats these
 * keys (`const uk: Dictionary = { … }`, texts only from the client's translations). One key per
 * component, texts exactly as on the live Webflow build (the approved copy): copy, image alt, aria-labels,
 * field labels, page titles and descriptions. Nothing here may be invented: a missing text is a `TODO`.
 */
export default {
  pages: {
    home: {
      /* From the visible copy (the Webflow build has only «Kulbit»): the services first, the brand last; the
       * description is not the hero paragraph. The site is noindex for good: these are the tab and the share card */
      title: 'AI-Elevated Brand & Product Video Production | Kulbit',
      description:
        'Cinematic brand stories, KPI-driven product videos and localization into 50+ languages: human creative direction and advanced AI, from strategy to launch.',
      /** og:image:alt — the share card: the hero frame (public/og/og-home.jpg from src/assets/og/og-home.jpg) */
      ogImageAlt: 'Kulbit: «Filmmaker Vision x AI Dimension» over a couple walking to a helicopter in front of a city skyline',
    },
    /** src/pages/404.astro — not in the design or the Webflow build: the standard texts of a missing page (noindex) */
    notFound: {
      title: 'Page not found | Kulbit',
      description: 'This page does not exist or has moved. Go back to the home page of Kulbit.',
      label: '404',
      heading: 'Page not found',
      text: 'This page does not exist or has moved.',
      home: 'Back to home',
    },
  },
  siteHeader: {
    projects: 'Projects',
  },
  /** The logo link (ui/Logo: the header and the footer) */
  logo: {
    /** sr-only name of the link */
    home: 'Kulbit — home',
  },
  hero: {
    /** «Filmmaker Vision x AI Dimension»: the accent part is blue and never breaks (a no-break space, as on the site) */
    title: { lead: 'Filmmaker Vision x', accent: 'AI\u{a0}Dimension' },
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
  /** The intro screen (IntroScreen) before the working process: the label, the statement and the pilot button */
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
    weeks: ['(Week 1)', '(Week 2–3)', '(Week 4–8)', '(16 Weeks)'],
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
  /** The intro screen (IntroScreen) before the comparison: the label (`accent` blue), the statement, the pilot button */
  traditionalProductionIntro: {
    title: 'Traditional Production',
    accent: '/ vs kulbit',
    /** One sentence; the grey parts as on the site */
    statement: [
      { text: 'Faster. Smarter. More Flexible.', grey: false },
      { text: 'Why', grey: true },
      { text: 'leading brands', grey: false },
      { text: 'are switching to the', grey: true },
      { text: 'Hybrid AI Model.', grey: false },
    ],
    pilot: 'Start Your Pilot',
  },
  /** Traditional production vs KULBIT: the axes of the radar and the table — its head and three groups of cards */
  traditionalProduction: {
    /** The axes of the radar, in the order of the Webflow build (top, left, bottom, bottom right, right) */
    axes: ['Timeline', 'Budget', 'Scalability', 'Creativity', 'Flexibility'],
    /** The head of the table: `accent` stands on its own line on desktop. Traditional is all red; scramble rewrites
     * it to KULBIT (the accent blue) when the KULBIT group starts */
    head: {
      traditional: { accent: 'Traditional', text: 'Production House' },
      kulbit: { accent: 'KULBIT', text: 'AI-Elevated Production' },
    },
    /**
     * The red group — texts from Figma (node 4033:2296; the Webflow build repeats the KULBIT copy here) — and the
     * KULBIT group: the label and the text (two items = two lines; `lead` stands on its own line before it)
     */
    traditional: [
      { label: 'Timeline:', text: ['3–12 Months. Linear, slow approval cycles.'] },
      // Figma has «Costs.Crew» (no space): a typo, fixed with a space — TODO: confirm with the client
      { label: 'Cost Structure:', text: ['High Fixed Costs. Crew, travel, insurance, rentals.'] },
      { label: 'Flexibility:', text: ['Rigid. Changes require expensive reshoots.'] },
      { label: 'Scalability:', lead: 'Linear', text: ['1 Shoot = 1 Video.'] },
    ],
    kulbit: [
      { label: 'Timeline:', text: ['6–12 Weeks. Agile, iterative generation.'] },
      {
        label: 'Cost Structure:',
        text: [
          'Up to 60% more value per dollar — without compromising quality',
          'Your budget fuels creative output, not production overhead.',
        ],
      },
      { label: 'Flexibility:', text: ['Fluid. A production model that moves with the idea, not against it.'] },
      { label: 'Scalability:', lead: 'Exponential', text: ['1 Asset = 50+ Variations.'] },
    ],
    /** The third group (KULBIT, an icon instead of the bar) */
    advantages: [
      { label: 'Capture Market Trends:', text: 'Launch campaigns while demand is still relevant.' },
      { label: 'Media Reinvestment:', text: 'Savings can be reallocated to ad spend or A/B testing.' },
      { label: 'Risk Mitigation:', text: 'Adjust the asset quickly if market feedback changes.' },
      { label: 'Personalization:', text: 'Utilize unique versions for every audience segment.' },
    ],
  },
  /**
   * The quick jump between the screens (SectionNav): the name of the nav, the name of the arrow that opens the panel
   * and one item per screen in the order of the page. TODO: provisional items (the screens' headings) until the designer's mockup
   */
  sectionNav: {
    label: 'Sections',
    toggle: 'Menu',
    items: [
      'Hero',
      'Our Clients',
      'Motion Cut',
      'Our Services',
      'Working process',
      'Working process: stages',
      'Traditional Production',
      'Traditional vs KULBIT',
      'Footer',
    ],
    /** The toggle at the end of the panel that stops the autoplaying background videos (WCAG 2.2.2); aria-pressed
     * tells its state. Not in the design (the panel is provisional) */
    pauseVideo: 'Pause background video',
  },
  /** The footer: the copyright line, its three columns (the Webflow copy) and the names of the icon links */
  siteFooter: {
    /** After «© <year>» */
    rights: 'All rights reserved.',
    explore: { title: 'Explore', showreel: 'Showreel' },
    about: {
      title: 'about',
      tagline: 'Filmmaker Vision x AI Dimension',
      /** One sentence; the grey parts as on the site */
      text: [
        { text: 'We blend', grey: true },
        { text: 'human creative', grey: false },
        { text: 'direction', grey: true },
        { text: 'with advanced AI', grey: false },
        { text: 'to deliver high-end, brand-aligned videos.', grey: true },
      ],
      discuss: 'Let’s discuss',
    },
    contact: {
      title: 'contact us',
      support: 'Support team',
      partnership: 'partnership',
      /** sr-only names of the icon links (Webflow: their aria-labels) */
      linkedin: 'Linkedin — Profile',
      email: 'Gmail — Send Email',
    },
  },
  /** Accessible names of the video player controls (the Webflow build has none: its controls are divs) */
  projectVideo: {
    start: 'Play video',
    play: 'Play',
    pause: 'Pause',
    seek: 'Seek',
    volume: 'Volume',
    /** ≤ 991px the volume button only mutes (no slider): its name, aria-pressed = muted */
    mute: 'Mute',
    fullscreen: 'Fullscreen',
  },
  /**
   * The contact popup «Get in touch» (ContactPopup; Figma Bal5wro2NSbQThh828lSi7, 4033:9269): texts as in Figma. The
   * brackets of the placeholders («[ Your Name ]») are drawn by ui/Input, not part of these texts
   */
  contactPopup: {
    title: 'Get in touch',
    /** The two sentences on the left (desktop); the grey parts as in Figma */
    intro: [
      [
        { text: 'Have an', grey: true },
        { text: 'idea worth exploring?', grey: false },
      ],
      [
        { text: 'Share the details in the form below', grey: false },
        { text: 'and let’s start the conversation.', grey: true },
      ],
    ],
    /** sr-only name of ✕ and the label of the button under «Thank you!» (not in Figma) */
    close: 'Close',
    name: { label: 'name', placeholder: 'Your Name' },
    email: { label: 'Email Address', placeholder: 'example@mail.com' },
    subjects: {
      legend: 'subject of the message',
      /** The mobile list's button with nothing chosen. TODO: not in Figma (the mobile frames show a choice) — confirm */
      choose: 'Choose a variant',
      /** One label per value of SUBJECTS (worker/validate.ts); the mobile list shows the same labels */
      options: {
        strategy: 'Strategy & Pre-Visualization',
        'brand-videos': 'Brand Videos',
        'product-videos': 'Product Videos',
        'global-campaigns': 'global campaigns',
        'social-media': 'Social Media',
        other: 'Other',
      },
    },
    message: { label: 'your message', placeholder: 'Example Text' },
    /** Not in Figma: the client's decision (a checkbox before the button) */
    consent: 'I agree to the processing of my personal data to receive a reply.',
    submit: 'Submit message',
  },
  /**
   * The states of every form (ui/Form + src/scripts/form.ts): `error<Code>` per code of worker/validate.ts, `errorRate`
   * (429), `error` (the server or the network). The success texts are the client's; the error texts are the template's
   * defaults adapted to the popup's fields — TODO: confirm with the client
   */
  form: {
    sending: 'Sending…',
    successTitle: 'Thank you!',
    success: 'Your message has been sent. We’ll get back to you soon.',
    error: 'The message could not be sent. Please try again later.',
    errorEmailRequired: 'Enter your email address',
    errorEmail: 'Check the email address',
    errorSubject: 'Choose at least one subject of the message',
    errorConsent: 'Confirm the consent to the processing of your personal data',
    errorLength: 'The text is too long',
    errorRate: 'Too many attempts. Please wait a minute and try again.',
  },
  /** The screen a phone held sideways gets (the Webflow build's .landscape-popup), texts as on the build */
  landscapePopup: {
    title: 'Explore better experience',
    text: 'please rotate phone to portrait mode or open the site on a desktop.',
  },
};
