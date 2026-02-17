import { storage } from '@/lib/storage';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
        // Use the unified storage abstraction
        const blob = await storage.put(filename, request.body, {
            access: 'public',
            addRandomSuffix: true,
            contentType: request.headers.get('content-type') || 'application/octet-stream'
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Storage Error:", error);
        return NextResponse.json({
            error: 'Upload failed',
            details: (error as Error).message,
            storage: storage.isR2Configured() ? 'R2' : 'Vercel'
        }, { status: 500 });
    }
}

