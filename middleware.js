import { NextResponse } from 'next/server';

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

const PRERENDER_TOKEN = 'FcJ1kiMI1PSv81rjC8z9';

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};

export default async function middleware(request) {
  const { pathname, search } = new URL(request.url);

  // ✅ HARD BYPASS — sitemap & robots
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some(bot =>
    userAgent.toLowerCase().includes(bot)
  );

  if (isBot) {
    try {
      const prerenderUrl = `https://service.prerender.io/https://bigyann.com.np${pathname}${search}`;

      return await fetch(prerenderUrl, {
        headers: {
          'X-Prerender-Token': PRERENDER_TOKEN,
          'User-Agent': userAgent,
        },
      });
    } catch (e) {
      // ✅ If prerender fails, NEVER break crawl
      return NextResponse.next();
    }
  }

  // ✅ Always explicitly continue
  return NextResponse.next();
}
