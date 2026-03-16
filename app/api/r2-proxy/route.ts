import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return NextResponse.json({ error: 'File parameter is required' }, { status: 400 });
    }

    const R2_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev';
    const url = `${R2_DOMAIN}/${file}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json({ error: `R2 returned ${res.status} for ${file}` }, { status: res.status });
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.error(`R2 response for ${file} is not JSON:`, text.substring(0, 100));
            return NextResponse.json({ error: 'R2 response is not valid JSON' }, { status: 502 });
        }

        try {
            const data = await res.json();
            return NextResponse.json(data);
        } catch (jsonError: any) {
            console.error(`Failed to parse JSON for ${file}:`, jsonError);
            return NextResponse.json({ error: 'Failed to parse JSON from R2' }, { status: 502 });
        }
    } catch (error: any) {
        console.error(`Proxy network error for ${file}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
