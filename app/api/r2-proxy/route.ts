import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching this route

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev';
    const url = `${R2_DOMAIN}/${file}`;

    try {
        const res = await fetch(url, { cache: 'no-store' }); // Get fresh data from R2 without caching on Next.js server side
        if (!res.ok) {
            return NextResponse.json({ error: `Failed to fetch ${file} from R2` }, { status: res.status });
        }

        const data = await res.json();

        // Explicitly tell browsers (including Brave) to NEVER cache this response
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store',
            },
        });
    } catch (error: any) {
        console.error(`Proxy error for ${file}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
