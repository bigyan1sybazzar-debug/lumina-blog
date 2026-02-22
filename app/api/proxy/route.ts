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

        const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': urlObj.origin,
            'Referer': urlObj.origin + '/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        };

        const rangeHeader = request.headers.get('range');
        if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            return new NextResponse(`Stream provider returned ${response.status}`, {
                status: response.status,
                headers: CORS_HEADERS
            });
        }

        const contentType = response.headers.get('content-type') || '';
        const isPlaylist = targetUrl.includes('.m3u8') ||
            targetUrl.includes('.m3u') ||
            contentType.includes('mpegurl') ||
            contentType.includes('x-mpegURL') ||
            contentType.includes('vnd.apple.mpegurl');

        const responseHeaders = new Headers(CORS_HEADERS);

        if (isPlaylist) {
            const text = await response.text();

            const getProxiedUrl = (url: string) => {
                let absoluteUrl: string;
                try {
                    new URL(url);
                    absoluteUrl = url;
                } catch {
                    if (url.startsWith('//')) {
                        absoluteUrl = urlObj.protocol + url;
                    } else if (url.startsWith('/')) {
                        absoluteUrl = urlObj.origin + url;
                    } else {
                        const parts = targetUrl.split('/');
                        parts.pop();
                        absoluteUrl = parts.join('/') + '/' + url;
                    }
                }
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            };

            const rewrittenText = text.split('\n').map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;

                if (trimmed.includes('URI=')) {
                    return line.replace(/URI=["']?([^"']+)["']?/, (match, uri) => {
                        const quote = match.includes('"') ? '"' : match.includes("'") ? "'" : '';
                        return `URI=${quote}${getProxiedUrl(uri)}${quote}`;
                    });
                }

                if (trimmed.startsWith('#')) return line;
                return getProxiedUrl(trimmed);
            }).join('\n');

            responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
            responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            responseHeaders.set('Pragma', 'no-cache');
            responseHeaders.set('Expires', '0');

            return new NextResponse(rewrittenText, {
                status: 200,
                headers: responseHeaders,
            });
        }

        const headersToForward = [
            'Content-Type',
            'Content-Length',
            'Accept-Ranges',
            'Content-Range',
            'Cache-Control'
        ];

        headersToForward.forEach(h => {
            const val = response.headers.get(h);
            if (val) responseHeaders.set(h, val);
        });

        if (!targetUrl.includes('.m3u8')) {
            responseHeaders.set('Cache-Control', 'public, max-age=60');
        }

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error(`Proxy Error for ${targetUrl}:`, error.message);
        return new NextResponse(`Proxy error: ${error.message}`, {
            status: 502,
            headers: CORS_HEADERS
        });
    }
}
