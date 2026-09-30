# Our Healing Voices — Website (Version 1)

The central digital home for **Our Healing Voices**, a podcast hosted and created by **Aaron Lahman**.

The site is built around people and stories rather than around a chronological feed. Its
organising principle is:

> Person → Story → Meaning → Another Story

Visitors discover the show, explore the body of conversations by guest and theme, watch on
YouTube or listen on Spotify or Apple Podcasts, and are then handed the next related
conversation.

---

## Source restrictions — read this before adding anything

This project is **source-locked**. Content, copy, imagery, and branding may come only from:

1. The controlled source package (`01_Brand_Kit.pdf`, `02_Content_Source.md`,
   `03_Website_Specification.md`, `04_Approved_Sources.md`, `05_Content_Schemas.json`)
2. https://www.youtube.com/@ourhealingvoices
3. https://podcasts.apple.com/us/podcast/our-healing-voices/id1511769033
4. https://open.spotify.com/show/0skwvayvOFefsv3TbBVIiq
5. https://www.instagram.com/ourhealingvoices/
6. https://www.tiktok.com/@ourhealingvoices
7. https://www.facebook.com/our.healing.voices.podcast
8. https://linktr.ee/ourhealingvoices — the approved source for any *further* external link.
   Links are added only where they are contextually useful, never because they exist there.
9. The owner-supplied photographs of Aaron in `public/images/`
10. Anything the owner explicitly approves later

All approved destinations live in `src/lib/site.ts`. Add a link there, not inline in a page.

Rules that must not be relaxed without the owner's approval:

- **Do not search the wider web to fill a gap.** If a fact is missing, leave it missing.
- **Do not invent** biographies, credentials, episode numbers, URLs, dates, descriptions,
  testimonials, awards, audience numbers, outcomes, programmes, or offerings.
- **Do not import** content, layout, copy, or identity from any unrelated project.
- **Do not add** a newsletter, shop, donations, coaching, courses, membership, guest
  application, sponsorship, retreat registration, speaking page, merchandise, user accounts,
  or embedded Instagram/TikTok feeds. Version 1 deliberately excludes them. (A Reach Out
  contact form and platform *links* were approved in the revision; feeds and funnels were not.)
- **Never generate or substitute a human face.** A missing portrait gets the brand fallback.

