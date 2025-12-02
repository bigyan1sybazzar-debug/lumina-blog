// scripts/generate-sitemap.js
import { writeFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Safety: if no credentials → just write static sitemap (won't crash)
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

let urls = '';

if (serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const db = getFirestore();
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'published')
      .get();

    snapshot.forEach(doc => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const lastmod = (data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date())
        .toISOString()
        .split('T')[0];

      urls += `  <url>
    <loc>https://bigyann.com.np/blog/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    console.log(`Generated sitemap with ${snapshot.size} published posts`);
  } catch (e) {
    console.error('Firebase failed, using static sitemap only:', e.message);
  }
} else {
  console.log('No FIREBASE_SERVICE_ACCOUNT → static sitemap only');
}

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
console.log('public/sitemap.xml written');