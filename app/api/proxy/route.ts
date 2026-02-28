import { NextRequest, NextResponse } from 'next/server';

// export const runtime = 'edge'; // Use Node.js runtime for better streaming stability on live sites

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
    // Optional: original referrer origin passed from rewritten playlist URLs
    const refOverride = searchParams.get('ref');

    if (!targetUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const trimmedUrl = targetUrl.trim();

    try {
        const urlObj = new URL(trimmedUrl);

        // Use the override referer if provided (e.g., when a sub-CDN needs
        // the original embedding site's origin, not its own origin)
        const effectiveOrigin = refOverride || urlObj.origin;

        const incomingUserAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        const fetchHeaders: Record<string, string> = {
            'User-Agent': incomingUserAgent,
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'identity', // Disable compression to prevent streaming issues
            'Origin': effectiveOrigin,
            'Referer': effectiveOrigin + '/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Connection': 'keep-alive',
        };

        const rangeHeader = request.headers.get('range');
        if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

        const response = await fetch(trimmedUrl, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            return new NextResponse(`Stream provider returned ${response.status}`, {
                status: response.status,
                headers: CORS_HEADERS
            });
        }

        const isPlaylist = trimmedUrl.includes('.m3u8');
        const responseHeaders = new Headers(CORS_HEADERS);

        // Forward essential headers
        const headersToForward = [
            'Content-Type',
            'Content-Length',
            'Accept-Ranges',
            'Content-Range',
        ];

        headersToForward.forEach(h => {
            const val = response.headers.get(h);
            if (val) responseHeaders.set(h, val);
        });

        if (isPlaylist) {
            const text = await response.text();

            // Pass the effective origin (the original embedding site, e.g. live.inplyr.com)
            // through all rewritten sub-URLs so sub-CDNs receive the correct Referer header.
            const getProxiedUrl = (url: string) => {
                try {
                    const absoluteUrl = new URL(url, trimmedUrl).href;
                    const proxyUrl = `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                    // If the sub-resource is on a different domain, carry the referer override
                    const subDomain = new URL(absoluteUrl).origin;
                    if (subDomain !== effectiveOrigin) {
                        return `${proxyUrl}&ref=${encodeURIComponent(effectiveOrigin)}`;
                    }
                    return proxyUrl;
                } catch {
                    return url;
                }
            };

            const rewrittenText = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                // Handle ANY tag with a URI="..." attribute (Keys, Maps, Playlists, etc.)
                if (trimmed.includes('URI=')) {
                    return line.replace(/URI=["']?([^"']+)["']?/, (match, uri) => {
                        const quote = match.includes('"') ? '"' : match.includes("'") ? "'" : '';
                        return `URI=${quote}${getProxiedUrl(uri)}${quote}`;
                    });
                }

                // Handle segment URLs or sub-playlist URLs (lines that don't start with #)
                if (trimmed.startsWith('#')) return line;
                return getProxiedUrl(trimmed);
            }).join('\n');

            responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
            responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            return new NextResponse(rewrittenText, { status: 200, headers: responseHeaders });
        }

        // For segments (.ts, .m4s, .mp4, or known binary types)
        const isSegment = trimmedUrl.includes('.ts') ||
            trimmedUrl.includes('.m4s') ||
            trimmedUrl.includes('.mp4') ||
            request.headers.get('accept')?.includes('video/') ||
            (!isPlaylist && !trimmedUrl.includes('.key') && !trimmedUrl.includes('.m3u'));

        if (isSegment) {
            // Prioritize original Content-Type if it's relevant, otherwise fallback
            const originalType = response.headers.get('Content-Type');
            if (!originalType || originalType.includes('application/octet-stream') || originalType.includes('text/plain')) {
                const contentType = trimmedUrl.includes('.m4s') ? 'video/iso.segment' : 'video/mp2t';
                responseHeaders.set('Content-Type', contentType);
            }
            // Cache segments for 1 hour — crucial for smooth playback once buffered
            responseHeaders.set('Cache-Control', 'public, max-age=3600');
        }

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });

    } catch (error: any) {
        return new NextResponse(`Proxy error: ${error.message}`, { status: 502, headers: CORS_HEADERS });
    }
}
