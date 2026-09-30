/**
 * Optional pages — switched off, not deleted.
 *
 * The Guests and Resources pages still exist in full in `src/optional-pages/`. They are
 * simply not built while their switch below is `false`, so they have no public URL and
 * are absent from the header, the footer, and the sitemap.
 *
 * TO RESTORE A PAGE: change its value to `true`, commit, and let Netlify redeploy.
 * Nothing else needs editing — the route, the header link, the footer link, the sitemap
 * entry, and (for Guests) the old /people redirect all come back automatically.
 *
 * Plain JavaScript on purpose: astro.config.mjs reads this file too.
 */
export const FEATURES = {
  /** /guests/ — the guest directory. */
  guests: false,
  /** /resources/ — the resources placeholder page. */
  resources: false,
};
