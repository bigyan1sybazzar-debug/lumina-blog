import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }

        // Checking token existence without exposing it
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        console.log('--- Upload Request ---');
        console.log('Filename:', filename);
        console.log('Token defined:', !!token);

        if (!token) {
            return NextResponse.json({
                error: 'Configuration Error',
                details: 'BLOB_READ_WRITE_TOKEN is missing in environment variables.'
            }, { status: 500 });
        }

        // Use the put function from @vercel/blob
        const blob = await put(filename, request.body!, {
            access: 'public',
            token: token, // Explicitly pass the token to be sure
        });

        console.log('Upload successful:', blob.url);
        return NextResponse.json(blob);

    } catch (error: any) {
        console.error('Fatal Upload Error:', error);
        return NextResponse.json({
            error: 'Upload Failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
