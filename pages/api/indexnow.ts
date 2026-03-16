import type { NextApiRequest, NextApiResponse } from 'next';

const API_KEY = 'e35d69cc7c89486cba626398fe444e70';
const DOMAIN = 'bigyann.com.np';

const INDEXNOW_ENDPOINTS = [
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow'
];

type IndexNowResponse = {
    success: boolean;
    message: string;
    results?: {
        engine: string;
        status: number;
        success: boolean;
    }[];
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<IndexNowResponse>
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST.'
        });
    }

    try {
        const { url, urls } = req.body;

        // Support both single URL and multiple URLs
        const urlsToSubmit: string[] = [];

        if (url) {
            urlsToSubmit.push(url);
        }

        if (urls && Array.isArray(urls)) {
            urlsToSubmit.push(...urls);
        }

        if (urlsToSubmit.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No URLs provided. Send "url" or "urls" in request body.'
            });
        }

        // Clean and validate URLs
        const cleanUrls = urlsToSubmit.map(u => {
            if (u === '/' || u === '') return `https://${DOMAIN}/`;
            if (u.startsWith('http')) return u;
            const path = u.startsWith('/') ? u : `/${u}`;
            return `https://${DOMAIN}${path}`;
        });

        const results = [];

        // Submit to each search engine
        for (const endpoint of INDEXNOW_ENDPOINTS) {
            try {
                const keyLocation = `https://${DOMAIN}/${API_KEY}.txt`;

                // Always use POST method with JSON body (more reliable for Bing)
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'User-Agent': 'Mozilla/5.0 (compatible; IndexNow-Client/1.0)',
                    },
                    body: JSON.stringify({
                        host: DOMAIN,
                        key: API_KEY,
                        keyLocation: keyLocation,
                        urlList: cleanUrls
                    })
                });

                results.push({
                    engine: endpoint,
                    status: response.status,
                    success: response.ok || response.status === 202
                });
            } catch (error) {
                console.error(`Failed to submit to ${endpoint}:`, error);
                results.push({
                    engine: endpoint,
                    status: 0,
                    success: false
                });
            }
        }

        const allSuccessful = results.every(r => r.success);

        return res.status(allSuccessful ? 200 : 207).json({
            success: allSuccessful,
            message: allSuccessful
                ? `Successfully submitted ${cleanUrls.length} URL(s) to IndexNow`
                : 'Some submissions failed',
            results
        });

    } catch (error) {
        console.error('IndexNow API error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
