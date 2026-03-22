const fs = require('fs');
const path = require('path');

// --- FETCH CONFIG ---
const SOFASCORE_URL = 'https://web-api.sofascore.com/api/v1/sport/football/scheduled-events/';
const CRICBUZZ_URL = 'https://www.cricbuzz.com/cricket-match/live-scores';

async function sync() {
    console.log("🚀 Starting Sports Sync (Manual Fallback)...");

    // Nepal Date
    const now = new Date();
    const nepalTime = new Date(now.getTime() + (5.75 * 60 * 60 * 1000));
    const today = nepalTime.toISOString().split('T')[0];

    let cache = {
        updatedAt: new Date().toISOString(),
        football: [],
        cricket: []
    };

    try {
        console.log(`📡 Fetching Football for ${today}...`);
        const res = await fetch(`${SOFASCORE_URL}${today}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
        });
        const data = await res.json();
        cache.football = data.events || [];
        console.log(`✅ Found ${cache.football.length} football events.`);
    } catch (err) {
        console.error("❌ Football Fetch Error:", err.message);
    }

    try {
        console.log(`📡 Scraping Cricket...`);
        const res = await fetch(CRICBUZZ_URL);
        const html = await res.text();
        const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
            try {
                const parsed = JSON.parse(match[1]);
                const items = parsed.mainEntity?.itemListElement || (Array.isArray(parsed) ? parsed : null);
                if (items) {
                    cache.cricket = items;
                    console.log(`✅ Found ${items.length} cricket matches.`);
                    break;
                }
            } catch (e) { }
        }
    } catch (err) {
        console.error("❌ Cricket Scraper Error:", err.message);
    }

    const outputPath = path.join(process.cwd(), 'public', 'sports-cache.json');
    fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
    console.log(`\n🎉 DONE! Cache saved to ${outputPath}`);
    console.log("👉 Now run: git add public/sports-cache.json && git commit -m \"cache: update sports\" && git push");
}

sync();
