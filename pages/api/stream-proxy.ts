import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Stream Proxy API
 * This endpoint proxies HTTP streams to HTTPS to avoid mixed content errors
 * Usage: /api/stream-proxy?url=http://example.com/stream.m3u8
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    const { url } = req.query;

    // Log the raw request for debugging
    console.log('=== Stream Proxy Request ===');
    console.log('Method:', req.method);
    console.log('Query params:', req.query);
    console.log('URL param type:', typeof url);
    console.log('URL param value:', url);

    // Validate URL parameter
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL parameter:', url);
        return res.status(400).json({
            error: 'Missing or invalid URL parameter',
            received: url,
            type: typeof url
        });
    }

    // Check if URL has valid protocol (lenient check to allow special chars in query params)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error('Invalid URL protocol:', url.substring(0, 100));
        return res.status(400).json({
            error: 'Invalid URL protocol',
            url: url.substring(0, 200),
            hint: 'URL must start with http:// or https://'
        });
    }

    // Security: Only allow specific domains or IP ranges
    const allowedPatterns = [
        /^http:\/\/138\.2\.160\.168:8080\//,
        /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:8080\//,
        /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:25461\//,
        /^http:\/\/cdn\d*\.skygo\.mn\//,
        /^http:\/\/.*\.m3u8(\?.*)?$/,  // Allow .m3u8 with or without query params
        /^http:\/\/.*\.ts(\?.*)?$/,    // Allow .ts with or without query params
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(url));
    if (!isAllowed) {
        console.error('URL not allowed:', url);
        console.error('Tested patterns:', allowedPatterns.map(p => p.toString()));
        return res.status(403).json({ error: 'URL not allowed', url });
    }

    console.log('Proxying URL:', url);
    console.log('URL length:', url.length);
    console.log('First 100 chars:', url.substring(0, 100));

    try {
        // Fetch the stream from the HTTP source
        const urlObj = new URL(url);
        const origin = `${urlObj.protocol}//${urlObj.host}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': origin + '/',
                'Origin': origin,
            },
        });

        console.log('Stream server response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Could not read error body');
            console.error('Stream server error:', response.status, errorText);
            return res.status(response.status).json({
                error: `Stream server returned ${response.status}`,
                details: errorText.substring(0, 500)
            });
        }

        // Get content type from the original response
        const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
        console.log('Content-Type:', contentType);

        // Set CORS headers to allow the frontend to access this
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', contentType);

        // If it's an m3u8 playlist, we need to rewrite URLs in it
        if (contentType.includes('mpegurl') || contentType.includes('m3u8') || url.includes('.m3u8')) {
            const text = await response.text();
            console.log('--- Playlist Content (Start) ---');
            console.log(text.substring(0, 500));
            console.log('--- Playlist Content (End) ---');

            // Parse the base URL properly
            const urlObj = new URL(url);
            const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
            console.log('Using baseUrl for rewriting:', baseUrl);

            const rewrittenText = text.split('\n').map(line => {
                const trimmedLine = line.trim();

                // Skip comments and empty lines
                if (trimmedLine.startsWith('#') || trimmedLine === '') {
                    return line;
                }

                let absoluteUrl: string;

                // If it's already an absolute URL
                if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
                    absoluteUrl = trimmedLine;
                } else {
                    // It's a relative URL - construct absolute URL properly
                    try {
                        // Handle both relative paths and query-only URLs
                        if (trimmedLine.startsWith('?')) {
                            // Query string only - append to base URL without the file
                            const baseWithoutFile = url.substring(0, url.lastIndexOf('/') + 1);
                            absoluteUrl = baseWithoutFile + trimmedLine;
                        } else if (trimmedLine.startsWith('/')) {
                            // Absolute path - use origin
                            absoluteUrl = `${urlObj.protocol}//${urlObj.host}${trimmedLine}`;
                        } else {
                            // Relative path - append to base directory
                            absoluteUrl = baseUrl + trimmedLine;
                        }
                    } catch (e) {
                        console.error('Error constructing absolute URL:', e, 'Line:', trimmedLine);
                        return line; // Return original line if construction fails
                    }
                }

                console.log('Final Absolute URL:', absoluteUrl.substring(0, 100) + '...');

                // Only proxy HTTP URLs
                if (absoluteUrl.startsWith('http://')) {
                    return `/api/stream-proxy?url=${encodeURIComponent(absoluteUrl)}`;
                }

                return line;
            }).join('\n');

            return res.send(rewrittenText);
        }

        // For binary streams (TS segments, etc.), pipe the response
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Stream proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch stream',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
