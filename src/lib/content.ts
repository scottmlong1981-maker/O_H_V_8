import { getCollection, type CollectionEntry } from 'astro:content';
import { readEpisodeVideoMap } from './episode-videos';
import { readYouTubeCatalog, type CatalogEpisode } from './youtube-catalog';
import { guestPhoto } from './guest-photos';
import { CHANNEL_TIME_ZONE, DISCLAIMER } from './site';

/**
 * A conversation is either a hand-written record from src/content/conversations/
 * (`origin: 'curated'`) or an episode built automatically from the YouTube channel
 * (`origin: 'youtube'`). Both render through the same cards and pages.
 */
export type Conversation = CollectionEntry<'conversations'>['data'] & {
  origin?: 'curated' | 'youtube';
  /** Exact YouTube publish time, used to order episodes released on the same day. */
  publishedAt?: string | null;
};
export type Person = CollectionEntry<'people'>['data'];
export type Theme = CollectionEntry<'themes'>['data'];

/**
 * Applies the owner-maintained `episode-videos.txt` mapping.
 * A video id already stored on the record wins; otherwise the pasted link is used.
 */
function withOwnerVideoLinks(conversation: Conversation): Conversation {
  if (conversation.platforms.youtubeVideoId) return conversation;

  const entry = readEpisodeVideoMap().entries.get(conversation.slug);
  if (!entry) return conversation;

  return {
    ...conversation,
    platforms: {
      ...conversation.platforms,
      youtubeVideoId: entry.videoId,
      youtubeUrl:
        conversation.platforms.youtubeUrl ?? `https://www.youtube.com/watch?v=${entry.videoId}`,
    },
  };
}

