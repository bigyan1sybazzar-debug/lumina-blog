import fs from 'fs';

async function testScraper() {
    const html = fs.readFileSync('cricbuzz.html', 'utf8');
    const scripts = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    let found = false;
    for (const script of scripts) {
        try {
            const parsed = JSON.parse(script[1]);
            if (parsed.mainEntity?.itemListElement) {
                console.log("FOUND MATCHES!");
                console.log(JSON.stringify(parsed.mainEntity.itemListElement[0], null, 2));
                found = true;
                break;
            }
        } catch (e) { continue; }
    }
    if (!found) console.log("NO MATCHES FOUND");
}

testScraper();
