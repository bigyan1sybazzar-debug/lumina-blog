import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { action, ...otherParams } = req.query;

    if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
    }

    // specific to Guerrilla Mail
    const baseUrl = 'https://api.guerrillamail.com/ajax.php';
    const queryString = new URLSearchParams({
        f: action as string,
        ...otherParams as any
        // Note: Guerrilla Mail uses 'sid_token' for sessions, which comes in otherParams
    }).toString();

    const targetUrl = `${baseUrl}?${queryString}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET', // Guerrilla Mail works mostly with GET
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        // Guerrilla mail sometimes returns 200 even for errors, so we rely on their body
        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Proxy request failed:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
