import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Highlight } from '@/types';

const JSON_FILE = 'highlights.json';

// Helper to fetch current highlights from R2
async function getHighlights(): Promise<Highlight[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching highlights from R2:', e);
        return [];
    }
}

// Helper to save highlights to R2
async function saveHighlights(highlights: Highlight[]) {
    await storage.put(JSON_FILE, JSON.stringify(highlights), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const highlights = await getHighlights();
    return NextResponse.json(highlights);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, highlight, id } = body;

        let highlights = await getHighlights();

        // Ensure highlights is an array
        if (!Array.isArray(highlights)) highlights = [];

        if (action === 'create') {
            const newHighlight: Highlight = {
                ...highlight,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString()
            };
            highlights.unshift(newHighlight);
            await saveHighlights(highlights);
            return NextResponse.json({ success: true, highlight: newHighlight });
        }

        if (action === 'update') {
            const index = highlights.findIndex(h => h.id === id);
            if (index === -1) return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });

            highlights[index] = {
                ...highlights[index],
                ...highlight,
                updatedAt: new Date().toISOString()
            };
            await saveHighlights(highlights);
            return NextResponse.json({ success: true, highlight: highlights[index] });
        }

        if (action === 'delete') {
            highlights = highlights.filter(h => h.id !== id);
            await saveHighlights(highlights);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Highlights Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
