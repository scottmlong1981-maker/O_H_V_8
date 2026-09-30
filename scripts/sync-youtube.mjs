#!/usr/bin/env node
/**
 * YouTube channel → local episode catalog.
 *
 * Architecture:
 *   YouTube Data API v3  →  this script  →  src/data/youtube-catalog.json  →  site build
 *
 * On Netlify this runs at the start of every build (`npm run build:netlify`), and a
 * scheduled function triggers one build a day, so new uploads reach the site on their own.
 * The site never calls YouTube from the browser, and the API key never leaves the build.
 *
 * What counts as an episode: every PUBLIC upload on @ourhealingvoices that has finished
 * processing, is not a live stream or premiere still waiting to start, and runs longer than
 * three minutes. Shorts are three minutes or less, so they are left out.
 *
 * Safety rules:
 *   1. The API key is read from the environment (or a local, git-ignored .env) only.
 *      It is never written to any file and never printed.
 *   2. The script only writes the catalog file. It never edits the hand-written
 *      conversation records in src/content/conversations/.
 *   3. If YouTube cannot be reached, the build does not lose episodes: it falls back to the
 *      catalog published with the previous deploy, then to any catalog already on disk.
 *      A deploy never fails because of this step when run with --optional.
 *
 * Usage:
 *   YOUTUBE_API_KEY=... npm run sync:youtube
 *   YOUTUBE_API_KEY=... npm run sync:youtube -- --dry-run     (prints, writes nothing)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_FILE = join(root, 'src/data/youtube-catalog.json');
const CHANNEL_HANDLE = 'ourhealingvoices'; // approved source: https://www.youtube.com/@ourhealingvoices
const API = 'https://www.googleapis.com/youtube/v3';
/** Shorts can run up to three minutes. Anything that long or shorter is not an episode. */
const SHORTS_MAX_SECONDS = 180;

const DRY_RUN = process.argv.includes('--dry-run');
/** --optional: never fail the build (no key, or YouTube unreachable). */
const OPTIONAL = process.argv.includes('--optional');

// Load .env if present, without adding a dependency. .env is git-ignored.
if (!process.env.YOUTUBE_API_KEY && existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const key = process.env.YOUTUBE_API_KEY?.trim();

const call = async (path, params) => {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', key);
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    const detail = await response.text();
    // Never echo the URL back — it carries the key.
    throw new Error(`YouTube API ${path} failed with ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.json();
};

/** ISO 8601 duration (PT1H2M3S) → seconds. */
export function durationSeconds(iso = '') {
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, d = 0, h = 0, min = 0, s = 0] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/**
 * Choose the largest TRUE 16:9 thumbnail the API reports.
 * `high` (480x360) and `standard` (640x480) are 4:3 and letterbox widescreen uploads,
 * so they are only accepted if nothing 16:9 is offered.
 */
function pickThumbnail(thumbnails = {}) {
  const candidates = ['maxres', 'medium', 'standard', 'high', 'default']
    .map((name) => thumbnails[name])
    .filter((t) => t && t.url && t.width && t.height);

  const widescreen = candidates.filter((t) => Math.abs(t.width / t.height - 16 / 9) < 0.02);
  const chosen = (widescreen.length ? widescreen : candidates).sort((a, b) => b.width - a.width)[0];

  return chosen ? { url: chosen.url, width: chosen.width, height: chosen.height } : null;
}

async function fetchCatalog() {
  const channel = await call('channels', { part: 'contentDetails', forHandle: CHANNEL_HANDLE });
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`Could not find the uploads list for @${CHANNEL_HANDLE}.`);

  // 1. Every upload id, newest first (50 per page).
  const ids = [];
  let pageToken;
  do {
    const page = await call('playlistItems', {
      part: 'contentDetails',
      playlistId: uploads,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of page.items ?? []) ids.push(item.contentDetails.videoId);
    pageToken = page.nextPageToken;
  } while (pageToken);

  // 2. Full details for each (50 per request): title, description, date, length, status.
  const videos = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await call('videos', {
      part: 'snippet,contentDetails,status',
      id: ids.slice(i, i + 50).join(','),
      maxResults: '50',
    });
    videos.push(...(batch.items ?? []));
  }

  const skipped = { notPublic: 0, liveOrUpcoming: 0, shorts: 0 };
  const episodes = [];

  for (const v of videos) {
    const seconds = durationSeconds(v.contentDetails?.duration);
    if (v.status?.privacyStatus !== 'public' || v.status?.uploadStatus !== 'processed') {
      skipped.notPublic += 1;
      continue;
    }
    if (v.snippet?.liveBroadcastContent && v.snippet.liveBroadcastContent !== 'none') {
      skipped.liveOrUpcoming += 1;
      continue;
    }
    if (seconds <= SHORTS_MAX_SECONDS) {
      skipped.shorts += 1;
      continue;
    }
    episodes.push({
      videoId: v.id,
      title: v.snippet.title,
      description: v.snippet.description ?? '',
      publishedAt: v.snippet.publishedAt,
      durationSeconds: seconds,
      thumbnail: pickThumbnail(v.snippet.thumbnails),
    });
  }

  episodes.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { episodes, uploads: ids.length, skipped };
}

/** The catalog the previous deploy published, so a YouTube outage never empties the site. */
async function previousDeployCatalog() {
  const origin = process.env.SITE_URL || process.env.URL;
  if (!origin) return null;
  try {
    const response = await fetch(new URL('/youtube-catalog.json', origin), {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data?.episodes) && data.episodes.length ? data : null;
  } catch {
    return null;
  }
}

function write(catalog) {
  if (DRY_RUN) return;
  mkdirSync(dirname(CATALOG_FILE), { recursive: true });
  writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n');
}

async function fallback(reason) {
  console.log(`YouTube sync: ${reason}`);
  const previous = await previousDeployCatalog();
  if (previous) {
    write({ ...previous, source: 'previous-deploy' });
    console.log(
      `  Using the ${previous.episodes.length} episodes from the previous deploy (fetched ${previous.fetchedAt}).`
    );
    return;
  }
  if (existsSync(CATALOG_FILE)) {
    console.log('  Keeping the episode catalog already on disk.');
    return;
  }
  console.log('  No earlier catalog found — the site builds with its hand-written episodes only.');
}

async function main() {
  if (!key) {
    await fallback(
      'YOUTUBE_API_KEY is not set, so new uploads were not fetched.\n' +
        '  To turn this on: Netlify → Site configuration → Environment variables → YOUTUBE_API_KEY.'
    );
    return OPTIONAL ? 0 : 1;
  }

  try {
    const { episodes, uploads, skipped } = await fetchCatalog();
    if (episodes.length === 0) throw new Error('YouTube returned no public full-length videos.');

    write({ fetchedAt: new Date().toISOString(), source: 'youtube-api', channel: `@${CHANNEL_HANDLE}`, episodes });

    console.log(
      `${DRY_RUN ? '[dry run] ' : ''}YouTube sync: ${episodes.length} episodes from ${uploads} uploads ` +
        `(left out: ${skipped.shorts} Shorts, ${skipped.liveOrUpcoming} live/upcoming, ${skipped.notPublic} not public).`
    );
    console.log(`  Newest: "${episodes[0].title}" — ${episodes[0].publishedAt.slice(0, 10)}`);
    return 0;
  } catch (error) {
    await fallback(`could not reach YouTube (${error.message}).`);
    return OPTIONAL ? 0 : 1;
  }
}

// Allow the helpers above to be imported by tests without running a sync.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => process.exit(code));
}
