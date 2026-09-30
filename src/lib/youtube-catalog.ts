import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the episode catalog written by `npm run sync:youtube` (src/data/youtube-catalog.json).
 * Build time only — nothing here ships to the browser and no API key is involved.
 * With no catalog on disk (no key configured, local development) the list is simply empty
 * and the site builds from its hand-written conversations alone.
 */

export type CatalogEpisode = {
  videoId: string;
  title: string;
  description: string;
  /** Full ISO timestamp from YouTube, e.g. 2026-09-12T01:30:00Z. */
  publishedAt: string;
  durationSeconds: number;
  thumbnail: { url: string; width: number; height: number } | null;
};

export type Catalog = {
  fetchedAt: string | null;
  source: string;
  episodes: CatalogEpisode[];
};

const FILE = 'src/data/youtube-catalog.json';
let cached: Catalog | null = null;

export function readYouTubeCatalog(cwd = process.cwd()): Catalog {
  if (cached) return cached;

  const path = join(cwd, FILE);
  if (!existsSync(path)) {
    cached = { fetchedAt: null, source: 'none', episodes: [] };
    return cached;
  }

  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const episodes: CatalogEpisode[] = Array.isArray(data.episodes)
      ? data.episodes.filter(
          (e: Partial<CatalogEpisode>) =>
            typeof e?.videoId === 'string' &&
            /^[A-Za-z0-9_-]{11}$/.test(e.videoId) &&
            typeof e.title === 'string' &&
            typeof e.publishedAt === 'string'
        )
      : [];
    cached = { fetchedAt: data.fetchedAt ?? null, source: data.source ?? 'unknown', episodes };
  } catch {
    cached = { fetchedAt: null, source: 'unreadable', episodes: [] };
  }
  return cached;
}
