// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { FEATURES } from './src/lib/features.mjs';

// Canonical origin. SITE_URL wins; otherwise Netlify's own URL for the site; otherwise a
// placeholder for local development.
const SITE_URL = process.env.SITE_URL || process.env.URL || 'https://ourhealingvoices.example';

/**
 * Optional pages live in src/optional-pages/ (outside src/pages/, so Astro does not route
 * them on its own). They are added back as real routes only while their switch in
 * src/lib/features.mjs is on. Switched off, they are not built at all: no URL, no sitemap
 * entry, and a visitor who types the address gets the normal 404 page.
 */
const optionalPages = {
  name: 'ohv-optional-pages',
  hooks: {
    /** @param {{ injectRoute: (route: { pattern: string; entrypoint: string }) => void }} options */
    'astro:config:setup': ({ injectRoute }) => {
      if (FEATURES.guests) {
        injectRoute({ pattern: '/guests', entrypoint: './src/optional-pages/guests.astro' });
      }
      if (FEATURES.resources) {
        injectRoute({ pattern: '/resources', entrypoint: './src/optional-pages/resources.astro' });
      }
    },
  },
};

// Static-first by design. No SSR adapter, no runtime API calls.
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  // /people was the Version 1 route for the guest directory. It forwards to /guests/ only
  // while the Guests page is switched on; otherwise /people is a plain 404.
  redirects: FEATURES.guests
    ? {
        '/people': '/guests/',
        '/people/': '/guests/',
      }
    : {},
  integrations: [
    optionalPages,
    sitemap({
      // Redirect stubs, the post-submit confirmation and data files stay out of the sitemap.
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/people') &&
        !page.includes('/thank-you') &&
        !page.endsWith('.json'),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
});
