/**
 * IndexNow Service for Bigyann.com.np
 * VERSION: Direct-to-Engine Ping (Optimized for Blogs)
 */

const API_KEY = '697e5283984a4b3f85621c84e6be1cab';
const DOMAIN = 'bigyann.com.np';

const DIRECT_ENGINES = [
  'www.bing.com',
  'yandex.com'
];

export const notifyIndexNow = async (urls: string[]) => {
  if (!urls || !urls.length) return;

  // Filter out URLs that have already been pinged in this browser session
  // This prevents spamming engines when a user refreshes or navigates back/forth
  const urlsToPing = urls.filter(url => {
    const storageKey = `indexed_${url}`;
    if (sessionStorage.getItem(storageKey)) return false;
    return true;
  });

  if (urlsToPing.length === 0) return;

  const cleanUrls = urlsToPing.map(url => {
    if (url === '/' || url === '') return `https://${DOMAIN}/`;
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `https://${DOMAIN}${path}`;
  });

  for (const url of cleanUrls) {
    // Skip indexing for local development
    if (window.location.hostname === 'localhost') {
      console.log(`📡 IndexNow: Skipping ping on localhost for ${url}`);
      continue;
    }

    for (const host of DIRECT_ENGINES) {
      try {
        const keyLocation = `https://${DOMAIN}/${API_KEY}.txt`;
        const pingUrl = `https://${host}/indexnow?url=${encodeURIComponent(url)}&key=${API_KEY}&keyLocation=${encodeURIComponent(keyLocation)}`;

        await fetch(pingUrl, {
          mode: 'no-cors',
          cache: 'no-cache',
          referrerPolicy: 'no-referrer-when-downgrade'
        });

        // Mark as pinged so we don't do it again this session
        sessionStorage.setItem(`indexed_${url}`, 'true');
        console.log(`📡 IndexNow: Success to ${host} for ${url}`);
      } catch (err) {
        console.warn(`IndexNow: Failed to ping ${host}`, err);
      }
    }
  }
};

/**
 * Notify Bing Webmaster API about URL changes
 * Uses server-side API route to avoid CORS issues
 */
export const notifyBingWebmaster = async (urls: string[]) => {
  if (!urls || !urls.length) return;

  const DOMAIN = 'bigyann.com.np';

  const cleanUrls = urls.map(url => {
    if (url === '/' || url === '') return `https://${DOMAIN}/`;
    if (url.startsWith('http')) return url;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `https://${DOMAIN}${path}`;
  });

  for (const url of cleanUrls) {
    try {
      const response = await fetch('/api/bing-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        console.log(`✅ Bing Webmaster: Successfully submitted ${url}`);
      } else {
        const error = await response.json();
        console.warn(`⚠️ Bing Webmaster: Failed to submit ${url}`, error);
      }
    } catch (err) {
      console.warn(`⚠️ Bing Webmaster: Error submitting ${url}`, err);
    }
  }
};