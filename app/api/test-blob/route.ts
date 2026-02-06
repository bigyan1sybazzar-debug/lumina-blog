import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    let token = process.env.BLOB_READ_WRITE_TOKEN;
    let source = 'process.env';

    if (!token) {
        try {
            const envPath = path.join(process.cwd(), '.env.local');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/BLOB_READ_WRITE_TOKEN=["']?([^"'\s]+)["']?/);
                if (match && match[1]) {
                    token = match[1].replace(/['"]/g, '');
                    source = '.env.local file';
                }
            }
        } catch (e) {
            return NextResponse.json({ error: 'Failed to read .env.local', details: String(e) });
        }
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
