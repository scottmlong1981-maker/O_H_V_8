import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4321';
const shots = 'qa-shots';
mkdirSync(shots, { recursive: true });

const errors = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

const newPage = async (context, label) => {
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL_CONNECTION_FAILED')) {
      errors.push(`[${label}] console: ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
  return page;
};

/** Scroll the page so lazy-loaded images decode before a full-page screenshot. */
const settle = async (page) => {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    // Wait (briefly) for anything still decoding, without blocking on a stalled request.
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline && [...document.images].some((i) => !i.complete)) {
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(250);
};

const PAGES = [
  ['home', '/'],
  ['conversations', '/conversations/'],
  ['conversation', '/conversations/breathing-into-wholeness/'],
  ['about', '/about/'],
  ['reach-out', '/reach-out/'],
  ['thank-you', '/reach-out/thank-you/'],
  ['404', '/404.html'],
];

// --- desktop -----------------------------------------------------------------
const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
for (const [name, path] of PAGES) {
  const page = await newPage(desktop, name);
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await settle(page);
  await page.screenshot({ path: `${shots}/desktop-${name}.png`, fullPage: true });
  console.log(`${name}: ${res.status()}`);
  await page.close();
}

// --- global social / listening presence on every page ------------------------
const REQUIRED_GLOBAL = [
  ['Spotify', 'a[href*="open.spotify.com"]'],
  ['Apple Podcasts', 'a[href*="podcasts.apple.com"]'],
  ['Instagram', 'a[href*="instagram.com"]'],
  ['TikTok', 'a[href*="tiktok.com"]'],
  ['Facebook', 'a[href*="facebook.com"]'],
  ['YouTube', 'a[href*="youtube.com"]'],
];
console.log('\n-- global links present on every page --');
for (const [name, path] of PAGES) {
  const page = await newPage(desktop, `global-${name}`);
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  const missing = [];
  for (const [label, selector] of REQUIRED_GLOBAL) {
    if ((await page.locator(selector).count()) === 0) missing.push(label);
  }
  const navHasWatchListen = await page
    .locator('header a.btn, header span.btn')
    .filter({ hasText: /^(Watch|Listen)$/ })
    .count();
  console.log(
    `${name}: ${missing.length ? 'MISSING ' + missing.join(', ') : 'all present'}` +
      (navHasWatchListen ? ' | WATCH/LISTEN STILL IN NAV' : '')
  );
  await page.close();
}

// --- nav structure ------------------------------------------------------------
const nav = await newPage(desktop, 'nav');
await nav.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const navItems = await nav.$$eval('header nav a', (as) => as.map((a) => a.textContent.trim()));
console.log('\ndesktop nav:', navItems.join(' | '));
await nav.close();

// --- People → Guests -----------------------------------------------------------
const redirect = await newPage(desktop, 'redirect');
const guestsRes = await redirect.goto(BASE + '/guests/', { waitUntil: 'domcontentloaded' });
console.log('\n/guests/ status (404 while switched off):', guestsRes.status());
await redirect.goto(BASE + '/people/', { waitUntil: 'networkidle' });
await redirect.waitForTimeout(400);
console.log('/people/ lands on:', redirect.url());
await redirect.close();

// --- thumbnails ----------------------------------------------------------------
const thumbs = await newPage(desktop, 'thumbs');
await thumbs.goto(BASE + '/conversations/', { waitUntil: 'domcontentloaded' });
const counts = await thumbs.evaluate(() => {
  const cards = [...document.querySelectorAll('.explorer__item')];
  return {
    cards: cards.length,
    withThumb: cards.filter((c) => c.querySelector('img.conversation-image')).length,
    withBrandField: cards.filter((c) => c.querySelector('.brand-field')).length,
  };
});
console.log('\nconversations page:', JSON.stringify(counts));
await thumbs.close();

// --- search + filters (unchanged behaviour must survive the revision) ----------
const page = await newPage(desktop, 'explorer');
await page.goto(BASE + '/conversations/', { waitUntil: 'networkidle' });
const visible = () => page.locator('.explorer__item:not([hidden])').count();
console.log('\n-- search / filter --');
console.log('initial:', await visible());
await page.fill('[data-search]', 'grief');
await page.waitForTimeout(300);
console.log('search "grief":', await visible());
await page.selectOption('[data-theme]', 'Grief');
await page.waitForTimeout(200);
console.log('search + theme:', await visible(), '|', new URL(page.url()).search);
await page.click('[data-reset]');
await page.waitForTimeout(250);
await page.selectOption('[data-guest]', 'aaron-lahman');
await page.waitForTimeout(200);
console.log('guest filter:', await visible());
await page.selectOption('[data-sort]', 'oldest');
await page.waitForTimeout(200);
console.log('sort oldest ok');
await page.close();

// --- reach out form ------------------------------------------------------------
console.log('\n-- reach out form --');
const form = await newPage(desktop, 'form');
await form.goto(BASE + '/reach-out/', { waitUntil: 'networkidle' });
const formAttrs = await form.evaluate(() => {
  const f = document.querySelector('form[name="reach-out"]');
  return {
    netlify: f?.getAttribute('data-netlify'),
    honeypot: f?.getAttribute('netlify-honeypot'),
    hiddenName: f?.querySelector('input[name="form-name"]')?.value,
    action: f?.getAttribute('action'),
    fields: [...f.querySelectorAll('input:not([type=hidden]), textarea')].map((i) => i.name),
    labelled: [...f.querySelectorAll('#name, #email, #message')].every(
      (i) => document.querySelector(`label[for="${i.id}"]`) !== null
    ),
  };
});
console.log(JSON.stringify(formAttrs));

await form.click('button[type="submit"]');
await form.waitForTimeout(200);
console.log('empty submit blocked, still on:', new URL(form.url()).pathname);
console.log('error summary shown:', await form.locator('[data-form-error]').isVisible());
console.log('name marked invalid:', await form.getAttribute('#name', 'aria-invalid'));

await form.fill('#name', 'Test Person');
await form.fill('#email', 'not-an-email');
await form.fill('#message', 'Hello');
await form.click('button[type="submit"]');
await form.waitForTimeout(200);
console.log('bad email blocked:', await form.getAttribute('#email', 'aria-invalid'));
await form.fill('#email', 'test@example.com');
await form.waitForTimeout(100);
console.log('corrected email valid:', await form.getAttribute('#email', 'aria-invalid'));
await form.close();

// --- mobile --------------------------------------------------------------------
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
for (const [name, path] of PAGES.slice(0, 7)) {
  const p = await newPage(mobile, `m-${name}`);
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await settle(p);
  await p.screenshot({ path: `${shots}/mobile-${name}.png`, fullPage: true });
  await p.close();
}

const m = await newPage(mobile, 'm-nav');
await m.goto(BASE + '/', { waitUntil: 'networkidle' });
await m.click('[data-nav-toggle]');
await m.waitForTimeout(150);
console.log('\nmobile nav expanded:', await m.getAttribute('[data-nav-toggle]', 'aria-expanded'));
const mNav = await m.$$eval('#site-nav a', (as) => as.map((a) => a.textContent.trim()));
console.log('mobile nav:', mNav.join(' | '));
await m.screenshot({ path: `${shots}/mobile-nav-open.png` });
await m.keyboard.press('Escape');
await m.waitForTimeout(150);
console.log('after Escape:', await m.getAttribute('[data-nav-toggle]', 'aria-expanded'));
await m.close();

// --- internal crawl + broken images --------------------------------------------
const crawler = await newPage(desktop, 'crawl');
const seen = new Set();
const queue = ['/'];
const broken = [];
const brokenImages = [];
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await crawler.goto(BASE + path, { waitUntil: 'networkidle' });
  if (!res || res.status() >= 400) broken.push(`${path} → ${res?.status()}`);
  const bad = await crawler.$$eval('img', (imgs) =>
    imgs
      .filter((i) => !i.src.startsWith('https://i.ytimg.com') && i.complete && i.naturalWidth === 0)
      .map((i) => i.getAttribute('src'))
  );
  for (const src of bad) brokenImages.push(`${path} → ${src}`);
  const hrefs = await crawler.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')));
  for (const href of hrefs) {
    const clean = href.split('?')[0].split('#')[0];
    if (clean && !seen.has(clean)) queue.push(clean);
  }
}
console.log('\ncrawled', seen.size, 'pages; broken links:', broken.length ? broken : 'none');
console.log('broken local images:', brokenImages.length ? brokenImages : 'none');
await crawler.close();

await browser.close();
console.log('\nconsole/page errors:', errors.length ? errors : 'none');
