import { NextResponse } from 'next/server';
export const runtime = 'edge';
import { parseM3U } from '../../../lib/m3uParser';

export async function GET() {
    try {
        // Try fetching from the external URL first
        const externalUrl = 'https://iptv-org.github.io/iptv/index.m3u';
        let content = '';

        const response = await fetch(externalUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
        if (response.ok) {
            content = await response.text();
        }

        if (!content) {
            return NextResponse.json({ error: 'Failed to fetch IPTV playlist' }, { status: 502 });
        }

        const channels = parseM3U(content);

        return NextResponse.json(channels);
    } catch (error) {
        console.error('Failed to parse IPTV playlist:', error);
        return NextResponse.json({ error: 'Failed to parse IPTV playlist' }, { status: 500 });
    }
}
