/**
 * IndexNow Service for Bigyann.com.np
 * VERSION: Direct-to-Engine Ping (Optimized for Blogs)
 */

const API_KEY = 'e35d69cc7c89486cba626398fe444e70';
const DOMAIN = 'bigyann.com.np';

const DIRECT_ENGINES = [
  'www.bing.com',
  'yandex.com'
];

export const notifyIndexNow = async (urls: string[]) => {
  if (!urls || !urls.length) return;

  // Skip indexing for local development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(`📡 IndexNow: Skipping ping on localhost`);
    return;
  }

  // Filter logic removed as we no longer ping on page view.
  // All calls to this function should be from intentional content updates (Admin).
  const urlsToPing = urls;

  if (urlsToPing.length === 0) return;

  try {
    // Use server-side API route to avoid CORS issues
    const response = await fetch('/api/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: urlsToPing }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📡 IndexNow: Successfully submitted ${urlsToPing.length} URL(s)`, data);

      // Log success

    } else {
      const error = await response.json();
      console.warn(`⚠️ IndexNow: Failed to submit URLs`, error);
    }
  } catch (err) {
    console.warn(`⚠️ IndexNow: Error submitting URLs`, err);
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