const normalise = (value: string | null | undefined) =>
  (value ?? '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Conservative title match, used only for a hand-written record that has no video link yet:
 * the record's title must be contained in the video title (or vice versa), or share at least
 * 80% of its significant words. When in doubt it does not match — the episode then simply
 * appears twice rather than showing the wrong video.
 */
function titlesMatch(recordTitle: string, videoTitle: string): boolean {
  const a = normalise(recordTitle);
  const b = normalise(videoTitle);
  if (!a || !b) return false;
  if (a === b || b.includes(a) || a.includes(b)) return true;
  const aWords = new Set(a.split(' ').filter((w) => w.length > 3));
  const bWords = new Set(b.split(' ').filter((w) => w.length > 3));
  if (aWords.size < 3) return false;
  const overlap = [...aWords].filter((w) => bWords.has(w)).length;
  return overlap / aWords.size >= 0.8;
}

/** A YouTube timestamp as a calendar date in the channel's time zone (YYYY-MM-DD). */
export function toChannelDate(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CHANNEL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const slugify = (value: string) =>
  normalise(value.replace(/&/g, ' and '))
    .replace(/'/g, '')
    .replace(/ /g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-+$/, '');

const URL_PATTERN = /https?:\/\/\S+/g;

/**
 * A short card summary from a YouTube description: the first paragraph that reads as a
 * sentence, with links, hashtags and timestamps removed, trimmed at a word boundary.
 * The wording is YouTube's own — nothing is added.
 */
export function summariseDescription(text: string, max = 220): string | null {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split('\n')
        .filter((line) => !/^\s*(\d{1,2}:)?\d{1,2}:\d{2}\b/.test(line)) // chapter timestamps
        .join(' ')
        .replace(URL_PATTERN, '')
        .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((p) => p.length >= 25);

  const first = paragraphs[0];
  if (!first) return null;
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–—-]+$/, '') + '…';
}

/** A conversation record built from a YouTube episode that has no hand-written page. */
function fromCatalog(episode: CatalogEpisode, slug: string): Conversation {
  const short = summariseDescription(episode.description);
  const url = `https://www.youtube.com/watch?v=${episode.videoId}`;
  return {
    origin: 'youtube',
    publishedAt: episode.publishedAt,
    id: `yt-${episode.videoId}`,
    slug,
    episodeNumber: null,
    title: episode.title,
    publicationDate: toChannelDate(episode.publishedAt),
    guest: { id: null, name: null, shortContext: null, image: null },
    description: { source: episode.description, short, full: episode.description.trim() },
    platforms: {
      youtubeUrl: url,
      youtubeVideoId: episode.videoId,
      youtubeThumbnail: episode.thumbnail
        ? {
            ...episode.thumbnail,
            fallbackUrl: `https://img.youtube.com/vi/${episode.videoId}/hqdefault.jpg`,
          }
        : null,
      applePodcastUrl: null,
      spotifyEpisodeUrl: null,
    },
    topics: [],
    themes: [],
    image: null,
    featured: false,
    relatedConversationIds: [],
    source: {
      sourcePlatform: 'YouTube',
      sourceUrl: url,
      sourceType: 'YouTube Data API (automatic)',
      sourceDate: episode.publishedAt,
      sourceNotes: 'Built automatically from the Our Healing Voices YouTube channel.',
    },
    contentStatus: 'observed',
    publishingStatus: 'published',
    disclaimer: DISCLAIMER,
    seo: {
      seoTitle: null,
      metaDescription: short,
      canonicalUrl: null,
      ogTitle: null,
      ogDescription: short,
      ogImage: episode.thumbnail?.url ?? null,
    },
  };
}

let merged: Conversation[] | null = null;

/**
 * Every public conversation, newest first.
 *
 *   1. Hand-written records with `publishingStatus: "published"` keep all of their text.
 *      When their video is on the channel, YouTube's publish date sets their place in the
 *      order and YouTube's thumbnail is used.
 *   2. Every other full-length YouTube episode becomes a conversation of its own, built
 *      from its YouTube title, description, date and thumbnail.
 *
 * This is the single gate: the home page, Conversations, related cards and the sitemap
 * all read through it.
 */
export async function getPublishedConversations(): Promise<Conversation[]> {
  if (merged) return merged;

  const entries = await getCollection('conversations', ({ data }) => data.publishingStatus === 'published');
  const catalog = readYouTubeCatalog().episodes;
  const byId = new Map(catalog.map((e) => [e.videoId, e]));
  const claimed = new Set<string>();

  const curated = entries.map((e) => {
    let c: Conversation = { ...withOwnerVideoLinks(e.data), origin: 'curated', publishedAt: null };

    // No link on record yet: accept only a confident title match from the channel.
    if (!c.platforms.youtubeVideoId) {
      const match = catalog.find((v) => !claimed.has(v.videoId) && titlesMatch(c.title, v.title));
      if (match) {
        c = {
          ...c,
          platforms: {
            ...c.platforms,
            youtubeVideoId: match.videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${match.videoId}`,
          },
        };
      }
    }

    const video = c.platforms.youtubeVideoId ? byId.get(c.platforms.youtubeVideoId) : undefined;
    if (c.platforms.youtubeVideoId) claimed.add(c.platforms.youtubeVideoId);
    if (!video) return c;

    return {
      ...c,
      publishedAt: video.publishedAt,
      publicationDate: toChannelDate(video.publishedAt),
      platforms: {
        ...c.platforms,
        youtubeThumbnail:
          c.platforms.youtubeThumbnail ??
          (video.thumbnail
            ? { ...video.thumbnail, fallbackUrl: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` }
            : null),
      },
    };
  });

  const taken = new Set(curated.map((c) => c.slug));
  const automatic = catalog
    .filter((episode) => !claimed.has(episode.videoId))
    .map((episode) => {
      let slug = slugify(episode.title) || `episode-${episode.videoId.toLowerCase()}`;
      if (taken.has(slug)) slug = `${slug}-${episode.videoId.toLowerCase()}`;
      taken.add(slug);
      return fromCatalog(episode, slug);
    });

  merged = [...curated, ...automatic].sort(byNewest);
  return merged;
}

/** Newest first: calendar date, then exact YouTube time for same-day uploads. */
export function byNewest(a: Conversation, b: Conversation) {
  return (
    b.publicationDate.localeCompare(a.publicationDate) ||
    (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  );
}

/** Latest is the newest conversation — on a synced build, the newest YouTube episode. */
export function getLatest(conversations: Conversation[]): Conversation | undefined {
  return [...conversations].sort(byNewest)[0];
}

/** Editorial selection, newest first; falls back to nothing rather than to recency. */
export function getFeatured(conversations: Conversation[], limit = 3): Conversation[] {
  return conversations.filter((c) => c.featured).sort(byNewest).slice(0, limit);
}

/**
 * Related conversations, weighted:
 *   shared themes  > shared topics > shared guest > chronological proximity (fallback only).
 * An explicit relatedConversationIds list always wins.
 */
export function getRelated(
  current: Conversation,
  all: Conversation[],
  limit = 3
): Conversation[] {
  const pool = all.filter((c) => c.id !== current.id);

  if (current.relatedConversationIds.length) {
    const manual = current.relatedConversationIds
      .map((id) => pool.find((c) => c.id === id))
      .filter((c): c is Conversation => Boolean(c));
    if (manual.length >= limit) return manual.slice(0, limit);
  }

  const lower = (xs: string[]) => xs.map((x) => x.toLowerCase());
  const currentThemes = new Set(lower(current.themes));
  const currentTopics = new Set(lower(current.topics));
  const currentGuest = current.guest.id;

  const scored = pool.map((c) => {
    const sharedThemes = lower(c.themes).filter((t) => currentThemes.has(t)).length;
    const sharedTopics = lower(c.topics).filter((t) => currentTopics.has(t)).length;
    const sameGuest = currentGuest && c.guest.id === currentGuest ? 1 : 0;

    // Chronological proximity is a tiebreak only: always < 1 point.
    const days =
      Math.abs(Date.parse(c.publicationDate) - Date.parse(current.publicationDate)) / 86_400_000;
    const proximity = 0.5 / (1 + days / 365);

    const score = sharedThemes * 10 + sharedTopics * 4 + sameGuest * 2 + proximity;
    return { conversation: c, score, sharedThemes, sharedTopics };
  });

  return scored
    .filter((s) => s.sharedThemes > 0 || s.sharedTopics > 0 || s.score > 0)
    .sort((a, b) => b.score - a.score || byNewest(a.conversation, b.conversation))
    .slice(0, limit)
    .map((s) => s.conversation);
}

export async function getPeopleDirectory() {
  const published = await getPublishedConversations();
  const publishedIds = new Set(published.map((c) => c.id));
  const entries = await getCollection('people');

  return entries
    .map((e) => e.data)
    .map((person) => ({
      ...person,
      photo: guestPhoto(person.slug, person.image),
      conversations: person.conversationIds
        .filter((id) => publishedIds.has(id))
        .map((id) => published.find((c) => c.id === id)!)
        .sort(byNewest),
    }))
    .filter((p) => p.conversations.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Themes with at least one published conversation, largest first. */
export async function getThemesWithCounts() {
  const published = await getPublishedConversations();
  const publishedIds = new Set(published.map((c) => c.id));
  const entries = await getCollection('themes');

  return entries
    .map((e) => e.data)
    .map((theme) => ({
      ...theme,
      conversationCount: theme.conversationIds.filter((id) => publishedIds.has(id)).length,
    }))
    .filter((t) => t.conversationCount > 0)
    .sort((a, b) => b.conversationCount - a.conversationCount || a.name.localeCompare(b.name));
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function cardDescription(c: Conversation): string {
  return c.description.short ?? c.description.full;
}

/**
 * A YouTube description as paragraphs of plain text and links, for the conversation page.
 * Nothing is rendered as HTML; links open in a new tab.
 */
export function descriptionParagraphs(text: string) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph.split('\n').map((line) => {
        const parts: { text: string; href?: string }[] = [];
        let last = 0;
        for (const match of line.matchAll(URL_PATTERN)) {
          const url = match[0].replace(/[).,;:!?]+$/, '');
          const index = match.index ?? 0;
          if (index > last) parts.push({ text: line.slice(last, index) });
          parts.push({ text: url, href: url });
          last = index + url.length;
        }
        if (last < line.length) parts.push({ text: line.slice(last) });
        return parts;
      })
    )
    .filter((lines) => lines.some((parts) => parts.some((p) => p.text.trim())));
}

/**
 * The 16:9 YouTube thumbnail for a conversation, or null when no video is on record.
 *
 * Preference order:
 *   1. Thumbnail data captured by `npm run sync:youtube` from the YouTube Data API
 *   2. The canonical thumbnail URL derived from the synced video id
 * Nothing here is hand-authored, and nothing is invented when there is no video.
 */
export function youtubeThumbnail(
  c: Conversation
): { url: string; width: number; height: number; fallbackUrl?: string } | null {
  const stored = c.platforms.youtubeThumbnail;
  if (stored) return stored;

  const id = c.platforms.youtubeVideoId;
  if (!id) return null;

  // maxresdefault is the full-size 16:9 thumbnail. It does not exist for every video
  // (older or lower-resolution uploads), so a fallback URL travels with it and the
  // image element swaps to it if the first request 404s.
  return {
    url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    width: 1280,
    height: 720,
    fallbackUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  };
}
