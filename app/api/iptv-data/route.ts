import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { db } from '../../../services/firebase';
import fs from 'fs';
import path from 'path';

const FILE_NAME = 'iptv-data.json';
const COLLECTION_NAME = 'iptv_channels';

// Helper to get token if process.env is missing it (hack for dev mode without restart)
function getBlobToken() {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('Token found in process.env');
        return process.env.BLOB_READ_WRITE_TOKEN;
    }

    try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            // Improved regex for token extraction
            const match = envContent.match(/BLOB_READ_WRITE_TOKEN=["']?([^"'\s]+)["']?/);
            if (match && match[1]) {
                const token = match[1].replace(/['"]/g, ''); // Clean any lingering quotes
                console.log('Token successfully matched from .env.local file');
                return token;
            }
        }
    } catch (e) {
        console.error('Manual .env.local read failed:', e);
    }
    return undefined;
}

export async function GET() {
    console.log('GET IPTV data request');
    const token = getBlobToken();
    try {
        let blobData = null;
        if (token) {
            try {
                const { blobs } = await list({
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
                console.warn('Blob list/fetch stage failed:', blobError.message);
            }
        }

        if (blobData) {
            return NextResponse.json(blobData, {
                headers: {
                    'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
                    'CDN-Cache-Control': 's-maxage=10'
                }
            });
        }

        // Fallback to Firestore
        const snapshot = await db.collection(COLLECTION_NAME).get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Migration attempt
        if (token && data.length > 0) {
            try {
                await put(FILE_NAME, JSON.stringify(data), {
                    access: 'public',
                    addRandomSuffix: false,
                    token: token
                });
                console.log('Migrated data to Blob during GET');
            } catch (putError: any) {
                console.warn('Auto-migration to Blob failed:', putError.message);
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

        if (!token) {
            console.error('CRITICAL: BLOB_READ_WRITE_TOKEN not found');
            return NextResponse.json({
                error: 'Configuration error',
                details: 'BLOB_READ_WRITE_TOKEN is missing. Please check .env.local and RESTART the server process.'
            }, { status: 500 });
        }

        console.log(`Attempting to upload ${body.length} items to Vercel Blob...`);

        const result = await put(FILE_NAME, JSON.stringify(body), {
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
