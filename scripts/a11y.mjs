import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const BASE = 'http://localhost:4321';
const paths = ['/', '/conversations/', '/conversations/breathing-into-wholeness/', '/about/', '/reach-out/', '/reach-out/thank-you/', '/404.html'];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const width of [390, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  for (const path of paths) {
    const page = await context.newPage();
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ content: axe });
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      });
    });
    const violations = results.violations.filter((v) => v.impact !== 'minor' || true);
    console.log(`${width}px ${path}: ${violations.length ? '' : 'clean'}`);
    for (const v of violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) console.log(`     ${node.target.join(' ')} — ${node.failureSummary?.split('\n')[1] ?? ''}`);
    }
    await page.close();
  }
  await context.close();
}

await browser.close();
