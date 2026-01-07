import { NextResponse } from 'next/server';
import { getPosts, getPolls } from '../../services/db';
import { BlogPost, Poll } from '../../types';

const BASE_URL = 'https://bigyann.com.np';

export async function GET() {
  // 1. Fetch dynamic data
  let dynamicPosts: BlogPost[] = [];
  let dynamicPolls: Poll[] = [];

  try {
    const [posts, polls] = await Promise.all([
      getPosts(),
      getPolls('all')
    ]);
    dynamicPosts = posts;
    dynamicPolls = polls;
  } catch (error) {
    console.error('Failed to fetch data for sitemap:', error);
  }

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

      ${dynamicPolls
      .map((poll) => {
        return `
            <url>
              <loc>${BASE_URL}/voting/${poll.slug}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>0.6</priority>
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
    },
  });
}
export const revalidate = 86400; // Revalidate every 24 hours, or on-demand via API
