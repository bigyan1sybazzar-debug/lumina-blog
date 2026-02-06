import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const urlObj = new URL(targetUrl);

        // Headers to mimic a real browser
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': urlObj.origin,
            'Referer': urlObj.origin + '/',
        };

        const response = await fetch(targetUrl, {
            headers,
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            return new NextResponse(`Stream provider returned ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || '';
        // Detect if this is an HLS playlist by extension or content type
        const isPlaylist = targetUrl.includes('.m3u8') ||
            targetUrl.includes('.m3u') ||
            contentType.includes('mpegurl') ||
            contentType.includes('application/x-mpegURL');

        let data: any;

        if (isPlaylist) {
            // HLS playlists use relative paths for segments.
            // When we proxy, the browser resolves relative paths against OUR server.
            // We must rewrite relative URLs to be absolute to the ORIGINAL server.
            const text = await response.text();
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

            const rewrittenText = text.split('\n').map(line => {
                const trimmedLine = line.trim();
                // Skip comments/tags and empty lines
                if (!trimmedLine || trimmedLine.startsWith('#')) return line;

                // If it's already an absolute URL, leave it
                if (trimmedLine.startsWith('http')) return line;

                // If it's an absolute path from root, prepend origin
                if (trimmedLine.startsWith('/')) return urlObj.origin + trimmedLine;

                // It's a relative path, prepend base URL
                return baseUrl + trimmedLine;
            }).join('\n');

            data = Buffer.from(rewrittenText);
        } else {
            // It's a video segment or other binary data
            data = await response.arrayBuffer();
        }

        const responseHeaders = new Headers();
        if (contentType) responseHeaders.set('Content-Type', contentType);

        // Critical headers for cross-origin playback
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        responseHeaders.set('Cache-Control', 'public, max-age=30');

        return new NextResponse(data, {
            status: 200,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error(`Proxy Error for ${targetUrl}:`, error.message);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
