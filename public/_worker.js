import playwright from '@cloudflare/playwright';

const BOT_UA = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'applebot', 'pinterest', 'slackbot', 'discordbot', 'mediapartners-google'
];

function isBot(ua = '') {
  return BOT_UA.some(bot => ua.toLowerCase().includes(bot));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';

    // WWW → non-www redirect
    if (url.hostname === 'www.bigyann.com.np') {
      url.hostname = 'bigyann.com.np';
      return Response.redirect(url.toString(), 301);
    }

    const isBotRequest = isBot(userAgent);

    // Normal users: serve fast SPA
    if (!isBotRequest) {
      return env.ASSETS.fetch(request);
    }

    // Bots: full render with longer wait for Helmet
    let browser;
    try {
      browser = await playwright.chromium.launch(env.BROWSER);
      const page = await browser.newPage();
      await page.goto(request.url, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.waitForTimeout(10000); // 10 seconds for React + Helmet to fully inject tags

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