// Generates abstract, clearly-placeholder SVG artwork (no real photos of anyone).
// Usage: node scripts/placeholder-art.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const palettes = [
  ['#1f3a5f', '#f2b134', '#ef6f53', '#fbf5ea'],
  ['#2d5a3d', '#e9c46a', '#f4a261', '#f6f1e7'],
  ['#5b2a86', '#ff9f68', '#f9d56e', '#f8f2ff'],
  ['#0b4f6c', '#01baef', '#fbfbff', '#20bf55'],
  ['#7a1f2b', '#f6bd60', '#84a59d', '#f7ede2'],
  ['#264653', '#2a9d8f', '#e76f51', '#f1faee'],
  ['#3d348b', '#f18701', '#f7b801', '#f4f1fb'],
  ['#3a2e39', '#1e555c', '#f4d8cd', '#edb183'],
];

function rng(seed) {
  let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function avatar(seed, i) {
  const [a, b, c, bg] = palettes[i % palettes.length];
  const r = rng(seed);
  const eyeY = 168 + r() * 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="${80 + r() * 240}" cy="${60 + r() * 80}" r="${50 + r() * 50}" fill="${c}" opacity="0.55"/>
  <path d="M60 400 C 80 300, 320 300, 340 400 Z" fill="${a}"/>
  <circle cx="200" cy="190" r="92" fill="${b}"/>
  <path d="M108 180 C ${110 + r() * 30} ${80 + r() * 20}, ${270 + r() * 30} ${80 + r() * 20}, 292 180 C 280 ${120 + r() * 20}, 130 ${120 + r() * 20}, 108 180 Z" fill="${a}"/>
  <circle cx="168" cy="${eyeY}" r="8" fill="${a}"/>
  <circle cx="232" cy="${eyeY}" r="8" fill="${a}"/>
  <path d="M176 ${eyeY + 40} Q 200 ${eyeY + 58} 224 ${eyeY + 40}" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>
`;
}

function scene(seed, i, label) {
  const [a, b, c, bg] = palettes[i % palettes.length];
  const r = rng(seed);
  const shapes = [];
  for (let k = 0; k < 7; k++) {
    const x = r() * 1200, y = r() * 675, s = 60 + r() * 220;
    const fill = [a, b, c][k % 3];
    shapes.push(
      k % 2
        ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s / 2).toFixed(0)}" fill="${fill}" opacity="0.85"/>`
        : `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${(s * 0.7).toFixed(0)}" rx="12" fill="${fill}" opacity="0.85" transform="rotate(${(r() * 40 - 20).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <rect width="1200" height="675" fill="${bg}"/>
  ${shapes.join('\n  ')}
  <rect x="32" y="603" width="${label.length * 13 + 40}" height="40" rx="20" fill="#111" opacity="0.75"/>
  <text x="52" y="630" font-family="system-ui, sans-serif" font-size="20" fill="#fff">${label}</text>
</svg>
`;
}

const people = ['lucas', 'amani', 'lena', 'priya', 'hana', 'noah'];
mkdirSync('src/assets/people', { recursive: true });
people.forEach((p, i) => writeFileSync(`src/assets/people/${p}.svg`, avatar(p, i)));

const stories = [
  'what-does-home-mean-to-us',
  'lunchbox-diplomacy',
  'the-word-i-cannot-translate',
  'grandmothers-kitchen',
  'not-what-you-think',
  'group-chat-at-midnight',
  'first-day-again',
];
mkdirSync('src/assets/stories', { recursive: true });
stories.forEach((s, i) => writeFileSync(`src/assets/stories/${s}.svg`, scene(s, i, 'Placeholder artwork')));
for (let k = 1; k <= 6; k++) writeFileSync(`src/assets/stories/photo-${k}.svg`, scene(`photo${k}`, k + 2, `Placeholder photo ${k}`));

mkdirSync('tests/fixtures/assets', { recursive: true });
writeFileSync('tests/fixtures/assets/fixture-avatar.svg', avatar('fixture', 3));
writeFileSync('tests/fixtures/assets/fixture-story.svg', scene('fixture', 5, 'Fixture artwork'));
console.log('placeholder art written');
