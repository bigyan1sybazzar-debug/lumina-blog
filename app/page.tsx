import Home from '../pages/Home';
import { Metadata } from 'next';
import { db } from '../services/firebase';
import { BlogPost, Poll } from '../types';
import { unstable_cache } from 'next/cache';
import { getR2Posts, getR2Polls } from '../services/r2-data';

export const revalidate = 3600; // revalidate every hour

// Cached data fetchers
const getFeaturedConfig = unstable_cache(
    async () => {
        const configDoc = await db.collection('config').doc('featured').get();
        return configDoc.exists ? (configDoc.data()?.postIds || []) as string[] : [];
    },
    ['featured-config'],
    { revalidate: 3600 }
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
    // 1. Fetch Latest Posts (R2)
    const allPosts = await getR2Posts();
    const posts = allPosts
        .filter(p => p.status === 'published')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);

    // 2. Fetch Featured Hero Posts
    let heroFeatured: BlogPost[] = [];
    // We still fetch config from Firestore as it wasn't part of the R2 export
    const ids = await getFeaturedConfig();

    if (ids.length > 0) {
        // Try to find in the R2 dump first
        heroFeatured = allPosts.filter(p => ids.includes(p.id));

        // If some are missing (maybe older posts not in the filtered list, or simply not found in R2 dump if meaningful), 
        // we can try to fetch them from Firestore as fallback, but for "Hybrid" mode let's rely on R2 dump being "Complete".
        // The export script exports ALL posts, so if it's not in R2, it doesn't exist.

        // Maintain ordering
        heroFeatured = ids.map(id => heroFeatured.find(p => p.id === id)).filter(Boolean) as BlogPost[];
    }

    if (heroFeatured.length === 0) {
        heroFeatured = posts.slice(0, 3);
    } else if (heroFeatured.length < 3) {
        const extra = posts.filter(p => !heroFeatured.find(h => h.id === p.id)).slice(0, 3 - heroFeatured.length);
        heroFeatured = [...heroFeatured, ...extra];
    }

    // 3. Fetch Featured Polls (R2)
    const allPolls = await getR2Polls();
    const polls = allPolls
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6);

    return <Home initialPosts={posts} initialHeroFeatured={heroFeatured} initialPolls={polls} />;
}
