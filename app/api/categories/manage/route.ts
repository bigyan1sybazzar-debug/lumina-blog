import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { Category } from '@/types';

const JSON_FILE = 'categories.json';

// Helper to fetch current categories from R2
async function getCategories(): Promise<Category[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error('Error fetching categories from R2:', e);
        return [];
    }
}

// Helper to save categories to R2
async function saveCategories(categories: Category[]) {
    await storage.put(JSON_FILE, JSON.stringify(categories), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const categories = await getCategories();
    return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, category, id } = body;

        let categories = await getCategories();

        // Ensure categories is an array
        if (!Array.isArray(categories)) categories = [];

        if (action === 'create') {
            const newCategory: Category = {
                ...category,
                id: crypto.randomUUID(),
                count: 0
            };
            categories.push(newCategory);
            await saveCategories(categories);
            return NextResponse.json({ success: true, category: newCategory });
        }

        if (action === 'delete') {
            categories = categories.filter(c => c.id !== id);
            await saveCategories(categories);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Category Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
