// api/update-public-sitemap.ts
// Generates a clean, SEO-optimized sitemap.xml with proper formatting

import { db } from '../services/firebase.ts';
import * as fs from 'fs';
import * as path from 'path';
import { put } from '@vercel/blob';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { Timestamp } from 'firebase/firestore'; // Assuming you have the correct firebase import structure

const BASE_URL = 'https://bigyann.com.np';

const STATIC_ROUTES = [
  '/',
  '/about',
  '/admin',
  '/categories',
  '/chatassistant',
  '/communitytopicsapp',
  '/contact',
  '/disclaimer',
  '/emicalculator',
  '/exchangeoffer',
  '/livefootball',
  '/login',
] as const;

interface Post {
  slug: string;
  updatedAt?: any;
}

// Convert any Firestore timestamp to ISO string
function toISODate(value: any): string | undefined {
  if (!value) return undefined;

  // Added check for firestore Timestamp structure
  if (value instanceof Timestamp) return new Date(value.toMillis()).toISOString(); 
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (value.seconds != null) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6).toISOString();
  }
  return undefined;
}

// Fetch all blog post slugs from Firestore
async function fetchPostSlugs(): Promise<Post[]> {
  try {
    const snapshot = await db.collection('posts').get();
    const posts: Post[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.slug === 'string' && data.slug.trim()) {
        posts.push({
          slug: data.slug,
          updatedAt: data.updatedAt,
        });
      }
    });

    return posts;
  } catch (error) {
    console.error('Failed to fetch posts for sitemap:', error);
    return [];
  }
}

// Main sitemap generation
async function generateSitemap() {
  console.log('Starting sitemap generation...');

  const smStream = new SitemapStream({
    hostname: BASE_URL,
    
  });

  // Add static routes
  STATIC_ROUTES.forEach((route) => {
    const url = route === '/' ? '/' : route.toLowerCase();
    smStream.write({
      url,
      changefreq: 'weekly',
      priority: url === '/' ? 1.0 : 0.8,
    } as any);
  });

  // Add dynamic blog posts
  const posts = await fetchPostSlugs();
  console.log(`Found ${posts.length} blog posts to index`);

  posts.forEach((post) => {
    smStream.write({
      url: `/blog/${post.slug}`,
      changefreq: 'daily',
      priority: 0.9,
      lastmod: toISODate(post.updatedAt),
    } as any);
  });

  smStream.end();

  // Generate XML string
  const xmlContent = await streamToPromise(smStream).then((data) => data.toString());

  // Save to public folder (for static hosting + local preview)
  const publicDir = path.join(process.cwd(), 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, xmlContent, 'utf-8');

  const totalUrls = STATIC_ROUTES.length + posts.length;
  console.log(`Sitemap generated successfully!`);
  console.log(`→ ${totalUrls} URLs indexed (${STATIC_ROUTES.length} static + ${posts.length} blog posts)`);
  console.log(`→ Saved: ${sitemapPath}`);

  // Upload to Vercel Blob (only in production)
  if (process.env.VERCEL) {
    try {
      const { url } = await put('sitemap.xml', xmlContent, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/xml',
        allowOverwrite: true,
      });
      console.log(`Uploaded to Vercel Blob → ${url}`);
    } catch (err: any) {
      console.warn('Vercel Blob upload failed (normal locally):', err.message);
    }
  } else {
    console.log('Local build → Vercel Blob upload skipped');
  }
}

// Run
generateSitemap()
  .then(() => console.log('Sitemap generation completed successfully!'))
  .catch((err) => {
    console.error('Sitemap generation failed:', err);
    process.exit(1);
  });