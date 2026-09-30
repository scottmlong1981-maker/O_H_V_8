#!/usr/bin/env node
/**
 * Pre-build content report.
 *
 * Runs automatically before `npm run build` and `npm run dev`. It never fails the build —
 * it exists so that a missing YouTube link is visible rather than silent. Without a linked
 * video a conversation cannot show a thumbnail, and the card falls back to the brand band.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content/conversations');

// Mirror of src/lib/episode-videos.ts, kept dependency-free for this pre-build report.
const mapPath = join(root, 'episode-videos.txt');
const parseId = (v) => {
  const s = v.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  for (const re of [/[?&]v=([A-Za-z0-9_-]{11})/, /youtu\.be\/([A-Za-z0-9_-]{11})/, /\/(?:embed|live|shorts|v)\/([A-Za-z0-9_-]{11})/]) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return null;
};
const mapped = new Map();
const unreadable = [];
if (existsSync(mapPath)) {
  for (const line of readFileSync(mapPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const slug = t.slice(0, t.indexOf('=')).trim();
    const raw = t.slice(t.indexOf('=') + 1).trim();
    if (!slug || !raw) continue;
    const id = parseId(raw);
    if (id) mapped.set(slug, id);
    else unreadable.push({ slug, raw });
  }
}

const records = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));

const published = records.filter((r) => r.publishingStatus === 'published');
const videoIdFor = (r) => r.platforms?.youtubeVideoId ?? mapped.get(r.slug) ?? null;
const noVideo = published.filter((r) => !videoIdFor(r));
const linked = published.filter((r) => videoIdFor(r));

/**
 * Confirm a pasted link really is the episode it is filed under, using YouTube's public
 * oEmbed endpoint — no API key, no quota. Purely advisory: if the network is unavailable
 * (offline, restricted CI) the check is skipped and the build carries on.
 */
async function confirmTitles(pairs) {
  const results = [];
  for (const { slug, id, title } of pairs) {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!response.ok) {
        results.push({ slug, id, status: response.status === 404 ? 'not-found' : 'unchecked' });
        continue;
      }
      const data = await response.json();
      results.push({ slug, id, status: 'ok', youtubeTitle: data.title, recordTitle: title });
    } catch {
      results.push({ slug, id, status: 'unchecked' });
    }
  }
  return results;
}

const line = '─'.repeat(72);
console.log(`\n${line}\nOur Healing Voices — content check`);
console.log(`Published conversations: ${published.length} of ${records.length}`);

console.log(`With a YouTube video linked: ${linked.length} of ${published.length}`);

const confirmations = await confirmTitles(
  linked.map((r) => ({ slug: r.slug, id: videoIdFor(r), title: r.title }))
);

for (const c of confirmations) {
  if (c.status === 'ok') {
    console.log(`   ✓ ${c.slug} → ${c.id}`);
    console.log(`       on YouTube: "${c.youtubeTitle}"`);
    console.log(`       on the site: "${c.recordTitle}"`);
    console.log('       ↳ check these describe the same conversation.');
  } else if (c.status === 'not-found') {
    console.log(`   ✗ ${c.slug} → ${c.id}  — YouTube has no video with this id. Re-copy the link.`);
  } else {
    console.log(`   • ${c.slug} → ${c.id}  (title not verified — no network during this build)`);
  }
}

if (noVideo.length > 0) {
  console.log(
    `\n  ⚠  ${noVideo.length} published conversation(s) have NO linked YouTube video, so they\n` +
      `     keep the branded green fallback instead of a thumbnail:\n` +
      noVideo.map((r) => `       · ${r.slug}`).join('\n') +
      `\n\n     Fix (no commands, no API key): open episode-videos.txt, paste the YouTube\n` +
      `     link next to each episode, save, redeploy.`
  );
}

if (unreadable.length > 0) {
  console.log(
    `\n  ⚠  ${unreadable.length} line(s) in episode-videos.txt could not be read as a YouTube link:\n` +
      unreadable.map((u) => `       · ${u.slug} = ${u.raw}`).join('\n') +
      `\n     Paste the full address from the browser bar, e.g.\n` +
      `     https://www.youtube.com/watch?v=XXXXXXXXXXX`
  );
}

// --- YouTube episode catalog ---------------------------------------------------
const catalogPath = join(root, 'src/data/youtube-catalog.json');
if (existsSync(catalogPath)) {
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    const episodes = Array.isArray(catalog.episodes) ? catalog.episodes : [];
    console.log(
      `\nYouTube episodes available to the site: ${episodes.length}` +
        ` (source: ${catalog.source ?? 'unknown'}${catalog.fetchedAt ? `, fetched ${catalog.fetchedAt}` : ''})`
    );
    if (episodes[0]) console.log(`   newest: "${episodes[0].title}" — ${episodes[0].publishedAt.slice(0, 10)}`);
  } catch {
    console.log('\n  ⚠  src/data/youtube-catalog.json could not be read. Run npm run sync:youtube.');
  }
} else {
  console.log(
    '\nYouTube episodes available to the site: none yet — only hand-written conversations will show.\n' +
      '   On Netlify this is filled automatically when YOUTUBE_API_KEY is set.'
  );
}

// --- guest photographs -------------------------------------------------------
const peopleDir = join(root, 'src/content/people');
const photoDir = join(root, 'public/images/guests');
const photoExt = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const photos = new Set(
  existsSync(photoDir)
    ? readdirSync(photoDir)
        .filter((f) => photoExt.includes(f.split('.').pop().toLowerCase()))
        .map((f) => f.slice(0, f.lastIndexOf('.')).toLowerCase())
    : []
);
const peopleRecords = readdirSync(peopleDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(peopleDir, f), 'utf8')));
const withPhoto = peopleRecords.filter((p) => p.image || photos.has(p.slug));
const withoutPhoto = peopleRecords.filter((p) => !p.image && !photos.has(p.slug));

console.log(`\nGuest photographs: ${withPhoto.length} of ${peopleRecords.length}`);
if (withoutPhoto.length > 0) {
  console.log(
    `  ·  no photo yet (branded fallback shown): ` +
      withoutPhoto.map((p) => p.slug).join(', ') +
      `\n     Add one as public/images/guests/<slug>.jpg — see the README in that folder.`
  );
}

console.log(`${line}\n`);
