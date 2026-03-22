import { NextResponse } from 'next/server';

export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'football';
    const endpoint = searchParams.get('endpoint');

    console.log(`[SPORTS PROXY] Request for ${sport}${endpoint ? ' (endpoint: ' + endpoint + ')' : ''}`);

    // CRICKET SCRAPER (Cricbuzz)
    if (sport === 'cricket') {
        try {
            const url = 'https://www.cricbuzz.com/cricket-match/live-scores';
            console.log(`[SPORTS PROXY] Scraping Cricket: ${url}`);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                }
            });

            if (!res.ok) throw new Error(`Cricbuzz returned ${res.status}`);
            const html = await res.text();
            console.log(`[SPORTS PROXY] Cricbuzz HTML length: ${html.length}`);

            const matchData: any[] = [];
            // Use a more robust regex to find JSON-LD
            const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
            let match;
            while ((match = scriptRegex.exec(html)) !== null) {
                try {
                    const parsed = JSON.parse(match[1]);
                    // Cricbuzz often wraps matches in a mainEntity itemList or just an array
                    const items = parsed.mainEntity?.itemListElement || (Array.isArray(parsed) ? parsed : null);
                    if (items) {
                        console.log(`[SPORTS PROXY] Found ${items.length} cricket matches in JSON-LD`);
                        return NextResponse.json({ source: 'cricbuzz', matches: items });
                    }
                } catch (e) { continue; }
            }

            console.log("[SPORTS PROXY] No cricket matches found in JSON-LD");
            return NextResponse.json({ matches: [] });
        } catch (error: any) {
            console.error("[SPORTS PROXY] Cricket Scraper Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // FOOTBALL (SofaScore)
    let finalEndpoint = endpoint;
    if (!finalEndpoint) {
        // Offset to UTC+5:45 (Nepal) if needed, but for now we use local server time date or specific user date
        const now = new Date();
        // Add 5 hours and 45 mins to get current Nepal date if server is UTC
        const nepalTime = new Date(now.getTime() + (5.75 * 60 * 60 * 1000));
        const today = nepalTime.toISOString().split('T')[0];
        finalEndpoint = `sport/${sport}/scheduled-events/${today}`;
        console.log(`[SPORTS PROXY] Auto-date for ${sport}: ${today} (Nepal adjusted)`);
    }

    const url = `https://api.sofascore.com/api/v1/${finalEndpoint}`;
    console.log(`[SPORTS PROXY] Fetching SofaScore: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://www.sofascore.com',
                'Referer': 'https://www.sofascore.com/',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
            },
            next: { revalidate: 30 }
        });

        if (!res.ok) {
            console.error(`[SPORTS PROXY] SofaScore Error: ${res.status} for ${url}`);
            // Forward the error status but provide a clearer message
            return NextResponse.json({
                error: `Provider Block: ${res.status}`,
                status: res.status,
                url: url
            }, { status: res.status });
        }

        const data = await res.json();
        console.log(`[SPORTS PROXY] SofaScore Data: Found ${data.events?.length || 0} events`);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[SPORTS PROXY] SofaScore Fetch Failure:", error.message);
        return NextResponse.json({ error: "Network Timeout or Connectivity Issue" }, { status: 504 });
    }
}
