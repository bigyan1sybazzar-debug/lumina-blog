'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addLiveLink } from '../../services/db';
import {
    Radio, RefreshCw, ChevronDown, ChevronRight, Zap, Trophy, Search,
    CheckCircle, ExternalLink, Loader2, Tv, Globe, Star, Filter, Play,
    CheckSquare, Square, Rocket, AlertCircle, Info
} from 'lucide-react';

const STREAMED_BASE = 'https://streamed.pk';

interface StreamSource {
    source: string;
    id: string;
}

interface APIMatch {
    id: string;
    title: string;
    category: string;
    date: number; // unix ms
    poster?: string;
    sources: StreamSource[];
    teams?: { home?: { name: string; badge?: string }; away?: { name: string; badge?: string } };
    competition?: string;
}

interface StreamObj {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source: string;
}

const SPORT_COLORS: Record<string, string> = {
    football: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cricket: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    basketball: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    tennis: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    motorsport: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const getCategoryColor = (cat: string) =>
    SPORT_COLORS[cat?.toLowerCase()] ?? SPORT_COLORS.default;

export const StreamedMatchImporter: React.FC = () => {
    const [matches, setMatches] = useState<APIMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const [streams, setStreams] = useState<Record<string, StreamObj[]>>({});
    const [loadingStreams, setLoadingStreams] = useState<Record<string, boolean>>({});
    const [pushing, setPushing] = useState<Record<string, boolean>>({});
    const [pushed, setPushed] = useState<Record<string, boolean>>({});

    // Bulk Selection State
    const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    const loadMatches = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch live matches and major sport categories to ensure full schedule coverage
            const endpoints = ['live', 'football', 'cricket', 'basketball', 'tennis', 'motorsport'];
            const results = await Promise.all(
                endpoints.map(ep => fetch(`${STREAMED_BASE}/api/matches/${ep}`).then(r => r.ok ? r.json() : []))
            );

            // Flatten all matches
            const allMatches: APIMatch[] = results.flat();

            // Merge and deduplicate by ID
            const unique = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

            // Sort by date (nearest first)
            unique.sort((a, b) => (a.date || 0) - (b.date || 0));

            setMatches(unique);
        } catch (err) {
            console.error('StreamedMatchImporter: failed to load matches', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMatches(); }, [loadMatches]);

    const fetchStreamsForMatch = async (match: APIMatch) => {
        if (streams[match.id]) return streams[match.id];
        if (!match.sources?.length) return [];

        setLoadingStreams(prev => ({ ...prev, [match.id]: true }));
        const foundStreams: StreamObj[] = [];
        try {
            await Promise.all(match.sources.map(async (src) => {
                try {
                    const res = await fetch(`${STREAMED_BASE}/api/stream/${src.source}/${src.id}`);
                    if (!res.ok) return;
                    const data: StreamObj[] = await res.json();
                    foundStreams.push(...data);
                } catch { /* skip failed source */ }
            }));
        } catch (err) {
            console.error(`Failed to fetch streams for ${match.title}`, err);
        } finally {
            setStreams(prev => ({ ...prev, [match.id]: foundStreams }));
            setLoadingStreams(prev => ({ ...prev, [match.id]: false }));
        }
        return foundStreams;
    };

    const handleExpandMatch = async (match: APIMatch) => {
        if (expandedMatchId === match.id) {
            setExpandedMatchId(null);
        } else {
            setExpandedMatchId(match.id);
            await fetchStreamsForMatch(match);
        }
    };

    const handlePushToLive = async (match: APIMatch, stream: StreamObj) => {
        const key = `${match.id}-${stream.id}`;
        if (pushing[key]) return;

        setPushing(prev => ({ ...prev, [key]: true }));
        try {
            await addLiveLink({
                heading: match.title,
                iframeUrl: stream.embedUrl,
                youtubeUrl: stream.embedUrl,
                tags: [match.category || 'Sports'],
                isLive: true,
                isHLS: stream.embedUrl.includes('.m3u8'),
                isTrending: false,
                isDefault: false,
                createdAt: new Date().toISOString(),
                // Add match specific metadata for display
                matchStartTime: match.date ? new Date(match.date).toISOString() : undefined,
                status: 'active'
            } as any);
            setPushed(prev => ({ ...prev, [key]: true }));
            setTimeout(() => setPushed(prev => ({ ...prev, [key]: false })), 4000);
        } catch (err) {
            console.error('Push failed:', err);
            alert(`Failed to push stream for ${match.title}.`);
        } finally {
            setPushing(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleMatchSelection = (id: string) => {
        const newSelection = new Set(selectedMatchIds);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedMatchIds(newSelection);
    };

    const selectAllMatches = () => {
        if (selectedMatchIds.size === filtered.length) {
            setSelectedMatchIds(new Set());
        } else {
            setSelectedMatchIds(new Set(filtered.map(m => m.id)));
        }
    };

    const handleBulkPush = async () => {
        if (selectedMatchIds.size === 0) return;
        if (!confirm(`Are you sure you want to push/schedule ${selectedMatchIds.size} matches? This will pick the first available stream for each.`)) return;

        setIsBulkProcessing(true);
        const matchIdsArr = Array.from(selectedMatchIds);

        try {
            for (const mid of matchIdsArr) {
                const match = matches.find(m => m.id === mid);
                if (!match) continue;

                // 1. Get streams
                const matchStreams = await fetchStreamsForMatch(match);
                if (matchStreams.length > 0) {
                    // 2. Pick best stream (prefer HD, then first one)
                    const bestStream = matchStreams.find(s => s.hd) || matchStreams[0];
                    // 3. Push
                    await handlePushToLive(match, bestStream);
                }
            }
            alert('Bulk scheduling complete!');
            setSelectedMatchIds(new Set());
        } catch (err) {
            console.error('Bulk process error:', err);
            alert('An error occurred during bulk processing.');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Categories
    const categories = ['All', ...Array.from(new Set(matches.map(m => m.category).filter(Boolean)))];

    const filtered = matches.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl text-white shadow-lg shadow-red-600/20">
                            <Zap size={20} />
                        </div>
                        Smart Match Importer
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Browse, pick, and schedule live matches from across all sports instantly.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadMatches}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:border-red-500 hover:text-red-600 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh Schedule
                    </button>
                </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-2xl flex items-start gap-3">
                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 leading-relaxed">
                    <span className="font-black uppercase mr-1">Note:</span>
                    Please be patient — HD channels may take a moment to load here depending on the source availability.
                    Scheduled matches will be added with their start times automatically.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search teams, leagues, or sports..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm dark:text-white outline-none focus:border-red-500 transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    <Filter size={14} className="text-gray-400 shrink-0 ml-1" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-2 transition-all active:scale-95 ${selectedCategory === cat
                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-red-500'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selection Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 px-1">
                <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <button
                        onClick={selectAllMatches}
                        className="flex items-center gap-2 hover:text-red-500 transition-colors"
                    >
                        {selectedMatchIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
                        {selectedMatchIds.size === 0 ? 'Select All' : `Deselect (${selectedMatchIds.size})`}
                    </button>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                        </span>
                        {filtered.length} matches found
                    </span>
                </div>

                {selectedMatchIds.size > 0 && (
                    <button
                        onClick={handleBulkPush}
                        disabled={isBulkProcessing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {isBulkProcessing ? (
                            <><Loader2 size={13} className="animate-spin" /> Processing...</>
                        ) : (
                            <><Rocket size={13} /> Schedule Selected ({selectedMatchIds.size})</>
                        )}
                    </button>
                )}
            </div>

            {/* Match List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                    <div className="relative">
                        <Loader2 size={48} className="text-red-600 animate-spin" />
                        <Zap size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Synchronizing Schedule...</p>
                        <p className="text-xs text-gray-500 mt-2">Connecting to streams worldwide</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <Tv size={48} className="text-gray-200 dark:text-gray-700" />
                    <div className="text-center">
                        <p className="font-black text-xs text-gray-400 uppercase tracking-widest">No matches found for this period</p>
                        <button onClick={loadMatches} className="text-red-500 text-[10px] font-bold uppercase mt-2 hover:underline">Try Refreshing</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                    {filtered.map(match => {
                        const isExpanded = expandedMatchId === match.id;
                        const matchStreams = streams[match.id] || [];
                        const isLoadingStr = loadingStreams[match.id];
                        const matchDate = match.date ? new Date(match.date) : null;
                        const isSelected = selectedMatchIds.has(match.id);

                        // Check if it's currently live or scheduled
                        const isLiveNow = matchDate ? (Date.now() >= matchDate.getTime() && Date.now() <= matchDate.getTime() + (120 * 60000)) : false;

                        return (
                            <div
                                key={match.id}
                                className={`bg-white dark:bg-gray-800/80 rounded-2xl border-2 transition-all duration-300 overflow-hidden group ${isExpanded
                                    ? 'border-red-500 shadow-xl shadow-red-500/10 scale-[1.01]'
                                    : isSelected
                                        ? 'border-green-500/50 bg-green-50/10 dark:bg-green-900/5'
                                        : 'border-gray-100 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-stretch">
                                    {/* Selection Checkbox Area */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMatchSelection(match.id);
                                        }}
                                        className={`w-12 shrink-0 flex items-center justify-center border-r transition-colors ${isSelected ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'border-gray-50 dark:border-gray-800 text-gray-300 hover:text-red-500'}`}
                                    >
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </button>

                                    {/* Match Header Row */}
                                    <button
                                        onClick={() => handleExpandMatch(match)}
                                        className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 p-4 text-left"
                                    >
                                        {/* Sport badge & Time */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${getCategoryColor(match.category)}`}>
                                                {match.category || 'Sport'}
                                            </div>
                                            {isLiveNow ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-black uppercase">
                                                    <span className="flex h-1.5 w-1.5 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                                                    </span>
                                                    Live
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                                    {matchDate ? matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Title & meta */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-[13px] text-gray-900 dark:text-white truncate group-hover:text-red-500 transition-colors">{match.title}</h3>
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                                                {match.competition && (
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1 capitalize">
                                                        <Trophy size={10} className="text-amber-500" /> {match.competition.toLowerCase()}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                    <Globe size={10} className="text-blue-500" /> {match.sources?.length ?? 0} Source{match.sources?.length !== 1 ? 's' : ''}
                                                </span>
                                                {matchDate && (
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        {matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expand arrow */}
                                        <div className={`shrink-0 transition-transform duration-300 ml-auto hidden sm:block ${isExpanded ? 'rotate-90' : ''}`}>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </div>
                                    </button>
                                </div>

                                {/* Expanded Stream Picker */}
                                {isExpanded && (
                                    <div className="border-t-2 border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/30 px-5 pb-5 pt-4">
                                        {isLoadingStr ? (
                                            <div className="flex flex-col items-center py-6 gap-3">
                                                <Loader2 size={24} className="animate-spin text-red-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Searching active feeds...</span>
                                            </div>
                                        ) : matchStreams.length === 0 ? (
                                            <div className="flex flex-col items-center py-8 gap-3">
                                                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-full">
                                                    <AlertCircle size={24} className="text-red-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Streams not yet active</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Feeds usually appear 15-30 minutes before the event starts.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                        {matchStreams.length} Channel{matchStreams.length > 1 ? 's' : ''} Found
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-blue-500 uppercase tracking-tight">
                                                        <ExternalLink size={10} /> Live Proxy Enabled
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                    {matchStreams.map(stream => {
                                                        const key = `${match.id}-${stream.id}`;
                                                        const isPushing = pushing[key];
                                                        const isPushed = pushed[key];
                                                        return (
                                                            <div
                                                                key={stream.id}
                                                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-red-500/30"
                                                            >
                                                                {/* Stream info */}
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner ${stream.hd ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gray-400'}`}>
                                                                        <Play size={16} fill="white" className="ml-0.5" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-xs font-black text-gray-900 dark:text-white">
                                                                                Feed #{stream.streamNo}
                                                                            </span>
                                                                            {stream.hd && (
                                                                                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[8px] font-black rounded uppercase">Ultra HD</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                                            <span className="text-[9px] text-gray-400 font-bold uppercase">{stream.language || 'Multi-Lang'}</span>
                                                                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
                                                                            <span className="text-[9px] text-gray-500 font-black uppercase truncate">via {stream.source}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Preview link */}
                                                                <a
                                                                    href={stream.embedUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 dark:bg-gray-900 rounded-lg border border-transparent hover:border-blue-500/20"
                                                                    title="Preview Source"
                                                                >
                                                                    <ExternalLink size={14} />
                                                                </a>

                                                                {/* Push button */}
                                                                <button
                                                                    onClick={() => handlePushToLive(match, stream)}
                                                                    disabled={isPushing || isPushed}
                                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0 ${isPushed
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                                                        : 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30'
                                                                        }`}
                                                                >
                                                                    {isPushing ? (
                                                                        <><Loader2 size={12} className="animate-spin" /> Pushing...</>
                                                                    ) : isPushed ? (
                                                                        <><CheckCircle size={12} /> Live!</>
                                                                    ) : (
                                                                        <><Zap size={12} className="fill-white" /> Go Live</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Context Tooltip for mobile */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-gray-900/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full shadow-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Powered by Streamed.pk Global Network
                </div>
            </div>
        </div>
    );
};
