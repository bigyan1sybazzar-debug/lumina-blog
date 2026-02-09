import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Poll } from '@/types';

const JSON_FILE = 'polls.json';

// Helper to fetch current polls from R2
async function getPolls(): Promise<Poll[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching polls from R2:', e);
        return [];
    }
}

// Helper to save polls to R2
async function savePolls(polls: Poll[]) {
    await storage.put(JSON_FILE, JSON.stringify(polls), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const polls = await getPolls();
    return NextResponse.json(polls);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, poll, id } = body;

        let polls = await getPolls();

        // Ensure polls is an array
        if (!Array.isArray(polls)) polls = [];

        if (action === 'create') {
            const newPoll: Poll = {
                ...poll,
                id: crypto.randomUUID(),
                totalVotes: 0,
                votedUserIds: [],
                createdAt: new Date().toISOString()
            };
            polls.unshift(newPoll);
            await savePolls(polls);
            return NextResponse.json({ success: true, poll: newPoll });
        }

        if (action === 'update') {
            const index = polls.findIndex(p => p.id === id);
            if (index === -1) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

            polls[index] = { ...polls[index], ...poll, updatedAt: new Date().toISOString() };
            await savePolls(polls);
            return NextResponse.json({ success: true, poll: polls[index] });
        }

        if (action === 'delete') {
            polls = polls.filter(p => p.id !== id);
            await savePolls(polls);
            return NextResponse.json({ success: true });
        }

        if (action === 'updateStatus') {
            const index = polls.findIndex(p => p.id === id);
            if (index === -1) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

            polls[index].status = body.status;
            polls[index].updatedAt = new Date().toISOString();
            await savePolls(polls);
            return NextResponse.json({ success: true, poll: polls[index] });
        }

        if (action === 'vote') {
            const index = polls.findIndex(p => p.id === id);
            if (index === -1) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

            const optionIndex = polls[index].options.findIndex((o: any) => o.id === body.optionId);
            if (optionIndex === -1) return NextResponse.json({ error: 'Option not found' }, { status: 400 });

            polls[index].options[optionIndex].votes += 1;
            polls[index].totalVotes += 1;
            await savePolls(polls);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Poll Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
