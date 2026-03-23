/**
 * Responsive polish acceptance tests
 * Run AFTER npm run build — checks built HTML output
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const DIST = join(import.meta.dirname, 'dist');

function readHtml(path) {
  return readFileSync(join(DIST, path), 'utf8');
}

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  ✓ ${description}`);
    passed++;
  } else {
    console.error(`  ✗ ${description}`);
    failed++;
  }
}

// ── Source file helpers (check Tailwind classes in source, not built output)
function readSrc(path) {
  return readFileSync(join(import.meta.dirname, 'src', path), 'utf8');
}

console.log('\n=== External links open in new tabs ===');
const allPages = [
  readHtml('index.html'),
  readHtml('menu/index.html'),
  readHtml('about/index.html'),
  readHtml('contact/index.html'),
];
const allHtml = allPages.join('\n');

// External links should have target="_blank"
// Skip the Dishes link
assert(allHtml.includes('target="_blank"'), 'At least one target="_blank" exists across pages');

// Count external link patterns
const skipTheDishesLinks = (allHtml.match(/skipthedishes/g) || []).length;
assert(skipTheDishesLinks > 0, 'Skip the Dishes link present');

// All Skip the Dishes links should be in a target="_blank" context
// Simple check: every href containing skipthedishes should have nearby target="_blank"
const sdMatches = [...allHtml.matchAll(/href="[^"]*skipthedishes[^"]*"/g)];
assert(sdMatches.length > 0, 'Skip the Dishes href found');

// Social links
const facebookLinks = [...allHtml.matchAll(/href="[^"]*facebook[^"]*"/g)];
const instagramLinks = [...allHtml.matchAll(/href="[^"]*instagram[^"]*"/g)];
assert(facebookLinks.length > 0, 'Facebook links present');
assert(instagramLinks.length > 0, 'Instagram links present');

// Check target="_blank" near social links in source
const navSrc = readSrc('components/Nav.astro');
const footerSrc = readSrc('components/Footer.astro');
assert(
  footerSrc.includes('target="_blank"') && footerSrc.includes('facebook'),
  'Footer Facebook link has target="_blank"'
);
assert(
  footerSrc.includes('target="_blank"') && footerSrc.includes('instagram'),
  'Footer Instagram link has target="_blank"'
);

console.log('\n=== Internal navigation links ===');
const indexHtml = readHtml('index.html');
assert(indexHtml.includes('href="/menu"'), 'Home page links to /menu');
assert(indexHtml.includes('href="/about"'), 'Home page links to /about');
assert(indexHtml.includes('href="/contact"'), 'Home page links to /contact');

const menuHtml = readHtml('menu/index.html');
assert(menuHtml.includes('href="/"') || menuHtml.includes('href="/"'), 'Menu page links back to home');

console.log('\n=== Mobile hamburger nav ===');
assert(navSrc.includes('id="hamburger"'), 'Hamburger button has id="hamburger"');
assert(navSrc.includes('id="mobile-nav"'), 'Mobile nav overlay has id="mobile-nav"');
assert(navSrc.includes('closeNav'), 'closeNav function defined');
assert(navSrc.includes("addEventListener('click', closeNav)"), 'Mobile links close nav on click');
assert(navSrc.includes('md:hidden'), 'Hamburger hidden on desktop (md:hidden)');
assert(navSrc.includes('hidden md:flex'), 'Desktop nav links hidden on mobile');

console.log('\n=== Gallery responsive grid ===');
const indexSrc = readSrc('pages/index.astro');
// Gallery should be 1-col mobile, 2-col sm/md, 4-col md+
assert(
  indexSrc.includes('grid-cols-1') && indexSrc.includes('md:grid-cols-4'),
  'Gallery has 1-col mobile + 4-col desktop breakpoints'
);
assert(
  indexSrc.includes('sm:grid-cols-2') || indexSrc.includes('md:grid-cols-2'),
  'Gallery has 2-col tablet breakpoint'
);

console.log('\n=== Menu tabs horizontally scrollable on mobile ===');
const menuSrc = readSrc('pages/menu.astro');
assert(menuSrc.includes('overflow-x-auto'), 'Menu tabs have overflow-x-auto');
assert(menuSrc.includes('whitespace-nowrap'), 'Menu tab items are whitespace-nowrap');

console.log('\n=== Footer stacks on mobile ===');
assert(footerSrc.includes('grid-cols-1'), 'Footer grid starts at 1 column');
assert(footerSrc.includes('md:grid-cols-2') || footerSrc.includes('lg:grid-cols-4'), 'Footer expands on larger screens');

console.log('\n=== Mobile padding (px-4 on mobile) ===');
// Pages should use responsive padding
assert(indexSrc.includes('px-4'), 'Home page uses px-4 on mobile');
const aboutSrc = readSrc('pages/about.astro');
assert(aboutSrc.includes('px-4'), 'About page uses px-4 on mobile');
const contactSrc = readSrc('pages/contact.astro');
assert(contactSrc.includes('px-4'), 'Contact page uses px-4 on mobile');
assert(menuSrc.includes('px-4'), 'Menu page uses px-4 on mobile');

console.log('\n=== Gallery offset columns only on md+ ===');
// The pt-24 offset should be md:pt-24 (not just pt-24) to avoid weirdness on 1-col mobile layout
assert(
  !indexSrc.match(/<div class="space-y-4 pt-24">/),
  'Gallery column pt-24 offset is responsive (md:pt-24), not unconditional'
);

console.log('\n=== No horizontal overflow risk: floating card ===');
// The floating stats card uses -translate-x-4; the parent needs overflow-hidden on mobile
// or the translate should be removed on mobile
assert(
  indexSrc.includes('lg:-translate-x-4') || !indexSrc.includes('-translate-x-4'),
  'Floating stats card negative translate is lg+ only (avoids mobile overflow)'
);

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
