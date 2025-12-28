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

  // Skip indexing for local development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(`📡 IndexNow: Skipping ping on localhost`);
    return;
  }

  // Filter out URLs that have already been pinged in this browser session
  // This prevents spamming engines when a user refreshes or navigates back/forth
  const urlsToPing = urls.filter(url => {
    if (typeof window === 'undefined') return true; // Server-side, always submit
    const storageKey = `indexed_${url}`;
    if (sessionStorage.getItem(storageKey)) return false;
    return true;
  });

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

      // Mark as pinged so we don't do it again this session
      if (typeof window !== 'undefined') {
        urlsToPing.forEach(url => {
          sessionStorage.setItem(`indexed_${url}`, 'true');
        });
      }
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