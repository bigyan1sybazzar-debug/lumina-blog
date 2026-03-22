'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Trophy,
    Calendar,
    Clock,
    Search,
    Filter,
    RefreshCw,
    ChevronRight,
    TrendingUp,
    Activity,
    Award,
    X,
    Info,
    Layout,
    BarChart3,
    Users,
    ChevronLeft,
    Flame,
    Zap,
} from 'lucide-react';

import {
    getLiveScores,
    LiveMatch,
    getEventStatistics,
    getEventLineups,
    getEventDetails,
    getCricketScores
} from '../../../services/livescore-data';

const LEAGUES = [
    "All Leagues", "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Champions League"
];

const SPORTS = [
    { id: 'football', label: 'Football', icon: Activity },
    { id: 'cricket', label: 'Cricket', icon: Trophy }
];

// --- SUB-COMPONENT: MATCH DETAIL MODAL ---
function MatchDetailModal({ match, onClose, sport }: { match: LiveMatch; onClose: () => void; sport: string }) {
    const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'lineups'>('info');
    const [stats, setStats] = useState<any>(null);
    const [lineups, setLineups] = useState<any>(null);
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sport === 'cricket') return;
        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'stats') {
                    const s = await getEventStatistics(match.id);
                    setStats(s);
                } else if (activeTab === 'lineups') {
                    const l = await getEventLineups(match.id);
                    setLineups(l);
                } else {
                    const d = await getEventDetails(match.id);
                    setDetails(d);
                }
            } catch (err) {
                console.error("Error fetching match detail:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, match.id, sport]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-[64px] transition-all overflow-y-auto">
            <div className="bg-[#0b0e14]/90 border border-red-600/20 w-full max-w-2xl rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
                {/* Modal Header */}
                <div className="bg-[#111622]/50 p-8 text-white relative border-b border-white/5">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-white/5 hover:bg-red-600 rounded-full transition-all text-white active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center space-x-2 bg-red-600/10 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-600/20">
                            <Trophy className="w-3 h-3" />
                            <span>{match.league}</span>
                        </div>

                        <div className="flex items-center justify-center gap-8 md:gap-12">
                            <div className="flex-1 text-right">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">{match.homeTeam}</h2>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-5xl md:text-6xl font-black tabular-nums text-white drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                    {match.homeScore} <span className="text-white/20">-</span> {match.awayScore}
                                </div>
                                <div className={`mt-4 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${match.category === 'LIVE' ? 'bg-red-600 text-white border-red-500 animate-pulse' : 'bg-white/5 text-slate-500 border-white/5'
                                    }`}>
                                    {match.status}
                                </div>
                            </div>

                            <div className="flex-1 text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">{match.awayTeam}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {sport === 'football' && (
                    <div className="flex border-b border-white/5 bg-[#0b0e14]">
                        {[
                            { id: 'info', label: 'Match Info', icon: Info },
                            { id: 'stats', label: 'Statistics', icon: BarChart3 },
                            { id: 'lineups', label: 'Lineups', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-red-600 text-red-500 bg-red-600/5'
                                    : 'border-transparent text-slate-500 hover:text-white'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 mb-1" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#0b0e14]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <RefreshCw className="w-10 h-10 text-red-600 animate-spin" />
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Updating Stats...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {sport === 'cricket' ? (
                                <div className="text-center py-12 space-y-6">
                                    <Trophy className="w-16 h-16 text-red-600/30 mx-auto" />
                                    <h3 className="text-2xl font-bold text-white">{match.league}</h3>
                                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl">
                                        <p className="text-xl font-bold text-red-500 italic">"{match.status}"</p>
                                    </div>
                                    <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em]">Live Scraper HUD v2.0</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {activeTab === 'info' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Match Venue</p>
                                                <p className="text-lg font-bold text-white">{details?.event?.venue?.name || 'Grand Arena'}</p>
                                                <p className="text-xs text-slate-500 mt-1">{details?.event?.venue?.city?.name || 'Metropolitan'}</p>
                                            </div>
                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lead Official</p>
                                                <p className="text-lg font-bold text-white">{details?.event?.referee?.name || 'TBA'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'stats' && (
                                        <div className="space-y-6">
                                            {stats?.statistics?.[0]?.groups?.map((group: any, idx: number) => (
                                                <div key={idx} className="space-y-4">
                                                    <h4 className="text-[10px] font-bold uppercase text-red-600 tracking-widest ml-1">{group.groupName}</h4>
                                                    <div className="space-y-4">
                                                        {group.statisticsItems.map((item: any, i: number) => {
                                                            const homeVal = parseFloat(item.homeValue) || 0;
                                                            const awayVal = parseFloat(item.awayValue) || 0;
                                                            const total = homeVal + awayVal;
                                                            const homePct = total === 0 ? 50 : (homeVal / total) * 100;
                                                            return (
                                                                <div key={i} className="space-y-2">
                                                                    <div className="flex justify-between items-end px-1">
                                                                        <span className="text-lg font-bold text-white">{item.homeValue}</span>
                                                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pb-1">{item.name}</span>
                                                                        <span className="text-lg font-bold text-white">{item.awayValue}</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-white/5 rounded-full flex overflow-hidden">
                                                                        <div className="bg-red-600 rounded-full h-full" style={{ width: `${homePct}%` }}></div>
                                                                        <div className="bg-slate-800 rounded-full h-full ml-auto" style={{ width: `${100 - homePct}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )) || (
                                                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/5">
                                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Stats Available Yet</p>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {activeTab === 'lineups' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {['home', 'away'].map((side) => (
                                                <div key={side} className="space-y-6">
                                                    <div className="inline-block px-4 py-1.5 rounded-lg bg-red-600/10 border border-red-600/20">
                                                        <h3 className="font-bold text-[10px] uppercase text-red-500 tracking-widest">
                                                            {side === 'home' ? match.homeTeam : match.awayTeam}
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {lineups?.[side]?.players?.slice(0, 11).map((p: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group">
                                                                <span className="w-8 h-8 rounded-lg bg-[#111622] flex items-center justify-center font-bold text-xs text-slate-500 group-hover:text-red-500 transition-all border border-white/5">{p.player.shirtNumber}</span>
                                                                <span className="font-bold text-sm text-slate-400 group-hover:text-white transition-colors">{p.player.shortName || p.player.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-8 bg-[#0b0e14] border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-2xl text-[10px] active:scale-95 transition-all shadow-xl"
                    >
                        Close Portal
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function LiveScorePage() {
    const [activeSport, setActiveSport] = useState("football");
    const [activeLeague, setActiveLeague] = useState("All Leagues");
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);

    const fetchMatches = useCallback(async (sport: string = activeSport) => {
        setIsRefreshing(true);
        setError(null);
        try {
            const data = sport === 'football' ? await getLiveScores() : await getCricketScores();
            if (data) setMatches(data);
        } catch (error: any) {
            console.error("Error fetching sports data:", error);
            setError(error.message || "Failed to sync scores");
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [activeSport]);

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(() => fetchMatches(), 60000);
        return () => clearInterval(interval);
    }, [fetchMatches]);

    const filteredMatches = matches.filter(match => {
        const matchesLeague = activeLeague === "All Leagues" || match.league === activeLeague;
        const matchesSearch = match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLeague && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#050608] text-slate-400 font-sans selection:bg-red-600/30">
            {selectedMatch && (
                <MatchDetailModal
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                    sport={activeSport}
                />
            )}

            {/* --- HERO SECTION --- (Match site design) */}
            <div className="relative pt-32 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-[400px] bg-red-600/5 blur-[120px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-14">
                        {SPORTS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setActiveSport(s.id); setLoading(true); setMatches([]); }}
                                className={`px-10 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 ${activeSport === s.id ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter uppercase mb-6 text-center">
                        LIVE<span className="text-red-600">SCORE</span>
                    </h1>
                    <p className="text-xs font-bold text-red-600/40 uppercase tracking-[0.5em] mb-16 text-center">Real-Time Global Sports Hub</p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="..."
                                className="w-full pl-14 pr-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-900 focus:outline-none focus:border-red-600/50 transition-all font-bold uppercase tracking-widest text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => fetchMatches()} className="p-5 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all">
                            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                {activeSport === 'football' && (
                    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-12 pt-4 px-2">
                        {LEAGUES.map((l) => (
                            <button
                                key={l}
                                onClick={() => setActiveLeague(l)}
                                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[9px] transition-all border ${activeLeague === l
                                    ? 'bg-red-600 text-white border-red-500 shadow-xl'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:text-white hover:border-white/10'
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                )}

                {/* MATCH LIST (Single Column) */}
                <div className="space-y-6">
                    {loading && filteredMatches.length === 0 ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[2rem] animate-pulse"></div>)}
                        </div>
                    ) : filteredMatches.length > 0 ? (
                        filteredMatches.map((match) => (
                            <div key={match.id} className={`bg-[#0b0e14] border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-red-600/30 ${match.category === 'LIVE' ? 'border-red-600/40 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'border-white/5'}`}>
                                {/* Match Header */}
                                <div className="px-10 py-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{match.league}</span>
                                    </div>
                                    {match.category === 'LIVE' && <span className="flex items-center gap-2 text-[9px] font-bold text-red-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div> LIVE NOW</span>}
                                </div>

                                {/* Match Body (Horizontal) */}
                                <div className="p-10 md:p-14">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                                        {/* Home Team */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center text-4xl md:text-6xl font-black text-red-500 italic shadow-2xl mb-4 group-hover:scale-110 transition-transform">
                                                {match.homeTeam.charAt(0)}
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight text-center">{match.homeTeam}</h3>
                                            <span className="text-[9px] font-bold text-slate-700 mt-2 uppercase tracking-widest">Home</span>
                                        </div>

                                        {/* Score / Center */}
                                        <div className="flex-none flex flex-col items-center">
                                            <div className="flex items-center gap-8 md:gap-14 mb-4">
                                                <span className="text-6xl md:text-8xl font-black text-white tabular-nums tracking-tighter">{match.homeScore}</span>
                                                <span className="text-2xl font-black text-slate-900">-</span>
                                                <span className="text-6xl md:text-8xl font-black text-white tabular-nums tracking-tighter">{match.awayScore}</span>
                                            </div>
                                            <div className={`px-6 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border ${match.category === 'LIVE' ? 'bg-red-600/10 text-red-500 border-red-600/20' : 'bg-white/5 text-slate-700 border-white/5'}`}>
                                                {match.status} {match.category === 'LIVE' && `| ${match.time}`}
                                            </div>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center text-4xl md:text-6xl font-black text-red-500 italic shadow-2xl mb-4 group-hover:scale-110 transition-transform">
                                                {match.awayTeam.charAt(0)}
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight text-center">{match.awayTeam}</h3>
                                            <span className="text-[9px] font-bold text-slate-700 mt-2 uppercase tracking-widest">Away</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="px-8 py-5 bg-[#111622]/30 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
                                    <div className="flex gap-4">
                                        <button onClick={() => setSelectedMatch(match)} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white transition-all border border-white/5"><BarChart3 className="w-4 h-4" /> Statistics</button>
                                        <button onClick={() => setSelectedMatch(match)} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-500 hover:text-white transition-all border border-white/5"><Users className="w-4 h-4" /> Lineups</button>
                                    </div>
                                    <button onClick={() => setSelectedMatch(match)} className="text-red-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">Match Detail <ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] group">
                            <Activity className={`w-20 h-20 mx-auto mb-6 transition-all ${error ? 'text-red-500/50' : 'text-slate-900 group-hover:text-red-600/20'}`} />
                            <h3 className="text-2xl font-bold text-white uppercase">
                                {error ? "Telemetrics Fault" : "Waiting for Matches"}
                            </h3>
                            <p className="text-xs text-slate-700 uppercase tracking-widest mt-2 px-6">
                                {error
                                    ? `Alert: ${error} - The provider is rejecting our feed request.`
                                    : (activeSport === 'football'
                                        ? "Scanning SofaScore telemetrics... Check back in a moment."
                                        : "Connecting to Cricbuzz satellites... Updates pending.")}
                            </p>
                            <button
                                onClick={() => fetchMatches()}
                                className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:bg-red-600/20 hover:border-red-600/30 transition-all"
                            >
                                {error ? "Re-establish Uplink" : "Force Refresh"}
                            </button>
                        </div>
                    )}
                </div>

                {/* --- SIDEBAR CONTENT BELOW --- */}
                <div className="mt-32 pt-20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Trending Section */}
                    <div className="bg-[#0b0e14] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                        <div className="flex items-center gap-3 mb-10 px-2">
                            <Award className="text-yellow-500 w-5 h-5" />
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Trending Series</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {(activeSport === 'football' ? LEAGUES.slice(1, 6) : ['T20 World Cup', 'IPL 2026', 'PSL 2026']).map((league, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-red-600/50 cursor-pointer transition-all">
                                    <div className="flex items-center gap-5">
                                        <span className="w-10 h-10 rounded-xl bg-[#111622] flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-red-600 group-hover:text-white transition-all">{i + 1}</span>
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-tight">{league}</span>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-red-600/30 group-hover:text-red-600 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Data Section */}
                    <div className="bg-gradient-to-br from-red-600 to-red-950 border border-white/5 rounded-[2.5rem] p-12 relative overflow-hidden group shadow-2xl flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] transition-transform duration-700 group-hover:scale-150"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
                                <Flame className="w-10 h-10 text-white fill-white animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4 italic text-glow">ELITE HUD</h4>
                                <p className="text-xs font-bold text-red-100 uppercase tracking-widest mb-10 opacity-70">Probability engine and advanced telemetry</p>
                                <button className="w-full py-5 bg-white text-red-600 font-bold uppercase tracking-[0.3em] rounded-2xl text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all">Go Professional</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .text-glow { text-shadow: 0 0 20px rgba(239,68,68,0.5); }
            `}</style>
        </div>
    );
}
