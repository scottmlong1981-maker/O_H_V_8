import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads `episode-videos.txt` — the owner-editable mapping of conversation slug to
 * YouTube link. This runs at BUILD time only (static output), so nothing here ships
 * to the browser and no API key is involved.
 *
 * A link written here is treated as owner-verified. The site never guesses an id.
 */

const FILE = 'episode-videos.txt';

/** Accepts a full watch URL, a youtu.be link, a /live or /embed link, or a bare id. */
export function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Bare id: exactly 11 characters of the YouTube id alphabet.
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/, // watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
    /\/(?:embed|live|shorts|v)\/([A-Za-z0-9_-]{11})/, // /embed/ID, /live/ID, /shorts/ID
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match[1]!;
  }

  return null;
}

export type VideoMapEntry = { videoId: string; raw: string };
export type VideoMapResult = {
  entries: Map<string, VideoMapEntry>;
  /** Lines that had a value which could not be read as a YouTube link. */
  unreadable: { slug: string; raw: string }[];
};

let cached: VideoMapResult | null = null;

export function readEpisodeVideoMap(cwd = process.cwd()): VideoMapResult {
  if (cached) return cached;

  const entries = new Map<string, VideoMapEntry>();
  const unreadable: { slug: string; raw: string }[] = [];
  const path = join(cwd, FILE);

  if (!existsSync(path)) {
    cached = { entries, unreadable };
    return cached;
  }

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const text = line.trim();
    if (!text || text.startsWith('#')) continue;

    const separator = text.indexOf('=');
    if (separator === -1) continue;

    const slug = text.slice(0, separator).trim();
    const raw = text.slice(separator + 1).trim();
    if (!slug || !raw) continue;

    const videoId = parseVideoId(raw);
    if (videoId) entries.set(slug, { videoId, raw });
    else unreadable.push({ slug, raw });
  }

  cached = { entries, unreadable };
  return cached;
}
