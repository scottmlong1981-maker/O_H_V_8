/**
 * One-time seed writer for the verified catalog in 02_Content_Source.md.
 * Kept in the repo so the provenance of every seed record is auditable.
 * Re-running rewrites the seed files; it does not invent new records.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DISCLAIMER =
  'Our Healing Voices shares personal stories and lived experience. These conversations are intended to inform and entertain. They are not medical advice, diagnosis, or treatment, and they are not a substitute for care from a qualified professional.';

const SOURCE = {
  sourcePlatform: 'Apple Podcasts',
  sourceUrl: null,
  sourceType: 'owner-supplied show presentation',
  sourceDate: null,
  sourceNotes:
    'Episode surfaced in the approved seed catalog (02_Content_Source.md). No verified episode-level YouTube or Apple URL is on record yet.',
};

/**
 * `topics` are the specific subjects the approved catalog records for the episode.
 * `themes` are the broader recurring meanings, drawn only from the approved theme
 * candidate list where the recorded subjects support them.
 * `description.full` is developed copy that restates those recorded subjects and
 * adds no new factual claim.
 */
const conversations = [
  {
    slug: 'breathing-into-wholeness',
    episodeNumber: 52,
    title: '"Breathing Into Wholeness" with Lance Huffman',
    publicationDate: '2025-12-27',
    guestName: 'Lance Huffman',
    topics: ['Deep conversation', 'Inspiration', 'Hope', 'Individual paths', "Men's community"],
    themes: ['Healing', 'Connection'],
    featured: true,
    short: 'A conversation with Lance Huffman about hope, inspiration, and the individual paths people walk.',
    full: 'Aaron sits with Lance Huffman for a deep conversation about hope and inspiration, the individual paths people walk in their own healing, and what men find in community with one another.',
  },
  {
    slug: 'the-shore-inside-coming-home-to-your-body',
    episodeNumber: 51,
    title: '"The Shore Inside: Coming Home To Your Body" with Carolyn Contreras (Aunt Sea)',
    publicationDate: '2025-10-17',
    guestName: 'Carolyn Contreras',
    topics: ['Emotional intelligence', 'Feelings', 'Body awareness', 'Healing'],
    themes: ['Body', 'Healing'],
    featured: true,
    short: 'Carolyn Contreras, known as Aunt Sea, on feelings, emotional intelligence, and coming home to the body.',
    full: 'Carolyn Contreras, known as Aunt Sea, talks with Aaron about emotional intelligence and feelings, about body awareness, and about what it means to come home to your own body as part of healing.',
  },
  {
    slug: 'sleepless-nights-endless-love',
    episodeNumber: null,
    title: '"Sleepless Nights, Endless Love"',
    publicationDate: '2025-08-11',
    guestName: 'Aaron Lahman',
    topics: ['New fatherhood', 'Resilience', 'Trauma', 'Love', 'Curiosity', 'Personal healing'],
    themes: ['Parenthood', 'Love', 'Resilience', 'Healing'],
    featured: false,
    short: 'Aaron speaks in his own voice about new fatherhood, love, trauma, and his own healing.',
    full: 'Aaron speaks in his own voice about the sleeplessness and love of new fatherhood, about resilience and trauma, and about staying curious inside his own healing.',
  },
  {
    slug: 'created-for-greatness',
    episodeNumber: null,
    title: '"Created for Greatness" with Angela Lahman',
    publicationDate: '2024-08-30',
    guestName: 'Angela Lahman',
    topics: ['Family', 'Bravery', 'Energy', 'Intentional living', 'Transformation'],
    themes: ['Relationships', 'Transformation'],
    featured: true,
    short: 'Angela Lahman on family, bravery, and living intentionally.',
    full: 'Angela Lahman joins Aaron to talk about family and bravery, about the energy a person brings to a life, and about the transformation that intentional living can ask of someone.',
  },
  {
    slug: 'making-space-for-light-joy-and-laughter',
    episodeNumber: null,
    title: '"Making Space for Light, Joy, & Laughter" with Ambrosia Brown',
    publicationDate: '2024-08-29',
    guestName: 'Ambrosia Brown',
    topics: ['Grief', 'Massage', 'Spirituality', 'Oneness', 'Joy'],
    themes: ['Grief', 'Spirituality'],
    featured: false,
    short: 'Ambrosia Brown on grief, spirituality, and making space for joy and laughter.',
    full: 'Ambrosia Brown talks with Aaron about grief and about her work in massage, about spirituality and Oneness, and about making space for light, joy, and laughter alongside it all.',
  },
  {
    slug: 'baby-coming-bungalow-rocking-and-grieving-still',
    episodeNumber: null,
    title: '"Baby Coming, Bungalow Rocking, & Grieving Still"',
    publicationDate: '2024-07-11',
    guestName: 'Aaron Lahman',
    topics: ['Grief', 'Purpose', 'Stories', 'Resilience', 'Meaning', 'Healing'],
    themes: ['Grief', 'Purpose', 'Resilience', 'Healing'],
    featured: false,
    short: 'Aaron on grief that stays, and on purpose, meaning, and resilience while life keeps moving.',
    full: 'Aaron speaks about grieving still while a baby is coming and the bungalow is rocking — about stories and meaning, about purpose and resilience, and about healing that does not arrive on schedule.',
  },
  {
    slug: 'womens-health-physical-therapy',
    episodeNumber: null,
    title: '"Women’s Health Physical Therapy" with Dr. Dawn Andalon',
    publicationDate: '2023-05-06',
    guestName: 'Dr. Dawn Andalon',
    topics: ["Women's wellness", 'Physical therapy', 'Cancer caregiving', 'Grief'],
    themes: ['Body', 'Grief'],
    featured: false,
    short: "Dr. Dawn Andalon on women's health physical therapy, caregiving through cancer, and grief.",
    full: "Dr. Dawn Andalon talks with Aaron about women's wellness and physical therapy, about caregiving through cancer, and about the grief carried alongside that work.",
  },
  {
    slug: 'dive-into-what-makes-you-feel-alive',
    episodeNumber: null,
    title: '"Dive Into What Makes You Feel Alive" with Malwina Sitarz',
    publicationDate: '2023-04-05',
    guestName: 'Malwina Sitarz',
    topics: ['Movement', 'Creativity', 'Yoga', 'Fitness', 'Breathwork', 'Passions and dreams'],
    themes: ['Body', 'Creativity'],
    featured: true,
    short: 'Malwina Sitarz on movement, creativity, and following what makes you feel alive.',
    full: 'Malwina Sitarz joins Aaron to talk about movement and creativity — yoga, fitness, breathwork — and about diving into the passions and dreams that make a person feel alive.',
  },
];

