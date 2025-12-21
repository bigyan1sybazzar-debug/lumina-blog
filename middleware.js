// middleware.js

const BOT_USER_AGENTS = [
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'applebot',
    'pinterestbot',
    'slackbot',
    'discordbot'
  ];
  
  const PRERENDER_TOKEN = 'FcJ1kiMI1PSv81rjC8z9';  // Your token here
  
  export const config = {
    matcher: '/:path*',  // Apply to all routes
  };
  
  export default async function middleware(request) {
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot));
  
    if (isBot) {
      const url = request.url;
      const prerenderUrl = `https://service.prerender.io/https://bigyann.com.np${new URL(url).pathname}${new URL(url).search}`;
  
      const prerenderRequest = new Request(prerenderUrl, {
        headers: {
          'X-Prerender-Token': PRERENDER_TOKEN,
          'User-Agent': userAgent,
        },
      });
  
      return fetch(prerenderRequest);
    }
  
    // Normal users: continue to your React SPA
    return;
  }