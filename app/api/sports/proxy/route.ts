import { NextResponse } from 'next/server';

export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'football';
    const endpoint = searchParams.get('endpoint');

    // CRICKET SCRAPER (Cricbuzz)
    if (sport === 'cricket') {
        try {
            const url = 'https://www.cricbuzz.com/cricket-match/live-scores';
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                }
            });

            if (!res.ok) throw new Error(`Cricbuzz returned ${res.status}`);
            const html = await res.text();

            // Extract JSON-LD (structured match data)
            const scripts = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
            for (const script of scripts) {
                try {
                    const parsed = JSON.parse(script[1]);
                    if (parsed.mainEntity?.itemListElement) {
                        return NextResponse.json({
                            source: 'cricbuzz',
                            matches: parsed.mainEntity.itemListElement
                        });
                    }
                } catch (e) { continue; }
            }
            return NextResponse.json({ matches: [] });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    // FOOTBALL (SofaScore)
    let finalEndpoint = endpoint;
    if (!finalEndpoint) {
        const today = new Date().toISOString().split('T')[0];
        finalEndpoint = `sport/${sport}/scheduled-events/${today}`;
    }

    const url = `https://api.sofascore.com/api/v1/${finalEndpoint}`;
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Origin': 'https://www.sofascore.com',
                'Referer': 'https://www.sofascore.com/',
            },
            next: { revalidate: 30 }
        });

        if (!res.ok) return NextResponse.json({ error: `Provider returned ${res.status}` }, { status: res.status });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
