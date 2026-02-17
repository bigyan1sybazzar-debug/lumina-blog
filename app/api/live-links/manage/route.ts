import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { LiveLink } from '@/types';

const JSON_FILE = 'live-data.json';

// Helper to fetch current live links from R2
async function getLiveLinks(): Promise<LiveLink[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching live links from R2:', e);
        return [];
    }
}

// Helper to save live links to R2
async function saveLiveLinks(links: LiveLink[]) {
    await storage.put(JSON_FILE, JSON.stringify(links), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const links = await getLiveLinks();
    return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, link, id } = body;

        let links = await getLiveLinks();

        // Ensure links is an array
        if (!Array.isArray(links)) links = [];

        if (action === 'create') {
            const newLink: LiveLink = {
                ...link,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString()
            };
            // Add to beginning
            links.unshift(newLink);
            await saveLiveLinks(links);
            return NextResponse.json({ success: true, link: newLink });
        }

        if (action === 'update') {
            const index = links.findIndex(l => l.id === id);
            if (index === -1) return NextResponse.json({ error: 'Live link not found' }, { status: 404 });

            links[index] = {
                ...links[index],
                ...link,
                updatedAt: new Date().toISOString()
            };
            await saveLiveLinks(links);
            return NextResponse.json({ success: true, link: links[index] });
        }

        if (action === 'delete') {
            links = links.filter(l => l.id !== id);
            await saveLiveLinks(links);
            return NextResponse.json({ success: true });
        }

        if (action === 'setDefault') {
            // Unset all defaults first
            links = links.map(l => ({ ...l, isDefault: false }));
            // Set the specified one as default
            const index = links.findIndex(l => l.id === id);
            if (index !== -1) {
                links[index].isDefault = true;
            }
            await saveLiveLinks(links);
            return NextResponse.json({ success: true });
        }

        if (action === 'toggleTrending') {
            const index = links.findIndex(l => l.id === id);
            if (index !== -1) {
                links[index].isTrending = !links[index].isTrending;
                await saveLiveLinks(links);
                return NextResponse.json({ success: true, link: links[index] });
            }
            return NextResponse.json({ error: 'Live link not found' }, { status: 404 });
        }

        if (action === 'vote') {
            const index = links.findIndex(l => l.id === id);
            if (index === -1) return NextResponse.json({ error: 'Live link not found' }, { status: 404 });

            const { team, userId } = body;
            const currentLink = links[index];

            if (!currentLink.poll) return NextResponse.json({ error: 'No poll associated with this link' }, { status: 400 });

            if (!currentLink.poll.votedUserIds) currentLink.poll.votedUserIds = [];
            if (currentLink.poll.votedUserIds.includes(userId)) {
                return NextResponse.json({ error: 'You have already voted' }, { status: 403 });
            }

            if (team === 'A') currentLink.poll.votesA = (currentLink.poll.votesA || 0) + 1;
            else if (team === 'B') currentLink.poll.votesB = (currentLink.poll.votesB || 0) + 1;

            currentLink.poll.votedUserIds.push(userId);
            links[index] = currentLink;
            await saveLiveLinks(links);
            return NextResponse.json({ success: true, link: currentLink });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Live Links Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
