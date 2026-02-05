import Home from '../pages/Home';
import { Metadata } from 'next';
import { db } from '../services/firebase';
import { BlogPost, Poll } from '../types';
import { unstable_cache } from 'next/cache';

export const runtime = 'edge';
export const revalidate = 60; // revalidate every minute

// Cached data fetchers
const getLatestPosts = unstable_cache(
    async () => {
        const postsSnapshot = await db.collection('posts')
            .where('status', '==', 'published')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        return postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            content: ''
        }) as BlogPost);
    },
    ['latest-posts'],
    { revalidate: 60 }
);

const getFeaturedConfig = unstable_cache(
    async () => {
        const configDoc = await db.collection('config').doc('featured').get();
        return configDoc.exists ? (configDoc.data()?.postIds || []) as string[] : [];
    },
    ['featured-config'],
    { revalidate: 3600 }
);

const getPolls = unstable_cache(
    async () => {
        const pollsSnapshot = await db.collection('polls')
            .where('status', '==', 'approved')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();
        return pollsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
    },
    ['featured-polls'],
    { revalidate: 300 }
);

export const metadata: Metadata = {
    title: 'AI Powered Tech and Science - Bigyann | Reviews & Discussions',
    description: 'AI powered Articles, Reviews & Discussions on latest tech, design, and AI technology. Explore Articles.',
    alternates: {
        canonical: 'https://bigyann.com.np',
    },
};

// Next.js Server Component
export default async function Page() {
    // 1. Fetch Latest Posts (Cached)
    const posts = await getLatestPosts();

    // 2. Fetch Featured Hero Posts
    let heroFeatured: BlogPost[] = [];
    const ids = await getFeaturedConfig();

    if (ids.length > 0) {
        heroFeatured = posts.filter(p => ids.includes(p.id));

        // If some featured posts aren't in the latest 20, fetch them individually
        if (heroFeatured.length < ids.length) {
            const missingIds = ids.filter(id => !heroFeatured.find(p => p.id === id));
            const missingItems = await Promise.all(missingIds.map(async id => {
                // Try cacheable individual fetch if needed, but for simplicity here:
                // Try posts first
                let doc = await db.collection('posts').doc(id).get();
                if (doc.exists) {
                    const data = doc.data();
                    return { id: doc.id, ...data, content: '' } as BlogPost;
                }

                // Fallback to pages
                doc = await db.collection('pages').doc(id).get();
                if (doc.exists) {
                    const data = doc.data();
                    return { id: doc.id, ...data, content: '' } as BlogPost;
                }
                return null;
            }));
            heroFeatured = [...heroFeatured, ...(missingItems.filter(p => p !== null) as BlogPost[])];
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

    // 3. Fetch Featured Polls (Cached)
    const polls = await getPolls();

    return <Home initialPosts={posts} initialHeroFeatured={heroFeatured} initialPolls={polls} />;
}
