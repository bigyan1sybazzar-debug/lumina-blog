
export const runtime = 'edge';

export default async function handler(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (!action) {
        return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Convert all searchParams to an object for Guerrilla Mail
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        if (key === 'action') {
            params['f'] = value;
        } else {
            params[key] = value;
        }
    });

    const baseUrl = 'https://api.guerrillamail.com/ajax.php';
    const queryString = new URLSearchParams(params).toString();
    const targetUrl = `${baseUrl}?${queryString}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Proxy request failed:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
