import { NextResponse } from 'next/server';
import { getPosts } from '../../services/db';
import { BlogPost } from '../../types';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
  // 1. Fetch dynamic data
  let dynamicPosts: BlogPost[] = [];
  try {
    dynamicPosts = await getPosts();
  } catch (error) {
    console.error('Failed to fetch posts for sitemap:', error);
  }

  const staticPages = [
    '',
    '/voting',
    '/login',
    '/signup',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
    '/disclaimer',
    '/tools/my-phone-price',
    // Add other static routes as needed
  ];

  // 2. Generate the XML string
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
      .map((url) => {
        return `
            <url>
              <loc>${BASE_URL}${url}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>daily</changefreq>
              <priority>0.8</priority>
            </url>
          `;
      })
      .join('')}
      
      ${dynamicPosts
      .map((post) => {
        return `
            <url>
              <loc>${BASE_URL}/${post.slug}</loc>
              <lastmod>${post.updatedAt || new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.7</priority>
            </url>
          `;
      })
      .join('')}
    </urlset>
  `;

  // 3. Return the response with the correct XML header
  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      // Cache-Control ensures search engines check back frequently
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}
