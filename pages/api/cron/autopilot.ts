
export const runtime = 'edge';

import admin from 'firebase-admin';
import { generateNewsPost, generateBlogImage } from '../../../services/geminiService';
import { slugify } from '../../../lib/slugify';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error('Failed to init Firebase Admin:', e);
    }
}

const db = admin.firestore();

export default async function handler(req: Request) {
    // 1. Authenticate Request
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // 2. Check Autopilot Configuration
        const configRef = db.collection('config').doc('autopilot');
        const configDoc = await configRef.get();

        if (!configDoc.exists || !configDoc.data()?.isEnabled) {
            console.log('Autopilot is disabled or not configured.');
            return new Response(JSON.stringify({ status: 'skipped', message: 'Autopilot disabled' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Fetch Categories
        const categoriesSnapshot = await db.collection('categories').get();
        if (categoriesSnapshot.empty) {
            await logActivity(configRef, 'Error: No categories found.', 'error');
            return new Response(JSON.stringify({ error: 'No categories' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const categories = categoriesSnapshot.docs.map(doc => doc.data());
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        await logActivity(configRef, `Starting cycle. Category: ${randomCategory.name}`, 'info');

        // 4. Generate Content (News)
        const { title: aiTitle, content: aiContent, sources } = await generateNewsPost(randomCategory.name);
        await logActivity(configRef, `Generated title: "${aiTitle}"`, 'success');

        // 5. Generate Image
        const aiImage = await generateBlogImage(aiTitle);
        await logActivity(configRef, 'Image generated successfully.', 'success');

        // 6. Create Post Data
        let slug = slugify(aiTitle);
        let counter = 1;
        while (await checkSlugExists(slug)) {
            slug = `${slugify(aiTitle)}-${counter}`;
            counter++;
        }

        const postData = {
            title: aiTitle,
            content: aiContent,
            excerpt: aiContent.substring(0, 150).replace(/[#*`]/g, '') + '...',
            author: {
                name: 'BIGGS',
                avatar: '/images/biggs-avatar.png',
                id: 'ai-bot'
            },
            readTime: `${Math.ceil(aiContent.split(' ').length / 200)} min read`,
            category: randomCategory.name,
            tags: [randomCategory.name, 'News', 'AI Generated'],
            coverImage: aiImage,
            slug,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 7. Save to Firestore
        await db.collection('posts').add(postData);
        await logActivity(configRef, `Published post: ${aiTitle}`, 'success');

        return new Response(JSON.stringify({ success: true, post: aiTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('Autopilot Error:', error);
        try {
            await db.collection('config').doc('autopilot').update({
                logs: admin.firestore.FieldValue.arrayUnion({
                    id: Date.now().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    message: `Critical Failure: ${error.message}`,
                    type: 'error'
                })
            });
        } catch (e) { /* ignore */ }

        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// Helper: Check Slug
async function checkSlugExists(slug: string) {
    const snapshot = await db.collection('posts').where('slug', '==', slug).limit(1).get();
    return !snapshot.empty;
}

// Helper: Log to Firestore
async function logActivity(ref: any, message: string, type: 'info' | 'success' | 'error' | 'warning') {
    await ref.update({
        logs: admin.firestore.FieldValue.arrayUnion({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            message,
            type
        })
    });
}
