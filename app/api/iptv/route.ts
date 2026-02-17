import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parseM3U } from '../../../lib/m3uParser';

export async function GET() {
    try {
        // Try fetching from the external URL first
        const externalUrl = 'https://iptv-org.github.io/iptv/index.m3u';
        let content = '';

        try {
            const response = await fetch(externalUrl, { next: { revalidate: 3600 } }); // Cache for 1 hour
            if (response.ok) {
                content = await response.text();
            }
        } catch (err) {
            console.warn('Failed to fetch remote IPTV playlist, falling back to local file:', err);
        }

        // If remote fetch failed or returned empty, use local file
        if (!content) {
            const filePath = path.join(process.cwd(), 'IPTV-master', 'playlist.m3u8');
            content = await fs.readFile(filePath, 'utf-8');
        }

        const channels = parseM3U(content);

        return NextResponse.json(channels);
    } catch (error) {
        console.error('Failed to parse IPTV playlist:', error);
        return NextResponse.json({ error: 'Failed to parse IPTV playlist' }, { status: 500 });
    }
}
