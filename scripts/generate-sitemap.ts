// scripts/generate-sitemap.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBfCLdEs3srUp-Gt7ctNiGFX5czdxDizu4',
  authDomain: 'lumina-blog-c92d8.firebaseapp.com',
  projectId: 'lumina-blog-c92d8',
  storageBucket: 'lumina-blog-c92d8.firebasestorage.app',
  messagingSenderId: '888597428624',
  appId: '1:888597428624:web:ef11dbf874be54ba5bdb15',
  measurementId: 'G-XG73Y1PC2X',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const DOMAIN = 'https://bigyann.com.np'; // ← CHANGE THIS LATER

async function generate() {
  try {
    const snapshot = await db.collection('posts').where('status', '==', 'published').get();

    let entries = `
  <url><loc>${DOMAIN}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>${DOMAIN}/about</loc><priority>0.8</priority></url>
  <url><loc>${DOMAIN}/contact</loc><priority>0.8</priority></url>`;

    snapshot.forEach((doc) => {
      const data: any = doc.data();
      const slug = data.slug || doc.id;

      // Safe date handling — works with Timestamp OR plain string/number
      let dateStr = new Date().toISOString().split('T')[0]; // fallback = today

      if (data.updatedAt) {
        if (typeof data.updatedAt.toDate === 'function') {
          dateStr = data.updatedAt.toDate().toISOString().split('T')[0];
        } else if (data.updatedAt.seconds) {
          dateStr = new Date(data.updatedAt.seconds * 1000).toISOString().split('T')[0];
        }
      } else if (data.createdAt) {
        if (typeof data.createdAt.toDate === 'function') {
          dateStr = data.createdAt.toDate().toISOString().split('T')[0];
        } else if (data.createdAt.seconds) {
          dateStr = new Date(data.createdAt.seconds * 1000).toISOString().split('T')[0];
        }
      }

      entries += `
  <url>
    <loc>${DOMAIN}/blog/${slug}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`;

    const outPath = path.join(process.cwd(), 'dist', 'sitemap.xml');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, xml.trim() + '\n');

    console.log(`Sitemap generated! → ${outPath} (${snapshot.size} posts)`);
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    process.exit(1);
  }
}

generate();