export const site = {
  name: 'Culture, Unfiltered',
  tagline: 'Real lives. Real voices. No single story.',
  description:
    'A digital anthropology exhibition made by teenagers. Personal stories about home, school, language, food and identity, told by the people who live them.',
  /** Shows a banner while the site still runs on placeholder content. Turn off when real content arrives. */
  showSampleNotice: true,
  /** Content repository edited through /admin (Decap CMS, GitHub login). */
  cms: { repo: 'staunch0515/culture-unfiltered', branch: 'main' },
  nav: [
    { label: 'Home', path: '/' },
    { label: 'People', path: '/people/' },
    { label: 'Themes', path: '/themes/' },
    { label: 'Stories', path: '/stories/' },
    { label: 'Our Method', path: '/method/' },
    { label: 'Resources', path: '/resources/' },
    { label: 'About', path: '/about/' },
  ],
} as const;
