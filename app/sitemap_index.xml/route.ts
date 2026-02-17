import { NextResponse } from 'next/server';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
    const sitemaps = [
        'post-sitemap.xml',
        'page-sitemap.xml',
        'category-sitemap.xml',
        'poll-sitemap.xml',
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps.map(file => `
        <sitemap>
          <loc>${BASE_URL}/${file}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
        </sitemap>
      `).join('')}
    </sitemapindex>
  `;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}
