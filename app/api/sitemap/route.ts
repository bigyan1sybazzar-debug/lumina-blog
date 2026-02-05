import { storage } from '../../../lib/storage';
export const runtime = 'edge';
import { dbLite } from '../../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore/lite';
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
        const BASE_URL = 'https://bigyann.com.np';
        // Use R2 domain or fallback to Vercel
        const BLOB_URL = storage.isR2Configured()
            ? `${process.env.R2_PUBLIC_DOMAIN || ''}/sitemap.xml`
            : 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml';

        // 1. Fetch published posts
        const postsQuery = query(collection(dbLite, 'posts'), where('status', '==', 'published'));
        const snapshot = await getDocs(postsQuery);
        const posts = snapshot.docs.map((doc: any) => {
            const d = doc.data();
            // Handle Firestore Timestamp or Date
            const date = d.updatedAt?.toDate?.() || d.createdAt?.toDate?.() || new Date();
            return {
                slug: (d.slug as string) || doc.id,
                updatedAt: date.toISOString(),
            };
        });

        // 2. Fetch approved polls
        const pollsQuery = query(collection(dbLite, 'polls'), where('status', '==', 'approved'));
        const pollsSnapshot = await getDocs(pollsQuery);
        const polls = pollsSnapshot.docs.map((doc: any) => {
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
  ${posts.map((p: any) => `
  <url>
    <loc>${BASE_URL}/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.8</priority>
  </url>`).join('')}
  ${polls.map((p: any) => `
  <url>
    <loc>${BASE_URL}/voting/${p.slug}</loc>
    <lastmod>${p.updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.7</priority>
  </url>`).join('')}
</urlset>`.trim();

        // 4. Upload to Storage
        await storage.put('sitemap.xml', xml, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'application/xml',
            allowOverwrite: true,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });

        // 5. Revalidate the dynamic sitemap route
        // This clears the Next.js cache for /sitemap.xml so the next request fetches fresh data
        revalidatePath('/sitemap.xml');

        // Return success
        return NextResponse.json({
            success: true,
            posts: posts.length,
            totalUrls: posts.length + polls.length + 2, // + static routes
            blobUrl: BLOB_URL,
            publicUrl: `${BASE_URL}/sitemap.xml`,
            message: 'Sitemap updated on Blob and cache purged for /sitemap.xml',
        });

    } catch (error: any) {
        console.error('Sitemap generation error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to generate sitemap',
        }, { status: 500 });
    }
}
