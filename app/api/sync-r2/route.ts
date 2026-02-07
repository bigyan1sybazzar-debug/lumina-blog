import { storage } from '@/lib/storage';
import admin from 'firebase-admin';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
}

export async function POST(req: Request) {
    // Check Authorization
    const authHeader = req.headers.get('authorization');
    const SYNC_SECRET = process.env.SITEMAP_SECRET || 'bigyann-2025-super-secret-987654321'; // Reuse secret for now

    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = admin.firestore();
        const BASE_URL = 'https://bigyann.com.np';

        // 1. Fetch ALL Data from Firestore
        const [postsSnap, pollsSnap, categoriesSnap, highlightsSnap, keywordsSnap, liveLinksSnap] = await Promise.all([
            db.collection('posts').where('status', '==', 'published').get(),
            db.collection('polls').where('status', '==', 'approved').get(),
            db.collection('categories').get(),
            db.collection('highlights').get(),
            db.collection('keywords').get(),
            db.collection('live_links').get()
        ]);

        const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const polls = pollsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const highlights = highlightsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const keywords = keywordsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const liveLinks = liveLinksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Upload JSONs to R2
        const uploadPromises = [
            storage.put('posts.json', JSON.stringify(posts), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
            storage.put('polls.json', JSON.stringify(polls), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
            storage.put('categories.json', JSON.stringify(categories), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
            storage.put('highlights.json', JSON.stringify(highlights), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
            storage.put('keywords.json', JSON.stringify(keywords), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
            storage.put('live-data.json', JSON.stringify(liveLinks), { access: 'public', contentType: 'application/json', addRandomSuffix: false }),
        ];

        // 3. Generate and Upload Sitemap (Inline logic to avoid double fetching)
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/voting</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  ${posts.map((p: any) => `
  <url>
    <loc>${BASE_URL}/${p.slug}</loc>
    <lastmod>${(p.updatedAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.8</priority>
  </url>`).join('')}
  ${polls.map((p: any) => `
  <url>
    <loc>${BASE_URL}/voting/${p.slug}</loc>
    <lastmod>${(p.updatedAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.7</priority>
  </url>`).join('')}
</urlset>`.trim();

        uploadPromises.push(
            storage.put('sitemap.xml', xml, { access: 'public', contentType: 'application/xml', addRandomSuffix: false })
        );

        await Promise.all(uploadPromises);

        // 4. Revalidate
        revalidatePath('/sitemap.xml');
        revalidatePath('/'); // Revalidate homepage

        return NextResponse.json({
            success: true,
            message: 'Synced all data to R2 and updated sitemap.',
            stats: {
                posts: posts.length,
                polls: polls.length,
                categories: categories.length
            }
        });

    } catch (error: any) {
        console.error('Sync error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
