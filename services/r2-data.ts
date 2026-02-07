import { getLiveLinks, getIPTVChannels, getPosts, getCategories, getAllPollsAdmin, getHighlights, getKeywords } from './db';
import { IPTVChannel, LiveLink, BlogPost, Category, Poll, Highlight, Keyword } from '../types';

// --- R2 DATA FETCHERS ---
const R2_PUBLIC_DOMAIN = "https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev";

// Helper to fetch JSON from R2 with fallback
async function fetchR2<T>(filename: string, fallbackFn: () => Promise<T>): Promise<T> {
    try {
        const res = await fetch(`${R2_PUBLIC_DOMAIN}/${filename}`, {
            next: { revalidate: 3600 },
            // headers: { 'Cache-Control': 'no-cache' } // REMOVED: Allow caching to save costs
        });
        if (!res.ok) throw new Error(`${filename} fetch failed`);
        const data = await res.json();
        return Array.isArray(data) ? data as T : [] as unknown as T;
    } catch (e) {
        console.warn(`R2 ${filename} fetch failed, falling back to Firestore.`, e);
        return fallbackFn();
    }
}

export const getR2LiveLinks = () => fetchR2<LiveLink[]>('live-data.json', getLiveLinks);
export const getR2IPTVChannels = (onlyActive = true) => fetchR2<IPTVChannel[]>('iptv-data.json', () => getIPTVChannels(onlyActive)).then(data => onlyActive ? data.filter(c => c.status === 'active') : data);
export const getR2Posts = () => fetchR2<BlogPost[]>('posts.json', getPosts);
export const getR2Categories = () => fetchR2<Category[]>('categories.json', getCategories);
export const getR2Polls = () => fetchR2<Poll[]>('polls.json', getAllPollsAdmin).then(polls => polls.filter(p => p.status === 'approved')); // Filter for public
export const getR2Highlights = () => fetchR2<Highlight[]>('highlights.json', getHighlights);
export const getR2Keywords = () => fetchR2<Keyword[]>('keywords.json', getKeywords);

// Helper to get a single post by slug using R2 data
export const getR2PostBySlug = async (slug: string): Promise<BlogPost | null> => {
    try {
        const posts = await getR2Posts();
        return posts.find(p => p.slug === slug) || null;
    } catch (error) {
        console.error("Error fetching post by slug from R2:", error);
        return null;
    }
};

