import { db } from './firebase';
import firebase from 'firebase/compat/app';

// --- TYPES ---
export interface LiveMatch {
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    time: string;
    league: string;
    category: 'LIVE' | 'UPCOMING' | 'FINISHED';
}

// Map SofaScore response to our internal structure
function mapSofaScoreToLiveMatch(event: any): LiveMatch {
    const statusType = event.status.type;
    let category: 'LIVE' | 'UPCOMING' | 'FINISHED' = 'UPCOMING';

    if (statusType === 'inprogress') {
        category = 'LIVE';
    } else if (statusType === 'finished') {
        category = 'FINISHED';
    } else if (statusType === 'notstarted') {
        category = 'UPCOMING';
    }

    // Formation of start time if not started
    let statusDesc = event.status.description;
    if (statusType === 'notstarted' && event.startTimestamp) {
        // Convert timestamp to HH:MM local time
        const date = new Date(event.startTimestamp * 1000);
        statusDesc = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    return {
        id: event.id,
        homeTeam: event.homeTeam.shortName || event.homeTeam.name,
        awayTeam: event.awayTeam.shortName || event.awayTeam.name,
        homeScore: event.homeScore?.display ?? 0,
        awayScore: event.awayScore?.display ?? 0,
        status: statusDesc,
        time: event.lastPeriod || (category === 'UPCOMING' ? statusDesc : 'FT'),
        league: event.tournament.name,
        category: category
    };
}

const PRIORITY_LEAGUES = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'UEFA Champions League', 'UEFA Europa League', 'UEFA Europa Conference League',
    'FIFA World Cup', 'Euro', 'Copa América', 'FA Cup', 'EFL Cup'
];

// Fetch live football scores with fallback
export async function getLiveScores(): Promise<LiveMatch[]> {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&t=${Date.now()}`);
        if (!res.ok) throw new Error(`Primary API Error ${res.status}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error("Provider returned non-JSON response");
        }

        const data = await res.json();
        return processFootballMatches(data.events || []);
    } catch (e) {
        console.warn("Live Score Service: Primary Football API Failed, trying Firebase fallback...", e);
        try {
            const doc = await db.collection('globals').doc('sports').get();
            if (doc.exists) {
                const cloudData = doc.data();
                if (cloudData?.football) return processFootballMatches(cloudData.football);
            }
        } catch (dbErr) {
            console.error("Firebase fetch failed", dbErr);
        }

        try {
            const res = await fetch('/sports-cache.json');
            if (!res.ok) return [];
            const data = await res.json();
            return processFootballMatches(data.football || []);
        } catch (fallBackErr) {
            console.error("Live Score Service: Fallback also failed.", fallBackErr);
            return [];
        }
    }
}

function processFootballMatches(events: any[]): LiveMatch[] {
    const matches = (events || []).map((event: any) => {
        try {
            return mapSofaScoreToLiveMatch(event);
        } catch (err) {
            console.warn("Skipping malformed event:", event?.id);
            return null;
        }
    }).filter((m: any) => m !== null);

    return (matches as LiveMatch[]).sort((a: LiveMatch, b: LiveMatch) => {
        if (a.category === 'LIVE' && b.category !== 'LIVE') return -1;
        if (a.category !== 'LIVE' && b.category === 'LIVE') return 1;
        const aPriority = PRIORITY_LEAGUES.some(l => a.league.includes(l));
        const bPriority = PRIORITY_LEAGUES.some(l => b.league.includes(l));
        if (aPriority && !bPriority) return -1;
        if (!aPriority && bPriority) return 1;
        return 0;
    });
}

// Fetch statistics for a specific match
export async function getEventStatistics(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/statistics`);
        if (!res.ok) throw new Error(`Statistics API Error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Event Statistics Error:", e);
        return null;
    }
}

// Fetch lineups for a specific match
export async function getEventLineups(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/lineups`);
        if (!res.ok) throw new Error(`Lineups API Error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Event Lineups Error:", e);
        return null;
    }
}

// Fetch full event details
export async function getEventDetails(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}`);
        if (!res.ok) throw new Error(`Details API Error ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error("Event Details Error:", e);
        return null;
    }
}

// Fetch live cricket scores with fallback
export async function getCricketScores(): Promise<LiveMatch[]> {
    try {
        const res = await fetch(`/api/sports/proxy?sport=cricket&t=${Date.now()}`);
        if (!res.ok) throw new Error(`Primary Cricket API Error ${res.status}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error("Provider returned non-JSON response");
        }

        const data = await res.json();
        return processCricketMatches(data.matches || []);
    } catch (e) {
        console.warn("Live Score Service: Primary Cricket API Failed, trying Firebase fallback...", e);
        try {
            const doc = await db.collection('globals').doc('sports').get();
            if (doc.exists) {
                const cloudData = doc.data();
                if (cloudData?.cricket) return processCricketMatches(cloudData.cricket || []);
            }
        } catch (dbErr) { }

        try {
            const res = await fetch('/sports-cache.json');
            if (!res.ok) return [];
            const data = await res.json();
            return processCricketMatches(data.cricket || []);
        } catch (fallBackErr) {
            return [];
        }
    }
}

function processCricketMatches(items: any[]): LiveMatch[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item: any, idx: number) => {
        const event = item;
        const team1 = event.competitor?.[0]?.name || 'Team 1';
        const team2 = event.competitor?.[1]?.name || 'Team 2';

        return {
            id: 99000 + idx,
            homeTeam: team1,
            awayTeam: team2,
            homeScore: 0,
            awayScore: 0,
            status: event.eventStatus || 'Scheduled',
            time: event.startDate ? new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
            league: event.superEvent || 'International Cricket',
            category: event.eventStatus?.toLowerCase().includes('won') ? 'FINISHED' :
                (event.eventStatus?.toLowerCase().includes('opt') || event.eventStatus?.toLowerCase().includes('need')) ? 'LIVE' : 'UPCOMING'
        } as LiveMatch;
    });
}

// Push local working data to Firebase for the live site
export async function syncToCloud(footballEvents: any[], cricketMatches: any[]) {
    try {
        await db.collection('globals').doc('sports').set({
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            football: footballEvents,
            cricket: cricketMatches
        }, { merge: true });
        return true;
    } catch (err) {
        console.error("Cloud Sync Error:", err);
        return false;
    }
}

// Helper for dev sync
export async function getRawSportsData(sport: 'football' | 'cricket') {
    const res = await fetch(`/api/sports/proxy?sport=${sport}&t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return sport === 'football' ? data.events : data.matches;
}
