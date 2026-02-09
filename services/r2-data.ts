import { getLiveLinks, getIPTVChannels, getPosts, getCategories, getAllPollsAdmin, getHighlights, getKeywords } from './db';
import { IPTVChannel, LiveLink, BlogPost, Category, Poll, Highlight, Keyword } from '../types';

// --- R2 DATA FETCHERS ---
const R2_PUBLIC_DOMAIN = "https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev";

// Helper to fetch JSON from R2 with fallback
async function fetchR2<T>(filename: string, fallbackFn: () => Promise<T>): Promise<T> {
    const isServer = typeof window === 'undefined';
    try {
        const cacheBuster = `?t=${Date.now()}`;
        const url = isServer ? `${R2_PUBLIC_DOMAIN}/${filename}${cacheBuster}` : `/api/r2-proxy?file=${filename}&t=${Date.now()}`;
        const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
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

// Helper to get a single poll by slug using R2 data
export const getR2PollBySlug = async (slug: string): Promise<Poll | null> => {
    try {
        const polls = await getR2Polls();
        return polls.find(p => p.slug === slug) || null;
    } catch (error) {
        console.error("Error fetching poll by slug from R2:", error);
        return null;
    }
};

// Helper to get posts by category using R2 data
export const getR2PostsByCategory = async (category: string): Promise<BlogPost[]> => {
    try {
        const posts = await getR2Posts();
        if (category === 'all') return posts;
        return posts.filter(p => p.category === category);
    } catch (error) {
        console.error("Error fetching posts by category from R2:", error);
        return [];
    }
};

// Helper to get a single live link by ID using R2 data
export const getR2LiveLinkById = async (id: string): Promise<LiveLink | null> => {
    try {
        const links = await getR2LiveLinks();
        return links.find(l => l.id === id) || null;
    } catch (error) {
        console.error("Error fetching live link by ID from R2:", error);
        return null;
    }
};

// Helper to get trending live links using R2 data
export const getR2TrendingLiveLinks = async (): Promise<LiveLink[]> => {
    try {
        const links = await getR2LiveLinks();
        return links.filter(l => l.isTrending).sort((a, b) => (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999));
    } catch (error) {
        console.error("Error fetching trending live links from R2:", error);
        return [];
    }
};

// Helper to get trending IPTV channels using R2 data
export const getR2TrendingIPTVChannels = async (): Promise<IPTVChannel[]> => {
    try {
        const channels = await getR2IPTVChannels(false); // Get all channels
        return channels.filter(c => c.isTrending).sort((a, b) => (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999));
    } catch (error) {
        console.error("Error fetching trending IPTV channels from R2:", error);
        return [];
    }
};

