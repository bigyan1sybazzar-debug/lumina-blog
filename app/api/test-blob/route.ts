import { put } from '@vercel/blob';
export const runtime = 'edge';
import { NextResponse } from 'next/server';
export async function GET() {
    let token = process.env.BLOB_READ_WRITE_TOKEN;
    let source = 'process.env';

    if (!token) {
        return NextResponse.json({ error: 'Token not found anywhere' });
    }

    if (!token) {
        return NextResponse.json({ error: 'Token not found anywhere' });
    }

    try {
        const testFile = 'test-connection.txt';
        const result = await put(testFile, 'Connection healthy at ' + new Date().toISOString(), {
            access: 'public',
            token: token
        });
        return NextResponse.json({
            success: true,
            url: result.url,
            tokenSource: source,
            tokenPrefix: token.substring(0, 10) + '...'
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Blob put failed',
            details: error.message,
            tokenSource: source,
            tokenPrefix: token.substring(0, 10) + '...'
        }, { status: 500 });
    }
}
