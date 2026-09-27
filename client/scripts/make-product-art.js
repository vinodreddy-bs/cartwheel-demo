// Generates the flat product illustrations in public/products. Run: npm run art
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/products');

const PALETTES = {
  Electronics: ['#e0f2fe', '#bae6fd', '#0c4a6e', '#38bdf8'],
  'Home & Kitchen': ['#fef3c7', '#fde68a', '#78350f', '#f59e0b'],
  Accessories: ['#ffedd5', '#fed7aa', '#7c2d12', '#fb923c'],
  BooksA: ['#ede9fe', '#ddd6fe', '#4c1d95', '#8b5cf6'],
  BooksB: ['#fce7f3', '#fbcfe8', '#831843', '#ec4899'],
  BooksC: ['#dcfce7', '#bbf7d0', '#14532d', '#22c55e'],
  Neutral: ['#f3efe9', '#e7e2dc', '#57534e', '#a8a29e'],
};

const book = (initials) => (ink, accent) => `
  <rect x="120" y="85" width="170" height="230" rx="10" fill="${ink}"/>
  <rect x="120" y="85" width="22" height="230" rx="6" fill="${accent}"/>
  <rect x="160" y="130" width="100" height="10" rx="5" fill="#fff" opacity=".85"/>
  <rect x="160" y="150" width="70" height="10" rx="5" fill="#fff" opacity=".6"/>
  <text x="205" y="255" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="#fff">${initials}</text>`;

const GLYPHS = {
  earbuds: (ink, accent) => `
    <circle cx="160" cy="175" r="40" fill="${ink}"/><rect x="148" y="195" width="24" height="95" rx="12" fill="${ink}"/>
    <circle cx="160" cy="175" r="16" fill="${accent}"/>
    <circle cx="245" cy="175" r="40" fill="${ink}"/><rect x="233" y="195" width="24" height="95" rx="12" fill="${ink}"/>
    <circle cx="245" cy="175" r="16" fill="${accent}"/>`,
  watch: (ink, accent) => `
    <rect x="165" y="70" width="70" height="260" rx="24" fill="${accent}"/>
    <rect x="130" y="135" width="140" height="130" rx="34" fill="${ink}"/>
    <rect x="148" y="153" width="104" height="94" rx="22" fill="#0b1220"/>
    <path d="M200 175v25l18 12" stroke="${accent}" stroke-width="8" stroke-linecap="round" fill="none"/>`,
  speaker: (ink, accent) => `
    <rect x="105" y="140" width="190" height="130" rx="65" fill="${ink}"/>
    <circle cx="160" cy="205" r="30" fill="${accent}"/><circle cx="240" cy="205" r="30" fill="${accent}"/>
    <circle cx="160" cy="205" r="10" fill="${ink}"/><circle cx="240" cy="205" r="10" fill="${ink}"/>`,
  headphones: (ink, accent) => `
    <path d="M115 240a85 85 0 0 1 170 0" stroke="${ink}" stroke-width="24" fill="none" stroke-linecap="round"/>
    <rect x="95" y="220" width="50" height="90" rx="20" fill="${ink}"/><rect x="255" y="220" width="50" height="90" rx="20" fill="${ink}"/>
    <rect x="108" y="236" width="24" height="58" rx="10" fill="${accent}"/><rect x="268" y="236" width="24" height="58" rx="10" fill="${accent}"/>`,
  coffee: (ink, accent) => `
    <path d="M135 110h130l-35 85h-60z" fill="${ink}"/>
    <rect x="148" y="200" width="104" height="110" rx="22" fill="${accent}"/>
    <rect x="148" y="250" width="104" height="60" rx="22" fill="${ink}" opacity=".85"/>`,
  mugs: (ink, accent) => `
    <rect x="95" y="165" width="95" height="115" rx="16" fill="${ink}"/>
    <path d="M190 190h14a22 22 0 0 1 0 44h-14" stroke="${ink}" stroke-width="12" fill="none"/>
    <rect x="215" y="140" width="95" height="140" rx="16" fill="${accent}"/>
    <path d="M310 170h14a22 22 0 0 1 0 44h-14" stroke="${accent}" stroke-width="12" fill="none"/>`,
  lamp: (ink, accent) => `
    <ellipse cx="160" cy="305" rx="60" ry="14" fill="${ink}"/>
    <path d="M160 300V210l70-60" stroke="${ink}" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M205 110l80 45-35 45-80-45z" fill="${accent}"/>
    <circle cx="160" cy="210" r="11" fill="${ink}"/>`,
  backpack: (ink, accent) => `
    <path d="M170 110a30 30 0 0 1 60 0" stroke="${ink}" stroke-width="12" fill="none"/>
    <rect x="125" y="105" width="150" height="210" rx="42" fill="${ink}"/>
    <rect x="150" y="215" width="100" height="70" rx="16" fill="${accent}"/>
    <rect x="150" y="215" width="100" height="12" rx="6" fill="${ink}" opacity=".35"/>`,
  bottle: (ink, accent) => `
    <rect x="178" y="75" width="44" height="30" rx="8" fill="${ink}"/>
    <rect x="160" y="100" width="80" height="225" rx="30" fill="${accent}"/>
    <rect x="160" y="160" width="80" height="60" fill="${ink}" opacity=".85"/>`,
  placeholder: (ink) => `
    <rect x="130" y="130" width="140" height="140" rx="20" fill="none" stroke="${ink}" stroke-width="10"/>
    <circle cx="175" cy="175" r="14" fill="${ink}"/><path d="M140 260l45-50 30 30 25-25 30 45" fill="none" stroke="${ink}" stroke-width="10" stroke-linejoin="round"/>`,
};

