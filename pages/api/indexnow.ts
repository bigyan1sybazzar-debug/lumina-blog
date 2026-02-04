
export const runtime = 'edge';

const API_KEY = 'e35d69cc7c89486cba626398fe444e70';
const DOMAIN = 'bigyann.com.np';

const INDEXNOW_ENDPOINTS = [
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow'
];

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({
            success: false,
            message: 'Method not allowed. Use POST.'
        }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { url, urls } = await req.json();

        const urlsToSubmit: string[] = [];
        if (url) urlsToSubmit.push(url);
        if (urls && Array.isArray(urls)) urlsToSubmit.push(...urls);

        if (urlsToSubmit.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: 'No URLs provided. Send "url" or "urls" in request body.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const cleanUrls = urlsToSubmit.map(u => {
            if (u === '/' || u === '') return `https://${DOMAIN}/`;
            if (u.startsWith('http')) return u;
            const path = u.startsWith('/') ? u : `/${u}`;
            return `https://${DOMAIN}${path}`;
        });

        const results = [];
        for (const endpoint of INDEXNOW_ENDPOINTS) {
            try {
                const keyLocation = `https://${DOMAIN}/${API_KEY}.txt`;
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

        return new Response(JSON.stringify({
            success: allSuccessful,
            message: allSuccessful
                ? `Successfully submitted ${cleanUrls.length} URL(s) to IndexNow`
                : 'Some submissions failed',
            results
        }), { status: allSuccessful ? 200 : 207, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('IndexNow API error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Internal server error',
            error: error.message || 'Unknown error'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
