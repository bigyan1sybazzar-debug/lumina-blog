import { storage } from '../../../lib/storage';
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { dbLite } from '../../../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore/lite';

const FILE_NAME = 'live-data.json';
const COLLECTION_NAME = 'live_links';

export async function GET() {
    try {
        // 1. Try to fetch from Storage
        let blobData = null;
        try {
            const { blobs } = await storage.list({ prefix: FILE_NAME, limit: 1 });
            const blob = blobs.find(b => b.pathname === FILE_NAME);

            if (blob) {
                const res = await fetch(blob.url, { next: { revalidate: 10 } });
                if (res.ok) {
                    blobData = await res.json();
                }
            }
        } catch (blobError) {
            console.warn('Storage fetch failed (migrating/fallback):', blobError);
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
        console.log('Migrating Live Sports data from Firestore to Storage...');
        const q = query(
            collection(dbLite, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // 3. Save to Storage
        try {
            await storage.put(FILE_NAME, JSON.stringify(data), {
                access: 'public',
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
        } catch (putError) {
            console.warn('Failed to save to Storage:', putError);
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
        await storage.put(FILE_NAME, JSON.stringify(data), {
            access: 'public',
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving Live Sports data:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
