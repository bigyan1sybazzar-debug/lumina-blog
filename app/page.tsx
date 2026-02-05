import Home from '../pages/Home';
import { Metadata } from 'next';
import { dbLite } from '../services/firebase'; // Use dbLite
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore/lite';
import { BlogPost, Poll } from '../types';
import { unstable_cache } from 'next/cache';

export const revalidate = 60; // revalidate every minute

// Cached data fetchers
const getLatestPosts = unstable_cache(
    async () => {
        try {
            const q = query(
                collection(dbLite, 'posts'),
                where('status', '==', 'published'),
                orderBy('createdAt', 'desc'),
                limit(20)
            );
            const postsSnapshot = await getDocs(q);
            return postsSnapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                content: ''
            }) as BlogPost);
        } catch (error: any) {
            console.error('Build Error: Failed to fetch latest posts:', error?.message || error);
            // Return dummy data or empty to allow build to proceed
            return [];
        }
    },
    ['latest-posts'],
    { revalidate: 60 }
);

const getFeaturedConfig = unstable_cache(
    async () => {
        try {
            const configRef = doc(dbLite, 'config', 'featured');
            const configDoc = await getDoc(configRef);
            return configDoc.exists() ? (configDoc.data()?.postIds || []) as string[] : [];
        } catch (error) {
            console.error('Build Warning: Failed to fetch featured config:', error);
            return [];
        }
    },
    ['featured-config'],
    { revalidate: 3600 }
);

const getPolls = unstable_cache(
    async () => {
        try {
            const q = query(
                collection(dbLite, 'polls'),
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc'),
                limit(6)
            );
            const pollsSnapshot = await getDocs(q);
            return pollsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Poll));
        } catch (error) {
            console.error('Build Warning: Failed to fetch polls:', error);
            return [];
        }
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
        heroFeatured = posts.filter((p: any) => ids.includes(p.id));

        // If some featured posts aren't in the latest 20, fetch them individually
        if (heroFeatured.length < ids.length) {
            const missingIds = ids.filter(id => !heroFeatured.find(p => p.id === id));
            const missingItems = await Promise.all(missingIds.map(async id => {
                // Try cacheable individual fetch if needed, but for simplicity here:
                // Try posts first
                const postRef = doc(dbLite, 'posts', id);
                let docSnap = await getDoc(postRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    return { id: docSnap.id, ...data, content: '' } as BlogPost;
                }

                // Fallback to pages
                const pageRef = doc(dbLite, 'pages', id);
                docSnap = await getDoc(pageRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    return { id: docSnap.id, ...data, content: '' } as BlogPost;
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
        const extra = posts.filter((p: any) => !heroFeatured.find((h: any) => h.id === p.id)).slice(0, 3 - heroFeatured.length);
        heroFeatured = [...heroFeatured, ...extra];
    }

    // 3. Fetch Featured Polls (Cached)
    const polls = await getPolls();

    return <Home initialPosts={posts} initialHeroFeatured={heroFeatured} initialPolls={polls} />;
}
