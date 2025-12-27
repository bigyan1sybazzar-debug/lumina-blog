// api/bing-submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const BING_API_KEY = process.env.BING_WEBMASTER_API_KEY || 'sampleapikeyEEDECC1EA4AE341CC57365E075EBC8B6';
const SITE_URL = 'https://bigyann.com.np';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Fetch the URL to get the HTTP response
        const response = await fetch(url);
        const content = await response.text();

        // Build HTTP response message
        const httpMessage = [
            `HTTP/1.1 ${response.status} ${response.statusText}`,
            `Date: ${new Date().toUTCString()}`,
            `Content-Type: ${response.headers.get('content-type') || 'text/html'}`,
            `Content-Length: ${content.length}`,
            `Connection: close`,
            '',
            content.substring(0, 1000) // Limit content size
        ].join('\n');

        // Base64 encode the HTTP message
        const base64HttpMessage = Buffer.from(httpMessage).toString('base64');

        // Build XML request
        const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<SubmitContent xmlns="http://schemas.datacontract.org/2004/07/Microsoft.Bing.Webmaster.Api">
  <siteUrl>${SITE_URL}</siteUrl>
  <url>${url}</url>
  <httpMessage>${base64HttpMessage}</httpMessage>
  <structuredData></structuredData>
  <dynamicServing>0</dynamicServing>
</SubmitContent>`;

        // Submit to Bing Webmaster API
        const bingResponse = await fetch(
            `https://ssl.bing.com/webmaster/api.svc/pox/SubmitContent?apikey=${BING_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Host': 'ssl.bing.com',
                },
                body: xmlBody,
            }
        );

        if (bingResponse.ok) {
            console.log(`✅ Bing Webmaster: Successfully submitted ${url}`);
            return res.status(200).json({ success: true, message: 'URL submitted to Bing' });
        } else {
            const errorText = await bingResponse.text();
            console.error(`❌ Bing Webmaster: Failed to submit ${url}`, errorText);
            return res.status(bingResponse.status).json({
                success: false,
                error: 'Bing API error',
                details: errorText
            });
        }
    } catch (error: any) {
        console.error('❌ Bing Webmaster: Error submitting URL', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}
