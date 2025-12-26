import playwright from '@cloudflare/playwright';

const BOT_UA = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'applebot', 'pinterest', 'slackbot', 'discordbot'
];

function isBot(ua = '') {
  return BOT_UA.some(bot => ua.toLowerCase().includes(bot));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // WWW → non-www redirect
    if (url.hostname.startsWith('www.')) {
      url.hostname = 'bigyann.com.np';
      return Response.redirect(url.toString(), 301);
    }

    // Normal users → fast SPA
    if (!isBot(userAgent)) {
      return env.ASSETS.fetch(request);
    }

    // Bots → render full page
    let browser;
    try {
      browser = await playwright.chromium.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.goto(request.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(4000);
      const html = await page.content();
      await browser.close();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    } catch (e) {
      console.error('Render error:', e);
      if (browser) await browser.close();
      return env.ASSETS.fetch(request);
    }
  }
};