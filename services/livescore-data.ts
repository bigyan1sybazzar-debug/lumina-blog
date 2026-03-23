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

export async function getEventStatistics(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/statistics`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    } catch (e) {
        // --- CLOUD FALLBACK ---
        try {
            const doc = await db.collection('match_details').doc(eventId.toString()).get();
            if (doc.exists) return doc.data()?.statistics || null;
        } catch (dbErr) { }
        return null;
    }
}

export async function getEventLineups(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/lineups`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    } catch (e) {
        // --- CLOUD FALLBACK ---
        try {
            const doc = await db.collection('match_details').doc(eventId.toString()).get();
            if (doc.exists) return doc.data()?.lineups || null;
        } catch (dbErr) { }
        return null;
    }
}

export async function getEventDetails(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    } catch (e) {
        // --- CLOUD FALLBACK ---
        try {
            const doc = await db.collection('match_details').doc(eventId.toString()).get();
            if (doc.exists) return doc.data()?.details || null;
        } catch (dbErr) { }
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
export async function syncToCloud(footballEvents: any[], cricketMatches: any[], standingsData: any = null) {
    try {
        // --- COMPACTION: Filter major leagues for the main list ---
        const filteredFootball = (footballEvents || [])
            .filter((e: any) => {
                const tourney = e.tournament?.name || "";
                return (
                    tourney.includes("Premier League") ||
                    tourney.includes("La Liga") ||
                    tourney.includes("Serie A") ||
                    tourney.includes("Bundesliga") ||
                    tourney.includes("Ligue 1") ||
                    tourney.includes("Champions League")
                );
            });

        const compactFootball = filteredFootball.map((e: any) => ({
            id: e.id || 0,
            homeTeam: {
                name: e.homeTeam?.name || 'Unknown',
                shortName: e.homeTeam?.shortName || e.homeTeam?.name || 'Unknown'
            },
            awayTeam: {
                name: e.awayTeam?.name || 'Unknown',
                shortName: e.awayTeam?.shortName || e.awayTeam?.name || 'Unknown'
            },
            homeScore: { display: e.homeScore?.display ?? 0 },
            awayScore: { display: e.awayScore?.display ?? 0 },
            status: {
                type: e.status?.type || 'notstarted',
                description: e.status?.description || 'Scheduled'
            },
            tournament: { name: e.tournament?.name || 'General' },
            startTimestamp: e.startTimestamp || null,
            lastPeriod: e.lastPeriod || null
        }));

        const compactCricket = (cricketMatches || [])
            .slice(0, 50)
            .map((e: any) => ({
                competitor: e.competitor || null,
                eventStatus: e.eventStatus || 'Scheduled',
                startDate: e.startDate || null,
                superEvent: e.superEvent || 'Cricket Match'
            }));

        // 1. Sync the main list + standings
        const resList = await fetch('/api/sports/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                football: compactFootball,
                cricket: compactCricket,
                standings: standingsData // <--- STANDINGS INCLUDED
            })
        });

        if (!resList.ok) throw new Error("List sync failed");

        // 2. Deep Sync: Stats and Lineups for the filtered matches (Parallelized Batching)
        console.log(`[DEEP SYNC] Turbo-Syncing telemetry for ${filteredFootball.length} matches...`);

        const BATCH_SIZE = 5;
        for (let i = 0; i < filteredFootball.length; i += BATCH_SIZE) {
            const batch = filteredFootball.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (event) => {
                try {
                    const stats = await getEventStatistics(event.id);
                    const lineups = await getEventLineups(event.id);
                    const details = await getEventDetails(event.id);

                    if (stats || lineups || details) {
                        await fetch('/api/sports/sync/details', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                eventId: event.id,
                                details: details || null,
                                statistics: stats || null,
                                lineups: lineups || null
                            })
                        });
                    }
                } catch (e) {
                    console.warn(`Deep sync failed for event ${event.id}`, e);
                }
            }));
            console.log(`[DEEP SYNC] Batch completed: ${Math.min(i + BATCH_SIZE, filteredFootball.length)}/${filteredFootball.length} matches...`);
        }

        console.log("🚀 [DEEP SYNC] COMPLETED. All snapshots pushed to Live Site.");
        return true;
    } catch (err) {
        console.error("Cloud Sync Error:", err);
        return false;
    }
}

// ─── PL STANDINGS SERVICE (Automated via Proxy) ──────────────────────────────

/**
 * Retrives League table from SofaScore via Proxy or Cloud Fallback
 */
export async function getLeagueTable(leagueName: string) {
    try {
        // Map common league names to SofaScore Unique Tournament and Season IDs for 24/25
        const leagueMap: Record<string, { id: number, season: number }> = {
            'Premier League': { id: 17, season: 61627 },
            'La Liga': { id: 8, season: 61643 },
            'Serie A': { id: 23, season: 61624 },
            'Bundesliga': { id: 35, season: 61659 },
            'Ligue 1': { id: 34, season: 61554 },
            'Champions League': { id: 7, season: 62121 } // 24/25 Swiss stage
        };

        const target = leagueMap[leagueName];
        if (!target) return null;

        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=${encodeURIComponent(`unique-tournament/${target.id}/season/${target.season}/standings/total`)}`);

        if (!res.ok) {
            throw new Error(`SofaScore proxy failed with status: ${res.status}`);
        }

        const data = await res.json();

        // Map SofaScore standings
        const standings = data.standings?.[0]?.rows || [];
        return standings.map((row: any) => {
            const team = row.team.shortName || row.team.name;
            const pos = row.position;
            const p = row.matches;
            const w = row.wins;
            const d = row.draws;
            const l = row.losses;
            const gd = row.goalsFor - row.goalsAgainst;
            const pts = row.points;
            return `${pos} | ${team} | P:${p} W:${w} D:${d} L:${l} GD:${gd >= 0 ? '+' : ''}${gd} PTS:${pts}`;
        });
    } catch (err) {
        console.warn(`Automated Table Error for ${leagueName}, switching to Cloud Fallback:`, err);

        // --- CLOUD FALLBACK ---
        try {
            const doc = await db.collection('globals').doc('sports').get();
            if (doc.exists) {
                const cloudData = doc.data();
                if (cloudData?.standings?.[leagueName]) {
                    return cloudData.standings[leagueName];
                }
            }
        } catch (dbErr) {
            console.error("Firebase standings fallback failed", dbErr);
        }

        return null;
    }
}

// ─── HELPERS FOR DEV SYNC ─────────────────────────────────────────────────────
export async function getRawSportsData(sport: 'football' | 'cricket') {
    const res = await fetch(`/api/sports/proxy?sport=${sport}&t=${Date.now()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return sport === 'football' ? data.events : data.matches;
}


