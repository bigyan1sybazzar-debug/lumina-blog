import { storage } from '@/lib/storage';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    // Check Authorization
    const authHeader = req.headers.get('authorization');
    const SYNC_SECRET = process.env.SITEMAP_SECRET || 'bigyann-2025-super-secret-987654321';

    if (authHeader !== `Bearer ${SYNC_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const BASE_URL = 'https://bigyann.com.np';
        const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev';

        // 1. Fetch ALL Data from R2 (Directly, no Firestore)
        const fetchR2 = async (file: string) => {
            try {
                const res = await fetch(`${R2_DOMAIN}/${file}`, { cache: 'no-store' });
                if (!res.ok) return [];
                return await res.json();
            } catch (e) {
                return [];
            }
        };

        const [posts, polls] = await Promise.all([
            fetchR2('posts.json'),
            fetchR2('polls.json')
        ]);

        // 2. Generate and Upload Sitemap
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE_URL}/voting</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  ${posts.map((p: any) => `
  <url>
    <loc>${BASE_URL}/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.8</priority>
  </url>`).join('')}
  ${polls.map((p: any) => `
  <url>
    <loc>${BASE_URL}/voting/${p.slug}</loc>
    <lastmod>${(p.updatedAt || p.createdAt || new Date().toISOString()).split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq><priority>0.7</priority>
  </url>`).join('')}
</urlset>`.trim();

        await storage.put('sitemap.xml', xml, { access: 'public', contentType: 'application/xml', addRandomSuffix: false });

        // 3. Revalidate
        revalidatePath('/sitemap.xml');
        revalidatePath('/');

        return NextResponse.json({
            success: true,
            message: 'Generated sitemap from R2 data. No Firestore used.',
            stats: {
                posts: posts.length,
                polls: polls.length
            }
        });

    } catch (error: any) {
        console.error('Sitemap generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
