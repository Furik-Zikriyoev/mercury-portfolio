import type { Messages } from './ru'

const en = {
  meta: {
    title: 'Furuzonfar Zikriyoev — Frontend Developer & UI Designer',
    description:
      'Furuzonfar Zikriyoev — Frontend Developer and UI Designer based in Tashkent. Vue, TypeScript, WebGL, Figma.',
  },
  a11y: {
    switchLang: 'Switch language',
    nav: 'Section navigation',
  },
  nav: {
    menu: 'Menu',
    scrolled: 'Read',
    timezone: 'Tashkent · UTC+5',
    copy: 'Copy number',
    copied: 'Copied',
    sections: {
      hero: 'Home',
      sandbox: 'Sandbox',
      manifesto: 'Approach',
      about: 'About',
      experience: 'Experience',
      specs: 'Skills',
      work: 'Work',
      contact: 'Contacts',
    },
  },
  intro: {
    skip: 'Skip',
  },
  hero: {
    firstName: 'Furuzonfar',
    lastName: 'Zikriyoev',
    role: 'Frontend Developer & UI Designer',
    status: 'Open to opportunities',
    location: 'Tashkent',
    localTime: 'Tashkent time',
    cta: 'Get in touch',
    scroll: 'Scroll',
  },
  sandbox: {
    title: 'Touch the metal',
    lead: 'This is not a video. The liquid metal is computed in your browser in real time: one WebGL shader and drop physics.',
    tips: ['Press and hold inside — the metal follows your cursor', 'Move nearby — the drops run away'],
    tipsTouch: ['Touch and drag — the metal follows your finger', 'Turn on tilt and rotate your phone'],
    spec: 'WebGL2 · one shader · up to 30 drops',
    gravity: 'Gravity',
    shake: 'Shake',
    split: 'Split',
    gather: 'Gather',
    add: 'Add',
    tilt: 'Tilt',
    drops: 'drops',
    fallback: 'Your browser does not support WebGL2, so the mercury is missing here.',
  },
  manifesto: {
    text: 'I start with the problem, not with a pretty picture. I work out the structure and prototype in *Figma*, build the interface with *Vue* and *TypeScript* and polish the details: states, spacing, motion, performance. Design and code do not argue with each other when *one person* does both.',
  },
  about: {
    paragraphs: [
      'I am a frontend developer and UI designer. I graduated from KNRTU in Kazan with a degree in Information Systems and Technology. My thesis project is DotaAI, an intelligent personal analytics system for Dota 2 players.',
      'At the BO/BO web studio I ran client projects: concept, design, markup, delivery. I built over 15 demo sites on Tilda for the studio portfolio and 7 finished projects for clients, mostly online stores.',
      'I have been teaching myself design for over five years. At university I led the design team of the student union media center: built the team and grew it, created visual identities for university projects and contests.',
    ],
    facts: [
      { value: 5, prefix: '', suffix: '+', label: 'years of graphic design' },
      { value: 7, prefix: '', suffix: '', label: 'sites delivered to clients' },
      { value: 15, prefix: '', suffix: '+', label: 'demo sites for the studio' },
      { value: 2, prefix: '#', suffix: '', label: 'at a national fintech programming hackathon' },
    ],
    extraLabel: 'Beyond code',
    extra: 'Candidate Master of Sport in tennis. I enjoy building PCs.',
    photoAlt: 'Furuzonfar Zikriyoev',
  },
  experience: {
    hint: 'The story moves sideways',
    chapters: [
      {
        year: '2021 — 2022',
        city: 'Dushanbe',
        role: 'First websites',
        place: 'WebAcademy',
        text: 'Completed the Layout Designer and Frontend Developer courses: HTML, CSS, JavaScript, responsive layout and animation.',
        tags: ['HTML', 'CSS', 'JavaScript'],
      },
      {
        year: '2022 — 2026',
        city: 'Kazan',
        role: 'Information Systems and Technology',
        place: "KNRTU, bachelor's degree",
        text: 'Information systems design, databases, web development. In 2024 — 2nd place at a national fintech programming hackathon. Thesis project — DotaAI.',
        tags: ['SQL', 'UML', 'Python', 'Node.js'],
      },
      {
        year: '2023',
        city: 'Dushanbe',
        role: 'Web Developer',
        place: 'BO/BO web studio · about 3 months',
        text: 'Ran client projects from concept to delivery. Over 15 demo sites on Tilda for the studio portfolio and 7 finished client projects, mostly online stores.',
        tags: ['Tilda', 'HTML/CSS', 'JavaScript', 'E-commerce'],
      },
      {
        year: '2023 — 2024',
        city: 'Kazan',
        role: 'Head of Design',
        place: 'KNRTU Student Union Media Center',
        text: 'Built and grew a team of designers. Responsible for visual identities of university projects and contests: logos, posts, banners, print.',
        tags: ['Team', 'Figma', 'Photoshop', 'Identity'],
      },
      {
        year: '2026',
        city: 'Tashkent',
        role: 'Looking for a team',
        place: 'Open to opportunities',
        text: 'I want to grow as a frontend developer in a product team: Vue, TypeScript and interfaces where details matter.',
        tags: ['Vue', 'TypeScript', 'UI'],
      },
    ],
  },
  specs: {
    title: 'Tech specs',
    rows: [
      {
        label: 'Frontend',
        main: 'Vue 3 · TypeScript · JavaScript · HTML · CSS',
        note: 'Responsive layout, animation, WebGL, Ionic, Tilda',
      },
      {
        label: 'Backend & data',
        main: 'Node.js · Express · SQL · SQLite',
        note: 'REST API, Python',
      },
      {
        label: 'Design',
        main: 'Figma · Photoshop · CorelDRAW',
        note: 'UI/UX, brand identity. Over five years of practice',
      },
      {
        label: 'Process & tools',
        main: 'Git · Agile / Scrum · UML',
        note: 'RAD, IT project management, Swift basics',
      },
      {
        label: 'Languages',
        main: 'Russian · Tajik · English',
        note: 'Russian — native, Tajik — C1, English — A2 (Elementary)',
      },
    ],
    awardLabel: 'Achievement',
    award: {
      place: '2nd place',
      title: 'National fintech programming hackathon',
      meta: 'Rostov-on-Don · 2024',
      prize: '50,000 ₽ prize',
    },
    alsoLabel: 'Beyond IT',
    also: [
      'Candidate Master of Sport in tennis',
      'Tajikistan U18 tennis champion',
      'Finalist of the “Student of the Year 2024” award of the Republic of Tatarstan, with the media center team',
      '25+ awards at the “Pokolenie” student union leadership school, top 10 of ~70 graduates',
    ],
  },
  work: {
    label: 'Thesis project · 2026',
    title: 'Mercury DotAi',
    lead: 'Personal analytics for Dota 2 players built on real OpenDota data, with AI breakdowns of every game. I designed and built the interface, the server, the database and the AI prompts.',
    stats: [
      { value: 6, label: 'app sections' },
      { value: 4, label: 'radar charts in player comparison' },
      { value: 2, label: 'OpenAI models: analysis and chat' },
    ],
    screens: ['Player dashboard', 'Match breakdown', 'Player comparison', 'AI chat'],
    stackLabel: 'Stack',
    demo: 'Demo soon',
    more: 'More work will be added here later.',
    screenAlt: 'Mercury DotAi screenshot:',
  },

  contact: {
    email: 'Email',
    title: 'Get in touch',
    lead: 'I am looking for a frontend developer role. I live in Tashkent and reply within a day.',
    phone: 'Phone',
    copy: 'Copy',
    copied: 'Copied',
    resume: 'Resume, PDF',
    footer: {
      name: 'Furuzonfar Zikriyoev',
      built: 'Site and liquid metal: Vue, TypeScript, WebGL2',
      top: 'Back to top',
    },
  },
} satisfies Messages

export default en
