import type { APIRoute } from 'astro';
import { readYouTubeCatalog } from '../lib/youtube-catalog';

/**
 * Publishes the episode list this build was made from, at /youtube-catalog.json.
 * It holds only public YouTube information (titles, descriptions, dates, thumbnails) —
 * never a key. The next build reads it back if YouTube cannot be reached, so a
 * temporary outage never makes episodes disappear from the site.
 */
export const GET: APIRoute = () => {
  const catalog = readYouTubeCatalog();
  return new Response(JSON.stringify(catalog), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
