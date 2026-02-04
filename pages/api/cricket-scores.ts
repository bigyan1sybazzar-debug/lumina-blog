
export const runtime = 'edge';

import { XMLParser } from 'fast-xml-parser';

export default async function handler(req: Request) {
    try {
        const response = await fetch('https://static.cricinfo.com/rss/livescores.xml');
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
        }

        const xmlData = await response.text();
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);

        // Extract items from the RSS feed
        const items = jsonObj.rss?.channel?.item || [];

        // Normalize items (handle both single object and array cases)
        const normalizedItems = Array.isArray(items) ? items : [items];

        const scores = normalizedItems.map((item: any) => ({
            id: item.guid || Math.random().toString(36).substr(2, 9),
            title: item.title,
            link: item.link,
            description: item.description,
            pubDate: item.pubDate
        }));

        return new Response(JSON.stringify(scores), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Error fetching cricket scores:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
