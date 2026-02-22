import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const urlObj = new URL(targetUrl);

        // Headers to mimic a real browser request to the stream server
        const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': urlObj.origin,
            'Referer': urlObj.origin + '/',
        };

        // Forward Range header if present (needed for video seeking)
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(20000)
        });

        if (!response.ok) {
            return new NextResponse(`Stream provider returned ${response.status}`, {
                status: response.status,
                headers: CORS_HEADERS
            });
        }

        const contentType = response.headers.get('content-type') || '';

        // Detect if this is an HLS playlist by extension or content type
        const isPlaylist = targetUrl.includes('.m3u8') ||
            targetUrl.includes('.m3u') ||
            contentType.includes('mpegurl') ||
            contentType.includes('x-mpegURL') ||
            contentType.includes('vnd.apple.mpegurl');

        const responseHeaders = new Headers(CORS_HEADERS);

        if (isPlaylist) {
            // === CRITICAL FIX ===
            // Rewrite ALL URLs inside the m3u8 to go through our proxy.
            // This ensures segments, sub-playlists, and encryption keys are all
            // fetched server-side — bypassing any CORS block on the origin.
            const text = await response.text();
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

            const getProxiedUrl = (url: string) => {
                // Resolve to absolute first
                let absoluteUrl: string;
                if (url.startsWith('http')) {
                    absoluteUrl = url;
                } else if (url.startsWith('//')) {
                    absoluteUrl = urlObj.protocol + url;
                } else if (url.startsWith('/')) {
                    absoluteUrl = urlObj.origin + url;
                } else {
                    absoluteUrl = baseUrl + url;
                }
                // Then wrap in proxy
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            };

            const rewrittenText = text.split('\n').map(line => {
                const trimmedLine = line.trim();

                // Handle EXT-X-KEY URI= attribute (encryption key)
                if (trimmedLine.startsWith('#EXT-X-KEY')) {
                    return line.replace(/URI="([^"]+)"/, (_: string, uri: string) => {
                        return `URI="${getProxiedUrl(uri)}"`;
                    });
                }

                // Handle EXT-X-MAP URI= attribute (initialization segment)
                if (trimmedLine.startsWith('#EXT-X-MAP')) {
                    return line.replace(/URI="([^"]+)"/, (_: string, uri: string) => {
                        return `URI="${getProxiedUrl(uri)}"`;
                    });
                }

                // Skip other tags and empty lines
                if (!trimmedLine || trimmedLine.startsWith('#')) return line;

                // Rewrite segment / sub-playlist URLs through proxy
                return getProxiedUrl(trimmedLine);
            }).join('\n');

            responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
            responseHeaders.set('Cache-Control', 'no-cache, no-store');

            return new NextResponse(rewrittenText, {
                status: 200,
                headers: responseHeaders,
            });
        } else {
            // === PERFORMANCE FIX FOR LIVE SITE ===
            // Use streaming (body) instead of buffering (arrayBuffer).
            // This starts sending video to the user IMMEDIATELY as it arrives from the source server.
            const headersToForward = [
                'Content-Type',
                'Content-Length',
                'Content-Range',
                'Accept-Ranges',
                'Cache-Control'
            ];

            headersToForward.forEach(h => {
                const val = response.headers.get(h);
                if (val) responseHeaders.set(h, val);
            });

            // If origin didn't specify, set a default cache
            if (!responseHeaders.has('Cache-Control')) {
                responseHeaders.set('Cache-Control', 'public, max-age=60');
            }

            return new NextResponse(response.body, {
                status: response.status,
                headers: responseHeaders,
            });
        }
    } catch (error: any) {
        console.error(`Proxy Error for ${targetUrl}:`, error.message);
        return new NextResponse(`Proxy error: ${error.message}`, {
            status: 502,
            headers: CORS_HEADERS
        });
    }
}
