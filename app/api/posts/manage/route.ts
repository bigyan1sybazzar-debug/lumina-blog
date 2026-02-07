import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { BlogPost } from '@/types';

const JSON_FILE = 'posts.json';

// Helper to fetch current posts
async function getPosts(): Promise<BlogPost[]> {
    try {
        const url = `${process.env.R2_PUBLIC_DOMAIN}/${JSON_FILE}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

// Helper to save posts
async function savePosts(posts: BlogPost[]) {
    await storage.put(JSON_FILE, JSON.stringify(posts), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
    });
}

export async function GET() {
    const posts = await getPosts();
    return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, post, id } = body;

        let posts = await getPosts();

        // Ensure posts is an array
        if (!Array.isArray(posts)) posts = [];

        if (action === 'create') {
            const newPost = {
                ...post,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            // Add to beginning
            posts.unshift(newPost);
            await savePosts(posts);
            return NextResponse.json({ success: true, post: newPost });
        }

        if (action === 'update') {
            const index = posts.findIndex(p => p.id === id);
            if (index === -1) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

            posts[index] = {
                ...posts[index],
                ...post,
                updatedAt: new Date().toISOString()
            };
            await savePosts(posts);
            return NextResponse.json({ success: true, post: posts[index] });
        }

        if (action === 'delete') {
            posts = posts.filter(p => p.id !== id);
            await savePosts(posts);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('R2 Post Management Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
