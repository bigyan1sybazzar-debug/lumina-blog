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

// Fetch live football scores from our proxy
export async function getLiveScores(): Promise<LiveMatch[]> {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&t=${Date.now()}`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${res.status}`);
        }
        const data = await res.json();

        const matches = (data.events || []).map((event: any) => {
            try {
                return mapSofaScoreToLiveMatch(event);
            } catch (err) {
                console.warn("Skipping malformed event:", event?.id);
                return null;
            }
        }).filter((m: any) => m !== null);

        console.log(`Live Score Service: Mapped ${matches.length} football matches`);

        // Sort: Live first, then by priority league, then by status
        return (matches as LiveMatch[]).sort((a: LiveMatch, b: LiveMatch) => {
            // Live matches always top
            if (a.category === 'LIVE' && b.category !== 'LIVE') return -1;
            if (a.category !== 'LIVE' && b.category === 'LIVE') return 1;

            // Then priority leagues
            const aPriority = PRIORITY_LEAGUES.some(l => a.league.includes(l));
            const bPriority = PRIORITY_LEAGUES.some(l => b.league.includes(l));

            if (aPriority && !bPriority) return -1;
            if (!aPriority && bPriority) return 1;

            // Otherwise keep original (usually temporal)
            return 0;
        });
    } catch (e) {
        console.error("Live Score Service Error:", e);
        return [];
    }
}

// Fetch statistics for a specific match
export async function getEventStatistics(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/statistics`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Event Statistics Error:", e);
        return null;
    }
}

// Fetch lineups for a specific match
export async function getEventLineups(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}/lineups`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Event Lineups Error:", e);
        return null;
    }
}

// Fetch full event details
export async function getEventDetails(eventId: number) {
    try {
        const res = await fetch(`/api/sports/proxy?sport=football&endpoint=event/${eventId}`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (e) {
        console.error("Event Details Error:", e);
        return null;
    }
}

// Fetch live cricket scores from Cricbuzz scraper
export async function getCricketScores(): Promise<LiveMatch[]> {
    try {
        const res = await fetch(`/api/sports/proxy?sport=cricket&t=${Date.now()}`);
        if (!res.ok) throw new Error('Failed to fetch cricket scores');
        const data = await res.json();

        if (!data.matches || !Array.isArray(data.matches)) return [];

        // Map Cricbuzz LD+JSON format to our LiveMatch structure
        return data.matches.map((item: any, idx: number) => {
            const event = item; // This is a SportsEvent in LD+JSON
            const team1 = event.competitor?.[0]?.name || 'Team 1';
            const team2 = event.competitor?.[1]?.name || 'Team 2';

            return {
                id: 99000 + idx, // Fake ID for cricket
                homeTeam: team1,
                awayTeam: team2,
                homeScore: 0, // Cricbuzz LD+JSON doesn't always have live score in a split field
                awayScore: 0,
                status: event.eventStatus || 'Scheduled',
                time: event.startDate ? new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
                league: event.superEvent || 'International Cricket',
                category: event.eventStatus?.toLowerCase().includes('won') ? 'FINISHED' :
                    (event.eventStatus?.toLowerCase().includes('opt') || event.eventStatus?.toLowerCase().includes('need')) ? 'LIVE' : 'UPCOMING'
            } as LiveMatch;
        });
    } catch (e) {
        console.error("Cricket Score Service Error:", e);
        return [];
    }
}
