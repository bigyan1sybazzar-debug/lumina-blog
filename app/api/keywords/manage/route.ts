import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Keyword } from '@/types';

const JSON_FILE = 'keywords.json';

// Helper to fetch current keywords from R2
async function getKeywords(): Promise<Keyword[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching keywords from R2:', e);
        return [];
    }
}

// Helper to save keywords to R2
async function saveKeywords(keywords: Keyword[]) {
    await storage.put(JSON_FILE, JSON.stringify(keywords), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const keywords = await getKeywords();
    return NextResponse.json(keywords);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, name, id } = body;

        let keywords = await getKeywords();

        // Ensure keywords is an array
        if (!Array.isArray(keywords)) keywords = [];

        if (action === 'create') {
            const normalizedName = name.trim().toLowerCase();
            if (keywords.some(k => k.name.toLowerCase() === normalizedName)) {
                return NextResponse.json({ error: 'Keyword already exists' }, { status: 400 });
            }

            const newKeyword: Keyword = {
                id: crypto.randomUUID(),
                name: normalizedName,
                count: 1
            };
            keywords.push(newKeyword);
            await saveKeywords(keywords);
            return NextResponse.json({ success: true, keyword: newKeyword });
        }

        if (action === 'delete') {
            keywords = keywords.filter(k => k.id !== id);
            await saveKeywords(keywords);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Keywords Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
