// api/sitemap.ts
import { put } from '@vercel/blob';
import admin from 'firebase-admin';

export default async function handler(req: any, res: any) {
  // CORS — THIS FIXES THE ERROR
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle preflight (OPTIONS) — THIS IS THE MISSING PIECE
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.SITEMAP_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
    }

    const db = admin.firestore();
    const BASE_URL = 'https://bigyann.com.np';
    const SITEMAP_URL = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

    const snapshot = await db.collection('posts').where('status', '==', 'published').get();

    const posts = snapshot.docs.map(doc => {
      const d = doc.data();
      const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
      return { slug: (d.slug as string) || doc.id, updatedAt: date.toISOString() };
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  ${posts.map(p => `
  <url>
    <loc>${BASE_URL}/blog/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.7</priority>
  </url>`).join('')}
</urlset>`.trim();

    await put('sitemap.xml', xml, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/xml',
    });

    res.status(200).json({ success: true, posts: posts.length, url: SITEMAP_URL });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}