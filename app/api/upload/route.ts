import { put } from '@vercel/blob';
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
        const blob = await put(filename, request.body, {
            access: 'public',
            addRandomSuffix: true, // Prevent filename conflicts
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error("Vercel Blob Error:", error);
        return NextResponse.json({ error: 'Upload failed', details: (error as Error).message }, { status: 500 });
    }
}
