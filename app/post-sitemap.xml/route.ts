import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { getPosts } from '../../services/db';

import { BlogPost } from '../../types';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
  let posts: BlogPost[] = [];
  try {
    posts = await getPosts();
  } catch (error) {
    console.error('Failed to fetch posts for sitemap:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${posts.map(post => `
        <url>
          <loc>${BASE_URL}/${post.slug}</loc>
          <lastmod>${post.updatedAt || new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>
  `;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
