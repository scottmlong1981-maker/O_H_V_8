/**
 * Daily rebuild — how new YouTube uploads reach the site on their own.
 *
 * Netlify runs this once a day (see `config.schedule`). It asks Netlify to rebuild the
 * site, and every build starts by fetching the latest episode list from YouTube
 * (`npm run build:netlify`). A new upload therefore appears within about a day, with no
 * manual edits.
 *
 * Needs one environment variable in Netlify: BUILD_HOOK_URL — the address of a build hook
 * created under Site configuration → Build & deploy → Build hooks. It is kept out of the
 * code on purpose: anyone holding it can trigger builds.
 */
export default async () => {
  const hook = process.env.BUILD_HOOK_URL;
  if (!hook) {
    console.log('Daily rebuild skipped: BUILD_HOOK_URL is not set in Netlify environment variables.');
    return new Response('skipped', { status: 200 });
  }

  const url = new URL(hook);
  url.searchParams.set('trigger_title', 'Daily YouTube refresh');
  const response = await fetch(url, { method: 'POST' });
  console.log(`Daily rebuild requested: ${response.status}`);
  return new Response(response.ok ? 'rebuild requested' : 'rebuild request failed', {
    status: response.ok ? 200 : 502,
  });
};

// Every day at 13:00 UTC — 6:00 AM Arizona time.
export const config = {
  schedule: '0 13 * * *',
};
