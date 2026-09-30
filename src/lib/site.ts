/**
 * Approved destinations and fixed site facts.
 * Only sources approved by the owner may appear here.
 * Approved for this revision: YouTube, Apple Podcasts, Spotify, Instagram, TikTok,
 * Facebook, and the official Linktree (as the source for any further external links).
 */

import { FEATURES } from './features.mjs';

export const SITE_NAME = 'Our Healing Voices';
export const HOST_NAME = 'Aaron Lahman';
export const CATEGORY = 'Self-Improvement';

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@ourhealingvoices';
export const APPLE_PODCASTS_SHOW_URL =
  'https://podcasts.apple.com/us/podcast/our-healing-voices/id1511769033';
export const SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/0skwvayvOFefsv3TbBVIiq';
export const INSTAGRAM_URL = 'https://www.instagram.com/ourhealingvoices/';
export const TIKTOK_URL = 'https://www.tiktok.com/@ourhealingvoices';
export const FACEBOOK_URL = 'https://www.facebook.com/our.healing.voices.podcast';

/**
 * Approved source for any additional external destination. Links are added only where
 * they are contextually useful — not simply because they exist in the Linktree.
 */
export const LINKTREE_URL =
  'https://linktr.ee/ourhealingvoices?utm_source=ig&utm_medium=social&utm_content=link_in_bio';

export const hasAppleDestination = APPLE_PODCASTS_SHOW_URL.trim().length > 0;

/** Standardised presentation of the recurring inform-and-entertain framing. */
export const DISCLAIMER =
  'Our Healing Voices shares personal stories and lived experience. These conversations are intended to inform and entertain. They are not medical advice, diagnosis, or treatment, and they are not a substitute for care from a qualified professional.';

/** Consistent CTA language — no marketing variants. */
export const CTA = {
  watch: 'Watch on YouTube',
  listenApple: 'Listen on Apple Podcasts',
  listenSpotify: 'Listen on Spotify',
  explore: 'Explore Conversations',
  reachOut: 'Reach Out',
} as const;

/**
 * Every section of the site, in navigation order. Guests and Resources are switched off
 * in `features.mjs` — their pages are preserved, but while switched off they are left out
 * of the header and footer here, so both menus always match the pages that actually exist.
 */
const ALL_NAV: { label: string; href: string; enabled: boolean }[] = [
  { label: 'Home', href: '/', enabled: true },
  { label: 'Conversations', href: '/conversations/', enabled: true },
  { label: 'Guests', href: '/guests/', enabled: FEATURES.guests },
  { label: 'About', href: '/about/', enabled: true },
  { label: 'Resources', href: '/resources/', enabled: FEATURES.resources },
];

export const NAV = ALL_NAV.filter((item) => item.enabled).map(({ label, href }) => ({ label, href }));

/** The single action in the header, replacing the former Watch / Listen buttons. */
export const NAV_ACTION = { label: CTA.reachOut, href: '/reach-out/' } as const;

/** Global listening destinations — present on every page via the footer. */
export const LISTEN_LINKS = [
  { label: CTA.listenSpotify, short: 'Spotify', href: SPOTIFY_SHOW_URL, icon: 'spotify', analytics: 'spotify_click' },
  { label: CTA.listenApple, short: 'Apple Podcasts', href: APPLE_PODCASTS_SHOW_URL, icon: 'apple', analytics: 'apple_podcast_click' },
] as const;

/** Global social destinations — present on every page via the footer. */
export const CONNECT_LINKS = [
  { label: 'Our Healing Voices on Instagram', short: 'Instagram', href: INSTAGRAM_URL, icon: 'instagram', analytics: 'instagram_click' },
  { label: 'Our Healing Voices on TikTok', short: 'TikTok', href: TIKTOK_URL, icon: 'tiktok', analytics: 'tiktok_click' },
  { label: 'Our Healing Voices on Facebook', short: 'Facebook', href: FACEBOOK_URL, icon: 'facebook', analytics: 'facebook_click' },
  { label: 'Our Healing Voices on YouTube', short: 'YouTube', href: YOUTUBE_CHANNEL_URL, icon: 'youtube', analytics: 'youtube_click' },
] as const;

/** Fallback image priority ends here: the official artwork, used intact. */
export const ARTWORK = {
  src: '/brand/our-healing-voices-artwork.png',
  width: 603,
  height: 603,
  alt: 'Our Healing Voices podcast artwork: an empty wooden bench in front of a dense green hedge.',
};

/** Owner-supplied photographs of Aaron. Used only where specified. */
export const AARON_IMAGES = {
  speaking: {
    src: '/images/aaron-lahman-speaking.jpg',
    width: 960,
    height: 624,
    alt: 'Aaron Lahman on stage in a dark green shirt, hands raised mid-gesture as he tells a story.',
  },
  portrait: {
    src: '/images/aaron-lahman-portrait.jpg',
    width: 878,
    height: 878,
    alt: 'Aaron Lahman outdoors in a cap and sunglasses, smiling in front of a sunlit green hedge.',
  },
};

/**
 * The time zone used to turn a YouTube upload time into a calendar date, so an evening
 * upload is not shown as the following day. Arizona time, no daylight saving.
 */
export const CHANNEL_TIME_ZONE = 'America/Phoenix';

export const GA_ID = import.meta.env.PUBLIC_GA_ID ?? '';