/**
 * Public destinations for each person, taken ONLY from owner-approved sources.
 * Nothing here is inferred: an email or phone appears only where the business
 * publishes it on its own site as a way to be contacted.
 */
const profiles = {
  'lance-huffman': {
    // Approved source: personal Facebook profile. Link only — no private details.
    links: { facebookUrl: 'https://www.facebook.com/lance.huffman' },
  },
  'angela-lahman': {
    // Approved source: her professional website, which publishes these itself.
    links: {
      websiteUrl: 'https://angelalahman.com/',
      instagramUrl: 'https://www.instagram.com/angelalahman/',
      facebookUrl: 'https://www.facebook.com/angela.lahman',
      publicEmail: 'angela@angelalahman.com',
    },
  },
  'carolyn-contreras': {
    links: { facebookUrl: 'https://www.facebook.com/carolyn.contreras.12' },
  },
  'ambrosia-brown': {
    // Approved source: her business site, which publishes phone and email for booking.
    links: {
      websiteUrl: 'https://www.ambrosiabrownmassage.com/',
      facebookUrl: 'https://www.facebook.com/Ambrosia-Brown-Massage-119290791449097/',
      publicEmail: 'ambrosiabrown@gmail.com',
      publicPhone: '435-260-1122',
    },
  },
  'dr-dawn-andalon': {
    // Approved source: the practice website. Its robots policy blocks automated reading,
    // so no email or phone is recorded here rather than guessing one.
    links: { websiteUrl: 'https://www.reviveptandpilates.com/' },
  },
  'malwina-sitarz': {
    links: { facebookUrl: 'https://www.facebook.com/malwina.sitarz/' },
  },
  'aaron-lahman': {
    // Owner-supplied photograph, already approved for use on the About page.
    image: '/images/aaron-lahman-portrait.jpg',
    imageAlt:
      'Aaron Lahman outdoors in a cap and sunglasses, smiling in front of a sunlit green hedge.',
    links: { instagramUrl: 'https://www.instagram.com/aaron.lahman/' },
  },
};

