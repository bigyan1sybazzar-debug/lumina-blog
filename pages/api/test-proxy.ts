import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Test endpoint to verify stream proxy is working
 * Usage: /api/test-proxy
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const testUrl = 'http://138.2.160.168:8080/fetch?COSMOTESPORT1';

    try {
        // Test if we can reach the proxy
        const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(testUrl)}`;

        return res.status(200).json({
            message: 'Proxy test endpoint',
            testUrl,
            proxyUrl,
            encodedUrl: encodeURIComponent(testUrl),
            fullProxyUrl: `${req.headers.host}${proxyUrl}`,
            hint: `Try accessing: http://localhost:3000${proxyUrl}`
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
