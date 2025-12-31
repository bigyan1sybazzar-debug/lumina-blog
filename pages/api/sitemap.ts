// api/sitemap.ts
import { put } from '@vercel/blob';
import admin from 'firebase-admin';
import { writeFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const auth = req.headers.authorization || '';
  const SITEMAP_SECRET = process.env.SITEMAP_SECRET || 'bigyann-2025-super-secret-987654321';
  if (auth !== `Bearer ${SITEMAP_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const db = admin.firestore();
    const BASE_URL = 'https://bigyann.com.np';
    const BLOB_URL = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

    // Fetch published posts
    const snapshot = await db.collection('posts').where('status', '==', 'published').get();
    const posts = snapshot.docs.map(doc => {
      const d = doc.data();
      const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
      return {
        slug: (d.slug as string) || doc.id,
        updatedAt: date.toISOString(),
      };
    });

    // Fetch approved polls
    const pollsSnapshot = await db.collection('polls').where('status', '==', 'approved').get();
    const polls = pollsSnapshot.docs.map(doc => {
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
  <url><loc>${BASE_URL}/voting</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  ${posts.map(p => `
  <url>
    <loc>${BASE_URL}/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.8</priority>
  </url>`).join('')}
  ${polls.map(p => `
  <url>
    <loc>${BASE_URL}/voting/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.7</priority>
  </url>`).join('')}
</urlset>`.trim();

    // 1. Upload to Vercel Blob (always works)
    await put('sitemap.xml', xml, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/xml',
      allowOverwrite: true,
    });

    // 2. Try to save to public/sitemap.xml (only works locally or during build)
    let publicSaved = false;
    let publicMessage = '';

    try {
      const publicPath = join(process.cwd(), 'public', 'sitemap.xml');
      writeFileSync(publicPath, xml, 'utf-8');
      publicSaved = true;
      publicMessage = 'Sitemap saved to public/sitemap.xml (visible at /sitemap.xml)';
      console.log('public/sitemap.xml updated successfully');
    } catch (writeError) {
      publicSaved = false;
      publicMessage = 'Warning: Could not write to public/sitemap.xml (normal on Vercel serverless — will update on next deploy)';
      console.warn('Warning: Local write failed (expected on Vercel):', writeError);
    }

    // Final success response with clear status
    res.status(200).json({
      success: true,
      posts: posts.length,
      totalUrls: posts.length + 1,
      blobUrl: BLOB_URL,
      publicUrl: `${BASE_URL}/sitemap.xml`,
      localSaveStatus: publicSaved ? 'Success: Saved to public folder' : 'Warning: Not saved locally (Vercel serverless)',
      message: publicSaved
        ? 'Sitemap fully updated — ready for Google!'
        : 'Sitemap updated on Blob — public version updates on next deploy',
      tip: publicSaved
        ? 'Visit http://localhost:5173/sitemap.xml to see it now!'
        : 'Deploy to see latest at bigyann.com.np/sitemap.xml',
    });

  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate sitemap',
    });
  }
}