const emptyLinks = {
  websiteUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  publicEmail: null,
  publicPhone: null,
};

const personSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const themeDescriptions = {
  Healing:
    'Conversations where healing is treated as something lived and personal rather than something finished.',
  Connection: 'Conversations about what people find in one another.',
  Body: 'Conversations that stay close to the body — how it holds experience and how people return to it.',
  Grief: 'Conversations with people carrying loss, and still speaking.',
  Love: 'Conversations where love is the reason the story is being told.',
  Parenthood: 'Conversations about becoming a parent and what it changes.',
  Resilience: 'Conversations about what people keep choosing after something hard.',
  Purpose: 'Conversations about meaning and the reasons people keep going.',
  Relationships: 'Conversations about family and the people we live our lives beside.',
  Spirituality: 'Conversations about the spiritual dimensions people describe in their own healing.',
  Transformation: 'Conversations about lives that changed direction on purpose.',
  Creativity: 'Conversations about movement, making, and what makes a person feel alive.',
};

// --- build records -----------------------------------------------------------

const records = conversations.map((c) => {
  const id = c.slug;
  return {
    id,
    slug: c.slug,
    episodeNumber: c.episodeNumber,
    title: c.title,
    publicationDate: c.publicationDate,
    guest: {
      id: personSlug(c.guestName),
      name: c.guestName,
      shortContext: null,
      image: null,
    },
    description: { source: '', short: c.short, full: c.full },
    platforms: {
      youtubeUrl: null,
      youtubeVideoId: null,
      youtubeThumbnail: null,
      applePodcastUrl: null,
      spotifyEpisodeUrl: null,
    },
    topics: c.topics,
    themes: c.themes,
    image: null,
    featured: c.featured,
    relatedConversationIds: [],
    source: SOURCE,
    contentStatus: 'developed',
    publishingStatus: 'published',
    disclaimer: DISCLAIMER,
    seo: {
      seoTitle: null,
      metaDescription: c.short,
      canonicalUrl: null,
      ogTitle: null,
      ogDescription: c.short,
      ogImage: null,
    },
  };
});

const peopleMap = new Map();
for (const r of records) {
  const key = r.guest.id;
  if (!peopleMap.has(key)) {
    peopleMap.set(key, {
      id: key,
      slug: key,
      name: r.guest.name,
      role: r.guest.name === 'Aaron Lahman' ? 'host' : 'guest',
      image: profiles[key]?.image ?? null,
      imageAlt: profiles[key]?.imageAlt ?? null,
      imageFocus: profiles[key]?.imageFocus ?? null,
      links: { ...emptyLinks, ...(profiles[key]?.links ?? {}) },
      shortContext: null,
      conversationIds: [],
      themes: [],
      source: { sourcePlatform: 'Apple Podcasts', sourceUrl: null },
      contentStatus: 'observed',
    });
  }
  const p = peopleMap.get(key);
  p.conversationIds.push(r.id);
  for (const t of r.themes) if (!p.themes.includes(t)) p.themes.push(t);
}

const themeMap = new Map();
for (const r of records) {
  for (const name of r.themes) {
    const key = personSlug(name);
    if (!themeMap.has(key)) {
      themeMap.set(key, {
        id: key,
        slug: key,
        name,
        description: themeDescriptions[name] ?? null,
        conversationIds: [],
        contentStatus: 'developed',
      });
    }
    themeMap.get(key).conversationIds.push(r.id);
  }
}

const write = (dir, items) => {
  mkdirSync(join(root, dir), { recursive: true });
  for (const item of items) {
    writeFileSync(join(root, dir, `${item.slug}.json`), JSON.stringify(item, null, 2) + '\n');
  }
};

write('src/content/conversations', records);
write('src/content/people', [...peopleMap.values()]);
write('src/content/themes', [...themeMap.values()]);

console.log(
  `Seeded ${records.length} conversations, ${peopleMap.size} people, ${themeMap.size} themes.`
);
