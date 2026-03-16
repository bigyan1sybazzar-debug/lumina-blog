
export const runtime = 'edge';

const BING_API_KEY = process.env.BING_WEBMASTER_API_KEY || '1f2da629fc224cdcb5dd4a6f821facc6';
const SITE_URL = 'https://bigyann.com.np';

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Fetch the URL to get the HTTP response
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`❌ Bing Webmaster: Aborting submission. Target URL ${url} returned status ${response.status}`);
            return new Response(JSON.stringify({
                error: `Target URL unreachable (Status ${response.status}). Ensure the page is live before submitting.`
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

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
        // Using btoa/TextEncoder instead of Buffer for Edge compatibility
        const encoder = new TextEncoder();
        const data = encoder.encode(httpMessage);
        const base64HttpMessage = btoa(String.fromCharCode(...data));

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
            return new Response(JSON.stringify({ success: true, message: 'URL submitted to Bing' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            const errorText = await bingResponse.text();
            console.error(`❌ Bing Webmaster: Failed to submit ${url}`, errorText);
            return new Response(JSON.stringify({
                success: false,
                error: 'Bing API error',
                details: errorText
            }), { status: bingResponse.status, headers: { 'Content-Type': 'application/json' } });
        }
    } catch (error: any) {
        console.error('❌ Bing Webmaster: Error submitting URL', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