Anything unsupported is recorded in [Known gaps](#known-gaps) rather than filled in.

## Navigation and routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/conversations/` | All conversations — search, filters, sort |
| `/conversations/[slug]/` | One conversation |
| `/about/` | About the show and Aaron |
| `/reach-out/` | Contact form |
| `/reach-out/thank-you/` | Post-submit confirmation (`noindex`, out of the sitemap) |

The header carries the public section links plus a single **Reach Out** action. The footer
lists exactly the same pages. Both come from `NAV` in `src/lib/site.ts`, so they can never
drift apart.

## Switched-off pages: Guests and Resources

The **Guests** (`/guests/`) and **Resources** (`/resources/`) pages are switched off, not
deleted. Their full source is kept in `src/optional-pages/`. While switched off they are not
built at all: no URL (a visitor gets the normal 404), no header or footer link, no sitemap
entry. `/people/` (the old address of Guests) is also a 404 while Guests is off.

**To restore one**, open `src/lib/features.mjs`, change `guests` or `resources` to `true`,
commit, and let Netlify redeploy. The route, the header and footer links, the sitemap entry,
and (for Guests) the `/people/` → `/guests/` forward all come back automatically. Nothing is
rebuilt from scratch.

The content collection is still named `people` internally; guest records are untouched.

## Global social and listening

`src/components/SiteFooter.astro` renders three unlabelled groups on every page — the site's
pages (the same list as the header), the listening links (Spotify, Apple Podcasts), and the
social links (Instagram, TikTok, Facebook, YouTube). The groups carry no visible headings; each
is still a labelled navigation region for screen readers. Destinations
come from `LISTEN_LINKS` and `CONNECT_LINKS` in `src/lib/site.ts`, so a URL is changed in one
place. Platform marks are single-colour inline SVG (`PlatformIcon.astro`) that inherit the brand
ink rather than platform colour, keeping them subordinate to the Our Healing Voices identity.
Every link carries a real text label, a 44px touch target, and `target="_blank"` with
`rel="noopener noreferrer"`.

Conversation pages additionally carry contextual Watch on YouTube / Listen on Spotify / Listen
on Apple Podcasts actions via `PlatformActions.astro`.

## Reach Out form

A plain HTML form posted to **Netlify Forms** — no JavaScript is required for it to work:

- `data-netlify="true"` plus a hidden `form-name` input registers the form at deploy time
- `netlify-honeypot="bot-field"` provides spam protection with no visitor-facing challenge
- Three fields only: Name, Email, Message — all required, all with visible `<label>`s
- Native `required` / `type="email"` validation, enhanced by a small script that marks invalid
  fields with `aria-invalid`, shows per-field messages, moves focus to the first problem, and
  surfaces a `role="alert"` summary
- On success Netlify redirects to `/reach-out/thank-you/`

Submissions appear in the Netlify dashboard under **Forms → reach-out**. Netlify only detects
the form in a deployed build, so it does not capture submissions from `npm run dev`.

## Guest photographs and Connect links

Guest cards on `/guests/` carry a 4:3 photograph, the person's conversations, their themes, and a
quiet **Connect** row. Everything is data-driven — nothing is hard-coded into the page.

**Adding a photo needs no code.** Drop a file into `public/images/guests/` named after the
person's slug (`ambrosia-brown.jpg`, `lance-huffman.jpg`, …) and it appears on the next build.
`public/images/guests/README.txt` has the details. Anyone without a photo keeps the branded
fallback. The pre-build content check reports who still needs one.

Two optional fields on a person record fine-tune the result:

| Field | Use |
| --- | --- |
| `imageAlt` | Describes the photograph for screen readers. A plain description is used if empty. |
| `imageFocus` | CSS `object-position`, e.g. `"center 25%"`, when a face sits high or low in frame. |

**Connect links** come from `links` on the person record — `websiteUrl`, `instagramUrl`,
`facebookUrl`, `publicEmail`, `publicPhone`. Empty fields disappear from the card entirely; there
is never an empty or broken element. Rules that must hold:

- Only destinations from an owner-approved source for **that specific person**.
- An email or phone appears **only** where a business publishes it on its own site as a way to be
  contacted. Never inferred, never assembled from a pattern.
- Personal profiles get a profile link and nothing more — no private details are extracted.
- External links open in a new tab with `rel="noopener noreferrer"`.

The Connect row is deliberately the quietest element on the card. The guest's business must never
outrank the conversation they appear in.

## Brand Kit

`01_Brand_Kit.pdf` is authoritative. Its Section 06 tokens are implemented verbatim in
`src/styles/global.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--ohv-field` | `#24622F` | Apple Podcasts presentation field |
| `--ohv-hedge` | `#225C2B` | Dominant cover-art green |
| `--ohv-leaf` | `#306F31` | Secondary foliage green |
| `--ohv-shadow` | `#133E24` | Deep foliage / dark field |
| `--ohv-bench` | `#CDCAC9` | Light neutral from the bench |
| `--ohv-bench-shadow` | `#ACAFA7` | Secondary bench neutral |
| `--ohv-soft-white` | `#F3F6F3` | Light field |
| `--ohv-podcast-mist` | `#E6F1E8` | Mist / CTA field |

No other colours may be introduced. Type follows the observed relationship — thin geometric
sans for `OUR HEALING`, high-contrast editorial serif for `VOICES`, humanist sans for body and
UI. The production faces (Jost, Cormorant Garamond, Inter) are **approximations**, not the
identified originals, and every stack has a system fallback.

The official artwork lives at `public/brand/our-healing-voices-artwork.png` and is used intact —
never recoloured, redrawn, cropped past the bench or title, overlaid, or AI-recreated.

> **Asset limitation:** that file is a crop of the owner-supplied Apple Podcasts screenshot. It
> is a reference image, not the original high-resolution artwork. Replace it with the original
> when it becomes available, keeping the same path and filename.

## Stack

- [Astro](https://astro.build) 5, static output — no SSR adapter, no runtime API calls
- TypeScript, strict
- Astro Content Collections (JSON records, Zod-validated)
- CSS custom properties + component-scoped CSS — no CSS framework
- [Fuse.js](https://fusejs.io) for client-side search (the only client JS beside the mobile nav)
- `@astrojs/sitemap`

## Local setup

```bash
npm install
cp .env.example .env      # then fill in the values you need
npm run dev               # http://localhost:4321
```

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server with hot reload |
| `npm run sync:youtube` | Fetch the episode list from the YouTube Data API into `src/data/youtube-catalog.json` (needs `YOUTUBE_API_KEY`) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Astro + TypeScript diagnostics |
| `npm run content:check` | Report published conversations with no linked YouTube video |

## Environment variables

Copy `.env.example` to `.env`. **`.env` is git-ignored and must never be committed.**

| Variable | Required | Notes |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | For automatic episodes | Build-time only. Never referenced from client code, never prefixed `PUBLIC_`, never written into any file. The site still builds without it. |
| `BUILD_HOOK_URL` | For the daily rebuild | Netlify only. Read by `netlify/functions/daily-rebuild.mjs`. |
| `PUBLIC_GA_ID` | No | GA4 measurement ID. Leave blank and no analytics script is emitted. No ID is invented. |
| `SITE_URL` | No | Canonical origin, no trailing slash. Feeds canonical URLs, Open Graph URLs, the sitemap, and `robots.txt`. On Netlify, the site's own URL is used when this is blank. |

Analytics hooks are already on the CTAs as `data-analytics` attributes
(`youtube_click`, `apple_podcast_click`) if GA4 event tracking is added later.

## Content structure

Conversations are **never** hard-coded into components. Everything comes from JSON records in
content collections, validated by `src/content.config.ts` against `05_Content_Schemas.json`.

```
src/content/
  conversations/<slug>.json   one conversation
  people/<slug>.json          one person (host or guest) + their conversation ids
  themes/<slug>.json          one theme + its conversation ids
```

Every record carries provenance (`source.sourcePlatform`, `sourceUrl`, `sourceType`,
`sourceDate`, `sourceNotes`), a `contentStatus` (`observed` | `developed` | `approved` |
`missing`), and a `publishingStatus`.

**Topics vs themes.** Topics are the specific subjects discussed in one conversation
(“breathwork”, “cancer caregiving”). Themes are the broader recurring meanings that run across
the catalogue (“Grief”, “Body”, “Resilience”). Only themes appear as public filters.

### Publishing status

| Status | Behaviour |
| --- | --- |
| `draft` | Not built, not linked, not in the sitemap |
| `approved` | Reviewed but still not public |
| `published` | Public — the only status that renders |

`getPublishedConversations()` in `src/lib/content.ts` is the single gate. Everything else — the
homepage, People, themes, search, related conversations, the sitemap — reads through it.

### How to add a conversation

1. Create `src/content/conversations/<slug>.json`. Copy an existing record as a template.
2. Fill in only what an approved source supports. Leave anything else `null` — the templates
   omit missing sections rather than filling them.
   - No verified YouTube video? Leave `platforms.youtubeVideoId` and `youtubeUrl` null. The page
     shows the artwork and links to the channel.
   - No verified Apple episode URL? Leave `applePodcastUrl` null. The show-level destination is
     used instead. Never guess an episode URL.
   - No approved guest biography? Leave `guest.shortContext` null. The “About the Guest” section
     disappears.
3. Add the guest to `src/content/people/` — the collection directory keeps its internal name;
   the public directory is `/guests/` — or append the conversation id to their existing record,
   then append the id to each theme in `src/content/themes/` that applies.
4. Set `contentStatus` honestly and `publishingStatus` to `draft` until it is reviewed.
5. `npm run dev` and check the conversation page, People, and the theme counts.

`scripts/seed.mjs` documents how the current seed catalogue was derived from
`02_Content_Source.md`. It is kept for provenance; re-running it rewrites the seed records.

### Content approval process

1. **Observed** — draft the record from an approved source, `publishingStatus: "draft"`.
2. **Developed** — any written copy must restate source meaning without adding a new factual
   claim. Mark it `developed`.
3. **Approved** — the owner confirms it. Set `publishingStatus: "approved"`.
4. **Published** — set `publishingStatus: "published"`. It is now live.

Anything the owner has not confirmed stays out of the public build.

## Selection logic

| Behaviour | Rule |
| --- | --- |
| Latest | Newest conversation by YouTube publish time (on a synced build, the newest YouTube upload) |
| Recent | The six conversations after Latest, newest to oldest (home page). `featured: true` is kept on records but no longer used on the home page. |
| Related | Shared themes (×10) > shared topics (×4) > shared guest (×2) > chronological proximity (<1, tiebreak only). An explicit `relatedConversationIds` list overrides the scoring. |
| Search | Fuse.js over title, guest, description, topics, themes. Partial and case-insensitive. |
| Filters | Theme, person, newest/oldest. Search and filters compose; state is mirrored into the URL (`?q=&theme=&guest=&sort=`) so a filtered view is linkable. |

## YouTube — automatic episodes

The YouTube channel drives the episode list. Nobody edits the site when a new episode goes up.

```
YouTube Data API v3 → npm run sync:youtube → src/data/youtube-catalog.json → build → site
        ↑ once a day: netlify/functions/daily-rebuild.mjs triggers a Netlify build
```

1. **Every Netlify build** runs `npm run build:netlify`, which first runs the YouTube sync.
   It reads every upload on @ourhealingvoices and keeps the public, full-length ones. Shorts
   (three minutes or less), premieres or live streams that have not happened yet, and private
   or unlisted videos are left out. The result is saved to `src/data/youtube-catalog.json`
   (git-ignored — it is regenerated on every build).
2. **The build merges that list with the hand-written records** in
   `src/content/conversations/` (`getPublishedConversations()` in `src/lib/content.ts`):
   - A hand-written record keeps all of its own text, guest, topics and themes. When its video
     is on the channel, YouTube's publish date sets its date and place in the order, and
     YouTube's thumbnail is used. A record is linked to its video by `episode-videos.txt`,
     or — only when that line is blank — by a conservative title match.
   - Every other episode gets its own conversation page, built from its YouTube title,
     description, date and thumbnail. Its address is made from its title, e.g.
     `/conversations/breathing-into-wholeness/`.
3. **Ordering is newest to oldest by YouTube publish time** everywhere: the home page Latest
   Conversation is the newest upload, Recent Conversations are the six after it, and the
   Conversations page lists them all.
4. **Once a day** (13:00 UTC, 6:00 AM Arizona time) the scheduled function
   `netlify/functions/daily-rebuild.mjs` calls a Netlify build hook, so a new upload appears
   within about a day. It needs `BUILD_HOOK_URL` set in Netlify (see below).

If YouTube cannot be reached during a build, nothing disappears: the sync falls back to the
list the previous deploy published at `/youtube-catalog.json`. With no key and no earlier list
(e.g. local development), the site builds from the hand-written conversations only.

The API key is read at build time from the `YOUTUBE_API_KEY` environment variable only. It is
never written to a file, never sent to the browser, and never printed in the build log.

**Cost.** Each sync uses about 5 units of the free 10,000-unit daily YouTube quota.

### Video cards

Wherever an episode appears — Latest Conversation, Recent Conversations, the Conversations
page, related cards — a linked video shows its real YouTube thumbnail in a 16:9 frame with a
centered play mark (`PlayOverlay.astro`), and clicking it opens that episode's conversation
page. The mark is in the brand's deep green and scales with the card so it never covers much
of the picture. An episode with no confirmed video keeps the branded fallback.

The Conversations page shows the newest 12 episodes first; **More Episodes** reveals 12 more
each time, still newest to oldest, until the whole archive is showing. Search, theme, person
and sort filters work across the whole archive.

Conversation pages embed the video responsively through `youtube-nocookie.com`, with a 16:9
container, an accessible player title, `loading="lazy"`, and no autoplay.

### `episode-videos.txt`

Still supported. It pins a hand-written conversation to a specific YouTube video. Paste the
address from the browser bar next to the episode and redeploy. A blank line lets the build
look for a confident title match instead.

## Apple Podcasts and Spotify

No Apple or Spotify API is needed. The verified show URLs are set in `src/lib/site.ts`. Where an
episode-level URL is unknown, the show-level destination is used instead — episode URLs are
never guessed. `platforms.applePodcastUrl` and `platforms.spotifyEpisodeUrl` on a conversation
record override the show link for that episode once verified links exist.

## Accessibility

Targets WCAG 2.2 AA. Semantic landmarks and heading order, a skip-to-content link, visible
focus rings, keyboard-operable navigation and filters, labelled form controls, alt text (with
decorative brand fields hidden from assistive tech), accessible video titles, 44–48px touch
targets, and `prefers-reduced-motion` support.

Verified with axe-core across all six page types at 390px and 1280px: **no violations**
(`node scripts/a11y.mjs` against a running `npm run preview`).

## Performance

Static rendering, no framework runtime, a single ~10KB gzipped client bundle (search) plus a few
lines for the mobile nav, explicit image dimensions, lazy loading below the fold, `font-display:
swap` with full system fallbacks, no autoplay, and no animation libraries.

## SEO

Every page has a unique title, meta description, canonical URL, and Open Graph title,
description, and image. Conversation titles follow `[Episode Title] | Our Healing Voices`.
Structured data: `PodcastSeries` (home), `PodcastEpisode` (conversation pages), `Person`
(about). Schema fields are emitted only when the record actually supports them — episode numbers
and guests are omitted where unknown rather than invented. `sitemap-index.xml` and `robots.txt`
are generated at build time from `SITE_URL`; the 404 page is `noindex`.

## Automatic YouTube updates on Netlify — setup

Two environment variables, set once in Netlify → **Site configuration → Environment
variables**:

| Variable | Value | Used by |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | The Google Cloud API key, restricted to YouTube Data API v3 | The build (sync) |
| `BUILD_HOOK_URL` | A build hook address from Netlify → Site configuration → Build & deploy → Build hooks | The daily rebuild |

Neither is ever committed. Without `YOUTUBE_API_KEY` the build still succeeds, using the
previous deploy's episode list. Without `BUILD_HOOK_URL` the daily rebuild does nothing, and
new episodes appear on the next deploy instead.

## Deployment

Any static host. Build with the production origin set:

```bash
SITE_URL=https://yourdomain.com npm run build
# deploy dist/
```

- **Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, publish directory
  `dist`. Add `SITE_URL` (and `PUBLIC_GA_ID` if used) as environment variables.
- `YOUTUBE_API_KEY` is only needed if `sync:youtube` runs in CI. It is not required to build.
- Serve `404.html` as the not-found page (Netlify, Vercel, and Cloudflare Pages do this
  automatically).

## Project structure

```
public/brand/          official artwork
public/images/         owner-supplied photographs of Aaron
scripts/               seed.mjs, sync-youtube.mjs, qa.mjs, a11y.mjs
src/components/        header, footer, cards, play mark, embed, explorer, disclaimer
src/content/           conversations, people, themes (JSON records)
src/layouts/           BaseLayout — SEO, structured data, shell
src/lib/               site constants + content queries and selection logic
src/pages/             /, /conversations, /conversations/[slug], /about, /reach-out,
                       /reach-out/thank-you, 404, robots.txt, youtube-catalog.json
src/optional-pages/    Guests and Resources — kept, switched off in src/lib/features.mjs
src/lib/features.mjs   on/off switches for the optional pages
src/data/              youtube-catalog.json, generated at build time (git-ignored)
netlify/functions/     daily-rebuild.mjs — the scheduled daily rebuild
src/styles/global.css  brand tokens and the shared system
```

## Known gaps

Recorded rather than filled. Each needs owner-approved source material.

| Gap | Current behaviour |
| --- | --- |
| Original high-resolution podcast artwork | A crop of the supplied screenshot stands in at `public/brand/`. Replace at the same path. |
| Netlify form notifications | The form is wired up, but email notifications for submissions have to be switched on once in Netlify → Forms → Notifications. |
| Verified Apple Podcasts / Spotify **episode** URLs | All null. Show-level destinations are used instead. |
| Guest photographs | None supplied. The Guests page is switched off; guest cards use the brand fallback when it returns. |
| Resources content | `/resources/` is switched off until the owner supplies material. |
| Complete catalogue | Every public full-length YouTube episode appears automatically. Only the 8 seed conversations have hand-written text, guests and themes; the rest use their YouTube title and description and have no themes, so they do not appear under theme filters. |
| Original platform episode descriptions | `description.source` is empty; `description.full` is developed copy that restates only the recorded subjects. Replace with verified text when available. |
| Guest biographies and portraits | All null. “About the Guest” is omitted; portraits use the brand field. No face is ever generated. |
| Conventional Aaron Lahman biography | Not written. The About page keeps to source-derived posture — no résumé, credentials, or career history. |
| Transcripts, clips, collections | Out of Version 1 scope; the content model leaves room for them. |
| Contact / business inquiry, newsletter, offers, retreats | Deliberately excluded from Version 1. |

## Architected for later

Theme landing pages, individual person pages, transcripts and transcript search, clips,
resources, collections. The content model already carries the ids and relationships these need;
none of them are built.
