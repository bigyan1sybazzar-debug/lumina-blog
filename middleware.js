// ... existing constants ...

export default async function middleware(request) {
  const { pathname, search } = new URL(request.url);

  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some(bot =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );

  if (isBot) {
    try {
      const prerenderUrl = `https://service.prerender.io/https://bigyann.com.np${pathname}${search}`;

      const response = await fetch(prerenderUrl, {
        headers: {
          'X-Prerender-Token': PRERENDER_TOKEN,
          'User-Agent': userAgent,
        },
      });

      // ✅ FIX: Only return the prerendered page if it actually loaded
      if (response.ok) {
        return response;
      }
      
      // If Prerender returns 4xx or 5xx, fall back to normal rendering
      return NextResponse.next();
      
    } catch (e) {
      console.error('Prerender error:', e);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}