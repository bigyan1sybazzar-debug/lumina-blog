'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Trophy, Calendar, Clock, Search, RefreshCw,
    Activity, X, Info, BarChart3, Users, Zap,
    TrendingUp, ArrowLeft, CircleDot, History,
    ChevronRight, Filter
} from 'lucide-react';
import Link from 'next/link';
import GoogleAdSense from '../../../components/GoogleAdSense';

import {
    getLiveScores,
    LiveMatch,
    getEventStatistics,
    getEventLineups,
    getEventDetails,
    getCricketScores,
    syncToCloud,
    getRawSportsData
} from '../../../services/livescore-data';

// ─── Live Clock (hydration safe) ──────────────────────────────────────────────
const LiveClock = React.memo(() => {
    const [now, setNow] = useState<Date | null>(null);
    useEffect(() => {
        setNow(new Date());
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    if (!now) return null;
    return (
        <span className="text-white text-[10px] font-mono font-bold">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
});
LiveClock.displayName = 'LiveClock';

// ─── Utility: League color accent ─────────────────────────────────────────────
function getLeagueAccent(league: string) {
    if (!league) return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
    if (league.includes('Premier League')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
    if (league.includes('La Liga')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
    if (league.includes('Champions League')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
    if (league.includes('Serie A')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
    if (league.includes('Bundesliga')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    if (league.includes('Ligue 1')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
    if (league.includes('Europa')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
    return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
}

// ─── Sub-Component: Match Detail Modal ───────────────────────────────────────
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
                    setStats(await getEventStatistics(match.id));
                } else if (activeTab === 'lineups') {
                    setLineups(await getEventLineups(match.id));
                } else {
                    setDetails(await getEventDetails(match.id));
                }
            } catch (err) {
                console.error('Match detail error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab, match.id, sport]);

    const modalTabs = [
        { id: 'info', label: 'Match Info', icon: Info },
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
        { id: 'lineups', label: 'Lineups', icon: Users },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
            <div className="bg-white dark:bg-surface-dark-900 border border-gray-200 dark:border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">

                {/* Modal Header */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 p-6 md:p-8 relative border-b border-gray-100 dark:border-white/5">
                    <button onClick={onClose} className="absolute top-5 right-5 p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-red-500 hover:text-white text-gray-500 dark:text-gray-400 rounded-2xl transition-all active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="text-center space-y-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getLeagueAccent(match.league)}`}>
                            <Trophy size={9} /> {match.league}
                        </span>
                        <div className="flex items-center justify-center gap-4 md:gap-12">
                            <div className="flex-1 text-right">
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate">{match.homeTeam}</h2>
                            </div>
                            <div className="flex flex-col items-center gap-2 px-4">
                                <div className="text-4xl md:text-6xl font-black tabular-nums text-gray-900 dark:text-white">
                                    {match.homeScore} <span className="text-gray-200 dark:text-gray-800">-</span> {match.awayScore}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${match.category === 'LIVE' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30 animate-pulse' : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/10'}`}>
                                    {match.status}
                                </span>
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white truncate">{match.awayTeam}</h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Indicator */}
                {sport === 'football' && (
                    <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50">
                        {modalTabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === t.id ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-white dark:bg-surface-dark-900' : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Modal Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-surface-dark-900">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCw className="w-10 h-10 text-primary-600 animate-spin" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Loading Analytics...</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500">
                            {sport === 'cricket' ? (
                                <div className="text-center py-10 space-y-4">
                                    <Trophy size={64} className="mx-auto text-primary-100 dark:text-primary-900/30" />
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{match.league}</h3>
                                    <div className="p-8 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl">
                                        <p className="text-base font-bold text-primary-600 italic">"{match.status}"</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {activeTab === 'info' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Venue', value: details?.event?.venue?.name || 'Grand Arena', sub: details?.event?.venue?.city?.name },
                                                { label: 'Referee', value: details?.event?.referee?.name || 'TBA' }
                                            ].map(i => (
                                                <div key={i.label} className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{i.label}</p>
                                                    <p className="text-base font-black text-gray-900 dark:text-white">{i.value}</p>
                                                    {i.sub && <p className="text-xs text-gray-400 mt-0.5">{i.sub}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {activeTab === 'stats' && (
                                        <div className="space-y-6">
                                            {stats?.statistics?.[0]?.groups?.map((group: any, idx: number) => (
                                                <div key={idx} className="space-y-3">
                                                    <h4 className="text-[10px] font-black uppercase text-primary-600 tracking-widest border-l-2 border-primary-600 pl-2">{group.groupName}</h4>
                                                    <div className="space-y-4">
                                                        {group.statisticsItems.map((item: any, i: number) => {
                                                            const homeVal = parseFloat(item.homeValue) || 0;
                                                            const total = homeVal + (parseFloat(item.awayValue) || 0);
                                                            const homePct = total === 0 ? 50 : (homeVal / total) * 100;
                                                            return (
                                                                <div key={i} className="space-y-1.5">
                                                                    <div className="flex justify-between items-center px-1">
                                                                        <span className="text-base font-black text-gray-900 dark:text-white">{item.homeValue}</span>
                                                                        <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                                                                        <span className="text-base font-black text-gray-900 dark:text-white">{item.awayValue}</span>
                                                                    </div>
                                                                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full flex overflow-hidden">
                                                                        <div className="bg-primary-600 h-full rounded-full" style={{ width: `${homePct}%` }} />
                                                                        <div className="bg-gray-200 dark:bg-gray-800 h-full rounded-full ml-auto" style={{ width: `${100 - homePct}%` }} />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )) || (
                                                    <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-100 dark:border-white/10">
                                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Stats Available Yet</p>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {activeTab === 'lineups' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {['home', 'away'].map(side => (
                                                <div key={side} className="space-y-4">
                                                    <div className="inline-block px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/30">
                                                        <h3 className="font-black text-[10px] uppercase text-primary-600 dark:text-primary-400 tracking-widest">
                                                            {side === 'home' ? match.homeTeam : match.awayTeam}
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {lineups?.[side]?.players?.slice(0, 11).map((p: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl group transition-all">
                                                                <span className="w-8 h-8 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 flex items-center justify-center font-black text-xs text-gray-400 group-hover:text-primary-600">{p.player.shirtNumber}</span>
                                                                <span className="font-bold text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate">{p.player.shortName || p.player.name}</span>
                                                            </div>
                                                        )) || <p className="text-gray-400 text-[10px] font-black uppercase py-8 text-center bg-gray-100 dark:bg-gray-900/50 rounded-2xl">Lineup Pending</p>}
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

                {/* Footer Button Cell */}
                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-white/10">
                    <button onClick={onClose} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-[0.2em] rounded-2xl text-[10px] shadow-xl hover:bg-primary-600 dark:hover:bg-primary-50 active:scale-95 transition-all">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Component: Match Card (Premium Grid Style) ─────────────────────────
const MatchCard = React.memo(({ match, onSelect, sport }: { match: LiveMatch; onSelect: (m: LiveMatch) => void; sport: string }) => {
    const isLive = match.category === 'LIVE';
    const isFinished = match.category === 'FINISHED';
    const leagueAccent = getLeagueAccent(match.league);

    return (
        <div className={`group relative bg-white dark:bg-surface-dark-900 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${isLive ? 'border-primary-500/50 ring-1 ring-primary-500/10 shadow-xl' : 'border-slate-200 dark:border-white/5 hover:border-primary-500/30 hover:shadow-xl'}`}>
            {isLive && <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />}

            {/* Upper Badge Line */}
            <div className="px-5 md:px-8 pt-5 md:pt-6 flex justify-between items-center">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${leagueAccent}`}>
                    <Trophy size={9} /> {match.league.length > 24 ? match.league.slice(0, 24) + '…' : match.league}
                </span>
                {isLive && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[9px] font-black uppercase animate-pulse border border-red-200 dark:border-red-800/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                        LIVE {match.status && `· ${match.status}`}
                    </span>
                )}
                {isFinished && <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 text-[9px] font-black uppercase border border-gray-200 dark:border-white/10">FT</span>}
                {!isLive && !isFinished && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase border border-blue-200 dark:border-blue-800/30">
                        <Clock size={9} /> {match.status}
                    </span>
                )}
            </div>

            {/* Score Content Area */}
            <div className="p-5 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl font-black italic shadow-lg ${isLive ? 'bg-gradient-to-br from-primary-600 to-orange-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                            {match.homeTeam[0]}
                        </div>
                        <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight text-center truncate w-full">{match.homeTeam}</h3>
                    </div>
                    <div className="flex-none flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4 md:gap-8">
                            <span className={`text-4xl md:text-6xl font-black tabular-nums tracking-tighter ${isLive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                {match.homeScore}
                            </span>
                            <span className="text-xl md:text-2xl font-black text-gray-200 dark:text-gray-800">—</span>
                            <span className={`text-4xl md:text-6xl font-black tabular-nums tracking-tighter ${isLive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                {match.awayScore}
                            </span>
                        </div>
                        {isLive && match.time && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Activity size={9} className="animate-pulse" /> {match.time}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center text-2xl md:text-3xl font-black italic bg-gray-100 dark:bg-white/5 text-gray-400 shadow-lg">
                            {match.awayTeam[0]}
                        </div>
                        <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight text-center truncate w-full">{match.awayTeam}</h3>
                    </div>
                </div>
            </div>

            {/* Bottom Panel Actions */}
            <div className="px-5 md:px-8 pb-5 md:pb-6 pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => onSelect(match)} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-[9px] font-black text-gray-400 transition-all border border-gray-100 dark:border-white/5">
                        <BarChart3 size={12} /> Analytics
                    </button>
                </div>
                <button onClick={() => onSelect(match)} className="text-primary-600 dark:text-primary-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:translate-x-1 transition-all">
                    Details <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
});
MatchCard.displayName = 'MatchCard';

// ─── Main Page Export ────────────────────────────────────────────────────────
const SPORTS = [
    { id: 'football', label: 'Football', icon: Activity },
    { id: 'cricket', label: 'Cricket', icon: Trophy },
];

const LEAGUES = [
    'All Leagues', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League'
];

export default function LiveScorePage() {
    const [activeSport, setActiveSport] = useState('football');
    const [activeLeague, setActiveLeague] = useState('All Leagues');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncToCloud = async () => {
        setIsSyncing(true);
        try {
            const football = await getRawSportsData('football');
            const cricket = await getRawSportsData('cricket');
            if (football || cricket) {
                const success = await syncToCloud(football || [], cricket || []);
                if (success) alert('🚀 ProSync: Cloud telemetry updated!');
            }
        } catch (err) {
            console.error('ProSync error:', err);
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchMatches = useCallback(async (sport: string = activeSport) => {
        setIsRefreshing(true);
        setError(null);
        try {
            const data = sport === 'football' ? await getLiveScores() : await getCricketScores();
            if (data) setMatches(data);
        } catch (err: any) {
            setError(err.message || 'Scraper uplink failed');
        } finally {
            setIsRefreshing(false);
            setLoading(false);
        }
    }, [activeSport]);

    useEffect(() => {
        fetchMatches();
        const interval = setInterval(() => fetchMatches(), 30000);
        return () => clearInterval(interval);
    }, [fetchMatches]);

    const filteredMatches = useMemo(() => matches.filter(m => {
        const matchesLeague = activeLeague === 'All Leagues' || m.league === activeLeague;
        const matchesSearch = !searchQuery || m.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) || m.awayTeam.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLeague && matchesSearch;
    }), [matches, activeLeague, searchQuery]);

    const liveCount = matches.filter(m => m.category === 'LIVE').length;

    return (
        <section className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
            {/* Ambient Background UI */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary-light/5 via-transparent opacity-40 pointer-events-none" />

            {selectedMatch && <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} sport={activeSport} />}

            <div className="pt-0 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="space-y-6 md:space-y-8">

                    {/* ──── Unified Status Banner ──── */}
                    <div className="bg-emerald-500/5 border-emerald-500/20 border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                                <CircleDot size={20} />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Global sports telemetry auto-refresh every 30s. Synchronized baseline.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 sm:ml-auto shrink-0">
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-600 rounded-full shadow-lg shadow-red-600/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                <span className="text-white text-[10px] font-black uppercase tracking-wider">
                                    {liveCount > 0 ? `${liveCount} LIVE` : 'Live'}
                                </span>
                            </div>
                            <LiveClock />
                        </div>
                    </div>

                    {/* Top Ad Cell */}
                    <div className="w-full flex justify-center !mt-4 !mb-4 min-h-[50px]">
                        <GoogleAdSense slot="7838572857" format="horizontal" minHeight="50px" style={{ width: '100%', height: '50px' }} />
                    </div>

                    {/* ──── Hero Header Area ──── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Link href="/" className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-primary-500 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md transition-colors shadow-sm">
                                    <ArrowLeft size={10} className="mr-1" /> Home
                                </Link>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                Live <span className="text-primary-600 underline decoration-red-600/20 underline-offset-8 decoration-4">Score</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-4 ml-1">
                                Reality Engine • Global Hub • V2.5
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-start md:self-auto">
                            <button onClick={() => fetchMatches()} disabled={isRefreshing} className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:border-primary-500/50 hover:text-primary-600 transition-all shadow-xl disabled:opacity-50">
                                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                                {isRefreshing ? 'Loading…' : 'Refresh'}
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <button onClick={handleSyncToCloud} disabled={isSyncing} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 hover:scale-105 active:scale-95 transition-all">
                                    <Zap size={14} className={isSyncing ? 'animate-pulse' : ''} />
                                    Push To Cloud
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ──── Unified Sticky Toolbar ──── */}
                    <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl py-5 -mx-4 px-4 md:mx-0 md:px-0 border-b border-gray-200/50 dark:border-white/5 shadow-sm transition-all">
                        <div className="flex flex-col gap-5 max-w-7xl mx-auto">

                            {/* Toolbar Top: Sports Switch + Search */}
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {SPORTS.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => { setActiveSport(s.id); setLoading(true); setMatches([]); setActiveLeague('All Leagues'); }}
                                            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 shadow-sm ${activeSport === s.id ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-white/5 hover:border-primary-500/50'}`}
                                        >
                                            <s.icon size={13} /> {s.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search events, teams..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent rounded-[1.25rem] text-sm outline-none dark:text-white focus:border-red-600/30 focus:bg-white dark:focus:bg-gray-800 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Toolbar Bottom: League Filters (Football only) */}
                            {activeSport === 'football' && (
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {LEAGUES.map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setActiveLeague(l)}
                                            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeLeague === l ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-white/5 shadow-sm'}`}
                                        >
                                            {l === 'All Leagues' ? '🌍 Global' : l}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ──── Data Grid State: Loading ──── */}
                    {loading && (
                        <div className="space-y-8 animate-pulse">
                            <div className="w-full h-40 bg-gray-100 dark:bg-white/5 rounded-[2.5rem]" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 dark:bg-white/5 rounded-[2rem]" />)}
                            </div>
                        </div>
                    )}

                    {/* ──── Data Grid State: Results ──── */}
                    {!loading && filteredMatches.length > 0 && (
                        <div className="space-y-10">
                            {/* Grid Section Header */}
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-5">
                                <div className="w-2 h-8 bg-red-600 rounded-full" />
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    {activeSport === 'football' ? 'Football Uplink' : 'Cricket Telemetry'}
                                </h2>
                                <span className="ml-auto px-3 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-black rounded-lg uppercase tracking-widest">
                                    {filteredMatches.length} NODES
                                </span>
                            </div>

                            <div className="space-y-8">
                                {Array.from({ length: Math.ceil(filteredMatches.length / 8) }, (_, i) => {
                                    const chunk = filteredMatches.slice(i * 8, i * 8 + 8);
                                    return (
                                        <React.Fragment key={i}>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-8">
                                                {chunk.map(m => (
                                                    <MatchCard
                                                        key={m.id}
                                                        match={m}
                                                        onSelect={setSelectedMatch}
                                                        sport={activeSport}
                                                    />
                                                ))}
                                            </div>
                                            {/* intermediate ad injection */}
                                            {i < Math.ceil(filteredMatches.length / 8) - 1 && (
                                                <div className="w-full flex justify-center py-4 min-h-[50px]">
                                                    <GoogleAdSense slot="7838572857" format="horizontal" minHeight="50px" style={{ width: '100%', height: '50px' }} />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ──── Data Grid State: Empty/Error ──── */}
                    {!loading && filteredMatches.length === 0 && (
                        <div className="py-24 text-center bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center">
                            <Activity size={80} className="text-gray-100 dark:text-gray-800 mb-6" />
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest underline decoration-primary-600/30 underline-offset-8">No Uplink Established</h3>
                            <p className="text-gray-400 font-bold text-sm mt-4 uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
                                {error || 'Scanning satellites for live events. Telemetry update pending.'}
                            </p>
                            <button onClick={() => fetchMatches()} className="mt-8 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                Force Re-establish
                            </button>
                        </div>
                    )}

                    {/* Bottom Bottom Ad Cell */}
                    {!loading && filteredMatches.length > 0 && (
                        <div className="w-full flex justify-center py-4 min-h-[50px]">
                            <GoogleAdSense slot="7838572857" format="horizontal" minHeight="50px" style={{ width: '100%', height: '50px' }} />
                        </div>
                    )}

                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </section>
    );
}
