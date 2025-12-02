// scripts/generate-sitemap.js
import { writeFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load service account from env (set in Vercel)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!getApps().length && Object.keys(serviceAccount).length > 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function generate() {
  try {
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .get();

    let urls = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lastmod = (data.updatedAt || data.createdAt || new Date()).toISOString().split('T')[0];
      urls += `  <url>
    <loc>https://bigyann.com.np/blog/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bigyann.com.np/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bigyann.com.np/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://bigyann.com.np/categories</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${urls}</urlset>`;

    writeFileSync('public/sitemap.xml', sitemap.trim() + '\n');
    console.log(`Sitemap generated with ${snapshot.size} posts`);
  } catch (error) {
    console.error('Sitemap error:', error);
    // Keep old sitemap if fails
  }
}

generate();