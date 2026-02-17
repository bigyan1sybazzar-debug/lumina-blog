import { storage } from '@/lib/storage';
import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    // Check Authorization
    const authHeader = req.headers.get('authorization');
    const SITEMAP_SECRET = process.env.SITEMAP_SECRET || 'bigyann-2025-super-secret-987654321';

    if (authHeader !== `Bearer ${SITEMAP_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            // Ensure FIREBASE_SERVICE_ACCOUNT is defined
            if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
            }

            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }

        const db = admin.firestore();
        const BASE_URL = 'https://bigyann.com.np';
        const BLOB_URL = 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

        // 1. Fetch published posts
        const snapshot = await db.collection('posts').where('status', '==', 'published').get();
        const posts = snapshot.docs.map(doc => {
            const d = doc.data();
            // Handle Firestore Timestamp or Date
            const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
            return {
                slug: (d.slug as string) || doc.id,
                updatedAt: date.toISOString(),
            };
        });

        // 2. Fetch approved polls
        const pollsSnapshot = await db.collection('polls').where('status', '==', 'approved').get();
        const polls = pollsSnapshot.docs.map(doc => {
            const d = doc.data();
            const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
            return {
                slug: (d.slug as string) || doc.id,
                updatedAt: date.toISOString(),
            };
        });

        // 3. Generate XML string
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

        // 4. Upload to Storage
        const result = await storage.put('sitemap.xml', xml, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'application/xml',
            allowOverwrite: true,
        });

        // 5. Revalidate the dynamic sitemap route
        // This clears the Next.js cache for /sitemap.xml so the next request fetches fresh data
        revalidatePath('/sitemap.xml');

        // Return success
        return NextResponse.json({
            success: true,
            posts: posts.length,
            totalUrls: posts.length + polls.length + 2, // + static routes
            blobUrl: result.url,
            publicUrl: `${BASE_URL}/sitemap.xml`,
            message: 'Sitemap updated in storage and cache purged for /sitemap.xml',
        });

    } catch (error: any) {
        console.error('Sitemap generation error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate sitemap',
        }, { status: 500 });
    }
}
