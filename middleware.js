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
  matcher: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  // ^ This skips middleware for static files, robots.txt, sitemap.xml, etc.
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Extra safety: skip if it's robots.txt or sitemap.xml
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return; // Let Vercel serve the static file directly
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot));

  if (isBot) {
    const prerenderUrl = `https://service.prerender.io/https://bigyann.com.np${pathname}${url.search}`;

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