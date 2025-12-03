// api/sitemap.ts
import { put } from '@vercel/blob';
import admin from 'firebase-admin';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle preflight
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
    // Initialize Firebase Admin (using full service account JSON)
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const db = admin.firestore();
    const BASE_URL = 'https://bigyann.com.np';
    const SITEMAP_URL = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

    // Fetch all published posts
    const snapshot = await db.collection('posts')
      .where('status', '==', 'published')
      .get();

    const posts = snapshot.docs.map(doc => {
      const d = doc.data();
      const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
      return {
        slug: (d.slug as string) || doc.id,
        updatedAt: date.toISOString(),
      };
    });

    // Generate XML
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

    // Upload + OVERWRITE the existing file (this fixes the error)
    await put('sitemap.xml', xml, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/xml',
      allowOverwrite: true,  // THIS LINE FIXES THE "blob already exists" ERROR
    });

    // Success!
    res.status(200).json({
      success: true,
      posts: posts.length,
      url: SITEMAP_URL,
      message: 'Sitemap updated successfully!',
    });

  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}