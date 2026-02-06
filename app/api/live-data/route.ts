import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { db } from '../../../services/firebase';

const FILE_NAME = 'live-data.json';
const COLLECTION_NAME = 'live_links';

export async function GET() {
    try {
        // 1. Try to fetch from Blob
        let blobData = null;
        try {
            const { blobs } = await list({ prefix: FILE_NAME, limit: 1 });
            const blob = blobs.find(b => b.pathname === FILE_NAME);

            if (blob) {
                const res = await fetch(blob.url, { next: { revalidate: 10 } });
                if (res.ok) {
                    blobData = await res.json();
                }
            }
        } catch (blobError) {
            console.warn('Vercel Blob fetch failed (migrating/fallback):', blobError);
        }

        if (blobData) {
            return NextResponse.json(blobData, {
                headers: {
                    'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
                    'CDN-Cache-Control': 's-maxage=10'
                }
            });
        }

        // 2. Migration: Fetch from Firestore
        console.log('Migrating Live Sports data from Firestore to Blob...');
        const snapshot = await db.collection(COLLECTION_NAME).orderBy('createdAt', 'desc').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Save to Blob
        try {
            await put(FILE_NAME, JSON.stringify(data), { access: 'public', addRandomSuffix: false });
        } catch (putError) {
            console.warn('Failed to save to Vercel Blob:', putError);
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
                'CDN-Cache-Control': 's-maxage=10'
            }
        });
    } catch (error) {
        console.error('Error in Live Data API (returning empty):', error);
        // Return empty array to prevent client crash
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        // Allow full overwrite
        await put(FILE_NAME, JSON.stringify(data), { access: 'public', addRandomSuffix: false });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving Live Sports data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
