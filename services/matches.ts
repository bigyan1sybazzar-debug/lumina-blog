import { APIMatch } from '../types';

export const getLiveMatches = async (): Promise<APIMatch[]> => {
    try {
        const response = await fetch('https://streamed.pk/api/matches/live');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching live matches:', error);
        return [];
    }
};

export const getPopularMatches = async (): Promise<APIMatch[]> => {
    try {
        const response = await fetch('https://streamed.pk/api/matches/live/popular');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching popular matches:', error);
        return [];
    }
};

export const getMatchesBySport = async (sport: string): Promise<APIMatch[]> => {
    try {
        const response = await fetch(`https://streamed.pk/api/matches/${sport}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching matches for ${sport}:`, error);
        return [];
    }
};

export const getSports = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const response = await fetch('https://streamed.pk/api/sports');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching sports:', error);
        return [];
    }
};

export const getBadgeUrl = (badgeId: string): string => {
    if (!badgeId) return '';
    return `https://streamed.pk/api/images/badge/${badgeId}.webp`;
};

export const getPosterUrl = (homeBadgeId: string, awayBadgeId: string): string => {
    if (!homeBadgeId || !awayBadgeId) return '';
    return `https://streamed.pk/api/images/poster/${homeBadgeId}/${awayBadgeId}.webp`;
};

export const getProxyImageUrl = (posterPath: string): string => {
    if (!posterPath) return '';
    // If it already contains the full URL or starts with /api/images/proxy
    if (posterPath.startsWith('http')) return posterPath;
    if (posterPath.startsWith('/api/images/proxy')) return `https://streamed.pk${posterPath}.webp`;
    return `https://streamed.pk/api/images/proxy/${posterPath}.webp`;
};
