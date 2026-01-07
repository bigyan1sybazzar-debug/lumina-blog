import { NextResponse } from 'next/server';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
    const staticPages = [
        '',
        '/voting',
        '/categories',
        '/login',
        '/signup',
        '/about',
        '/contact',
        '/privacy-policy',
        '/terms-of-service',
        '/disclaimer',
        '/tools/my-phone-price',
        '/tools/ai-translator',
        '/tools/emi-calculator',
        '/tools/exchange-offer',
        '/tools/resume-checker',
        '/tools/temp-mail',
        '/tools/video-downloader',
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages.map(url => `
        <url>
          <loc>${BASE_URL}${url}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>
  `;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
