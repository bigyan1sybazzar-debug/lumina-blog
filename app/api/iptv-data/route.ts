import { storage } from '../../../lib/storage';
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { dbLite } from '../../../services/firebase';
import { collection, getDocs } from 'firebase/firestore/lite';

const FILE_NAME = 'iptv-data.json';
const COLLECTION_NAME = 'iptv_channels';

// Helper to get token
function getBlobToken() {
    return process.env.BLOB_READ_WRITE_TOKEN;
}

export async function GET() {
    console.log('GET IPTV data request');
    const token = getBlobToken();
    try {
        let blobData = null;
        // Try storage (Blob or R2)
        try {
            const { blobs } = await storage.list({
                prefix: FILE_NAME,
                limit: 1,
                token: token
            });
            const blob = blobs.find(b => b.pathname === FILE_NAME);

            if (blob) {
                const res = await fetch(blob.url, { next: { revalidate: 10 } });
                if (res.ok) {
                    blobData = await res.json();
                }
            }
        } catch (blobError: any) {
            console.warn('Storage list/fetch stage failed:', blobError.message);
        }

        if (blobData) {
            return NextResponse.json(blobData, {
                headers: {
                    'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
                    'CDN-Cache-Control': 's-maxage=10'
                }
            });
        }

        // Fallback to Firestore (Modular / Lite)
        const snapshot = await getDocs(collection(dbLite, COLLECTION_NAME));
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Migration attempt
        if (data.length > 0) {
            try {
                await storage.put(FILE_NAME, JSON.stringify(data), {
                    access: 'public',
                    addRandomSuffix: false,
                    token: token
                });
                console.log('Migrated data to Storage during GET');
            } catch (putError: any) {
                console.warn('Auto-migration to Storage failed:', putError.message);
            }
        }

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
                'CDN-Cache-Control': 's-maxage=10'
            }
        });
    } catch (error: any) {
        console.error('IPTV GET handler catastrophic failure:', error);
        return NextResponse.json({
            error: 'Failed to fetch data',
            details: error.message,
            stack: error.stack
        }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
}

export async function POST(request: Request) {
    console.log('POST IPTV data request received');
    const token = getBlobToken();

    let body;
    try {
        body = await request.json();
        console.log(`Parsed body, size: ${JSON.stringify(body).length} characters`);
    } catch (parseError: any) {
        console.error('JSON Parse failure:', parseError);
        return NextResponse.json({ error: 'Invalid JSON', details: parseError.message }, { status: 400 });
    }

    try {
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Data is not an array' }, { status: 400 });
        }

        // Check token only if using Vercel Blob (adapter handles this, but here we can check explicitly if needed)
        // For simplicity, we pass token to adapter, it ignores it if R2 is used.
        // But if R2 is NOT used, and token is missing, we should error.
        if (!storage.isR2Configured() && !token) {
            console.error('CRITICAL: BLOB_READ_WRITE_TOKEN not found');
            return NextResponse.json({
                error: 'Configuration error',
                details: 'BLOB_READ_WRITE_TOKEN is missing. Please check .env.local and RESTART the server process.'
            }, { status: 500 });
        }

        console.log(`Attempting to upload ${body.length} items to Storage...`);

        const result = await storage.put(FILE_NAME, JSON.stringify(body), {
            access: 'public',
            addRandomSuffix: false,
            token: token
        });

        console.log('Vercel Blob upload successful:', result.url);
        return NextResponse.json({ success: true, url: result.url });
    } catch (error: any) {
        console.error('IPTV POST upload catastrophic failure:', error);
        return NextResponse.json({
            error: 'Blob upload failed',
            details: error.message,
            tokenFound: !!token,
            bodyPreview: Array.isArray(body) ? `${body.length} items` : 'not an array'
        }, { status: 500 });
    }
}
