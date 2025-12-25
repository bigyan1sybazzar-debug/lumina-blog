/**
 * IndexNow Service for Bigyann.com.np
 * * VERSION: Direct-to-Engine Ping (Verified 202 Success)
 * * COMPATIBILITY: Works for Static Pages, Tools, and Blog Posts.
 * REASON: Browser requests to api.indexnow.org are blocked by CORS/405 errors.
 * This service pings search engines directly using the GET protocol.
 */

const API_KEY = '697e5283984a4b3f85621c84e6be1cab'; 
const DOMAIN = 'bigyann.com.np'; 

// Engines that support the direct GET ping protocol
const DIRECT_ENGINES = [
  'www.bing.com',
  'yandex.com'
];

/**
 * Notifies search engines directly via GET requests.
 * Supports static routes (/about) and dynamic blog routes (/:slug).
 */
export const notifyIndexNow = async (urls: string[]) => {
  if (!urls || !urls.length) return;

  const cleanUrls = urls.map(url => {
    // Handle home page case
    if (url === '/' || url === '') return `https://${DOMAIN}/`;
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) return url;
    
    // Ensure path starts with / for blog slugs or tools
    const path = url.startsWith('/') ? url : `/${url}`;
    return `https://${DOMAIN}${path}`;
  });

  // We iterate through URLs and Engines to send direct pings
  for (const url of cleanUrls) {
    for (const host of DIRECT_ENGINES) {
      try {
        const pingUrl = `https://${host}/indexnow?url=${encodeURIComponent(url)}&key=${API_KEY}`;
        
        /**
         * 'no-cors' mode is used to bypass browser OPTIONS/CORS restrictions.
         * Status 202 in Network tab confirms the search engine accepted the URL.
         */
        await fetch(pingUrl, { 
          mode: 'no-cors',
          cache: 'no-cache',
          referrerPolicy: 'no-referrer-when-downgrade'
        });
        
        console.log(`📡 IndexNow: Direct ping sent to ${host} for ${url}`);
      } catch (err) {
        console.warn(`IndexNow: Failed to ping ${host}`, err);
      }
    }
  }
};