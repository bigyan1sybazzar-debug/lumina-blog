import { NextResponse } from 'next/server';
import { getR2Polls } from '../../services/r2-data';

import { Poll } from '../../types';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
  let polls: Poll[] = [];
  try {
    polls = await getR2Polls();
  } catch (error) {
    console.error('Failed to fetch polls for sitemap:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${polls.map(poll => `
        <url>
          <loc>${BASE_URL}/voting/${poll.slug}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.6</priority>
        </url>
      `).join('')}
    </urlset>
  `;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
