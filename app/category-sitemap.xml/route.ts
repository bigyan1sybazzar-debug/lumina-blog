import { NextResponse } from 'next/server';
import { getR2Categories } from '../../services/r2-data';

import { Category } from '../../types';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
  let categories: Category[] = [];
  try {
    categories = await getR2Categories();
  } catch (error) {
    console.error('Failed to fetch categories for sitemap:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${categories.map(cat => `
        <url>
          <loc>${BASE_URL}/categories/${cat.id}</loc>
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
