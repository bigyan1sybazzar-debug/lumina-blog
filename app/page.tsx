import Home from '../pages/Home';
import { Metadata } from 'next';
import { db } from '../services/firebase';
import { BlogPost, Poll } from '../types';

export const metadata: Metadata = {
    title: 'AI Powered Tech and Science - Bigyann | Reviews & Discussions',
    description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
    alternates: {
        canonical: 'https://bigyann.com.np',
    },
};

// Next.js Server Component
export default async function Page() {
    // 1. Fetch Latest Posts
    const postsSnapshot = await db.collection('posts')
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(24)
        .get();

    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

    // 2. Fetch Featured Hero Posts
    let heroFeatured: BlogPost[] = [];
    const configDoc = await db.collection('config').doc('featured').get();
    if (configDoc.exists) {
        const ids: string[] = configDoc.data()?.postIds || [];
        heroFeatured = posts.filter(p => ids.includes(p.id));

        // If some featured posts aren't in the latest 24, fetch them individually
        if (heroFeatured.length < ids.length) {
            const missingIds = ids.filter(id => !heroFeatured.find(p => p.id === id));
            const missingPosts = await Promise.all(missingIds.map(async id => {
                const doc = await db.collection('posts').doc(id).get();
                return doc.exists ? { id: doc.id, ...doc.data() } as BlogPost : null;
            }));
            heroFeatured = [...heroFeatured, ...(missingPosts.filter(p => p !== null) as BlogPost[])];
        }
        // Maintain ordering
        heroFeatured = ids.map(id => heroFeatured.find(p => p.id === id)).filter(Boolean) as BlogPost[];
    }

    if (heroFeatured.length === 0) {
        heroFeatured = posts.slice(0, 3);
    } else if (heroFeatured.length < 3) {
        const extra = posts.filter(p => !heroFeatured.find(h => h.id === p.id)).slice(0, 3 - heroFeatured.length);
        heroFeatured = [...heroFeatured, ...extra];
    }

    // 3. Fetch Featured Polls
    const pollsSnapshot = await db.collection('polls')
        .where('status', '==', 'approved')
        .orderBy('createdAt', 'desc')
        .limit(8)
        .get();
    const polls = pollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));

    return <Home initialPosts={posts} initialHeroFeatured={heroFeatured} initialPolls={polls} />;
}