const ITEMS = [
  { id: 1, name: 'Pulse Wireless Earbuds', palette: 'Electronics', glyph: 'earbuds' },
  { id: 2, name: 'Stride Smartwatch', palette: 'Electronics', glyph: 'watch' },
  { id: 3, name: 'Boom Mini Speaker', palette: 'Electronics', glyph: 'speaker' },
  { id: 4, name: 'Hush ANC Headphones', palette: 'Electronics', glyph: 'headphones' },
  { id: 5, name: 'Pour-Over Coffee Kit', palette: 'Home & Kitchen', glyph: 'coffee' },
  { id: 6, name: 'Stoneware Mug Set (4)', palette: 'Home & Kitchen', glyph: 'mugs' },
  { id: 7, name: 'Arc Desk Lamp', palette: 'Home & Kitchen', glyph: 'lamp' },
  { id: 8, name: 'Testing in the Age of AI', palette: 'BooksA', glyph: book('AI') },
  { id: 9, name: 'Designing Reliable Systems', palette: 'BooksB', glyph: book('DRS') },
  { id: 10, name: 'The Pragmatic Checklist', palette: 'BooksC', glyph: book('PC') },
  { id: 11, name: 'Trail Canvas Backpack', palette: 'Accessories', glyph: 'backpack' },
  { id: 12, name: 'Steel Water Bottle', palette: 'Accessories', glyph: 'bottle' },
  { id: 'placeholder', name: 'Product image', palette: 'Neutral', glyph: 'placeholder' },
];

function svg({ id, name, palette, glyph }) {
  const [bg1, bg2, ink, accent] = PALETTES[palette];
  const draw = typeof glyph === 'function' ? glyph : GLYPHS[glyph];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-labelledby="t${id}">
  <title id="t${id}">${name}</title>
  <defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
  <rect width="400" height="400" fill="url(#g${id})"/>
  <ellipse cx="200" cy="330" rx="120" ry="16" fill="${ink}" opacity=".08"/>${draw(ink, accent)}
</svg>
`;
}

mkdirSync(OUT, { recursive: true });
for (const item of ITEMS) writeFileSync(join(OUT, `${item.id}.svg`), svg(item));
console.log(`Wrote ${ITEMS.length} illustrations to ${OUT}`);
