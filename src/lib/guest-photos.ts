import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guest photographs are dropped into `public/images/guests/` named after the person's
 * slug — for example `public/images/guests/ambrosia-brown.jpg`. This runs at BUILD time
 * and simply checks whether such a file exists, so adding a photo needs no code change.
 *
 * A person record may still set `image` explicitly; that always wins.
 */

const DIR = 'public/images/guests';
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

let cache: Map<string, string> | null = null;

function index(cwd = process.cwd()): Map<string, string> {
  if (cache) return cache;

  cache = new Map();
  const dir = join(cwd, DIR);
  if (!existsSync(dir)) return cache;

  for (const file of readdirSync(dir)) {
    const dot = file.lastIndexOf('.');
    if (dot < 1) continue;
    const slug = file.slice(0, dot).toLowerCase();
    const extension = file.slice(dot + 1).toLowerCase();
    if (EXTENSIONS.includes(extension) && !cache.has(slug)) {
      cache.set(slug, `/images/guests/${file}`);
    }
  }

  return cache;
}

/** Public path to an approved photograph for this person, or null. */
export function guestPhoto(slug: string, explicit: string | null = null): string | null {
  if (explicit) return explicit;
  return index().get(slug.toLowerCase()) ?? null;
}

/** Slugs that currently have a photo on disk — used by the pre-build content report. */
export function photographedSlugs(): string[] {
  return [...index().keys()];
}
