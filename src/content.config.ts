import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Schemas mirror 05_Content_Schemas.json.
 * Nothing here may be populated by inference — unsupported fields stay null.
 */

const contentStatus = z.enum(['observed', 'developed', 'approved', 'missing']);
const publishingStatus = z.enum(['draft', 'approved', 'published']);

const provenance = z.object({
  sourcePlatform: z.string(),
  sourceUrl: z.string().url().nullable().default(null),
  sourceType: z.string().nullable().default(null),
  sourceDate: z.string().nullable().default(null),
  sourceNotes: z.string().nullable().default(null),
});

const seo = z
  .object({
    seoTitle: z.string().nullable().default(null),
    metaDescription: z.string().nullable().default(null),
    canonicalUrl: z.string().nullable().default(null),
    ogTitle: z.string().nullable().default(null),
    ogDescription: z.string().nullable().default(null),
    ogImage: z.string().nullable().default(null),
  })
  .default({});

const conversations = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/conversations' }),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    episodeNumber: z.number().nullable().default(null),
    title: z.string(),
    publicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    guest: z.object({
      id: z.string().nullable().default(null),
      name: z.string().nullable().default(null),
      shortContext: z.string().nullable().default(null),
      image: z.string().nullable().default(null),
    }),
    description: z.object({
      /** Verbatim platform description when one has been verified. Empty when none is on record. */
      source: z.string().default(''),
      short: z.string().nullable().default(null),
      full: z.string(),
    }),
    platforms: z.object({
      youtubeUrl: z.string().url().nullable().default(null),
      youtubeVideoId: z.string().nullable().default(null),
      /**
       * Thumbnail as reported by the YouTube Data API (written by `npm run sync:youtube`).
       * Never hand-authored. When absent but a videoId exists, the canonical YouTube
       * thumbnail URL is derived from the id at render time.
       */
      youtubeThumbnail: z
        .object({
          url: z.string().url(),
          width: z.number(),
          height: z.number(),
          fallbackUrl: z.string().url().optional(),
        })
        .nullable()
        .default(null),
      applePodcastUrl: z.string().url().nullable().default(null),
      spotifyEpisodeUrl: z.string().url().nullable().default(null),
    }),
    topics: z.array(z.string()).default([]),
    themes: z.array(z.string()).default([]),
    image: z.string().nullable().default(null),
    featured: z.boolean().default(false),
    relatedConversationIds: z.array(z.string()).default([]),
    source: provenance,
    contentStatus,
    publishingStatus,
    disclaimer: z.string().nullable().default(null),
    seo,
  }),
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/people' }),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    /** "host" is labelled Host & Creator, never presented as an ordinary guest. */
    role: z.enum(['host', 'guest']).default('guest'),
    /**
     * Explicit path to an approved photograph. Usually left null: a file dropped at
     * public/images/guests/<slug>.jpg is picked up automatically at build time.
     */
    image: z.string().nullable().default(null),
    /** Describes the photograph for screen readers. Falls back to a neutral description. */
    imageAlt: z.string().nullable().default(null),
    /** CSS object-position, e.g. "center 25%", when a face sits high or low in the frame. */
    imageFocus: z.string().nullable().default(null),
    /**
     * Public, professional destinations only, each taken from an owner-approved source.
     * Empty fields are hidden by the UI — never inferred, never guessed.
     */
    links: z
      .object({
        websiteUrl: z.string().url().nullable().default(null),
        instagramUrl: z.string().url().nullable().default(null),
        facebookUrl: z.string().url().nullable().default(null),
        /** Only when a business explicitly publishes it as a contact address. */
        publicEmail: z.string().email().nullable().default(null),
        /** Only when a business explicitly presents it as a contact number. */
        publicPhone: z.string().nullable().default(null),
      })
      .default({}),
    shortContext: z.string().nullable().default(null),
    conversationIds: z.array(z.string()).default([]),
    themes: z.array(z.string()).default([]),
    source: z.object({
      sourcePlatform: z.string().nullable().default(null),
      sourceUrl: z.string().url().nullable().default(null),
    }),
    contentStatus,
  }),
});

const themes = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/themes' }),
  schema: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable().default(null),
    conversationIds: z.array(z.string()).default([]),
    contentStatus,
  }),
});

export const collections = { conversations, people, themes };
