'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addLiveLink } from '../../services/db';
import {
    Radio, RefreshCw, ChevronDown, ChevronRight, Zap, Trophy, Search,
    CheckCircle, ExternalLink, Loader2, Tv, Globe, Star, Filter, Play
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

    const loadMatches = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch live matches and Basketball matches specifically to ensure schedule coverage
            const [liveRes, bballRes] = await Promise.all([
                fetch(`${STREAMED_BASE}/api/matches/live`),
                fetch(`${STREAMED_BASE}/api/matches/basketball`)
            ]);

            const liveData: APIMatch[] = liveRes.ok ? await liveRes.json() : [];
            const bballData: APIMatch[] = bballRes.ok ? await bballRes.json() : [];

            // Merge and deduplicate by ID
            const merged = [...liveData, ...bballData];
            const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());

            setMatches(unique);
        } catch (err) {
            console.error('StreamedMatchImporter: failed to load matches', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadMatches(); }, [loadMatches]);

    const loadStreams = async (match: APIMatch) => {
        if (streams[match.id]) return; // already loaded
        if (!match.sources?.length) return;
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
        } finally {
            setStreams(prev => ({ ...prev, [match.id]: foundStreams }));
            setLoadingStreams(prev => ({ ...prev, [match.id]: false }));
        }
    };

    const handleExpandMatch = async (match: APIMatch) => {
        if (expandedMatchId === match.id) {
            setExpandedMatchId(null);
        } else {
            setExpandedMatchId(match.id);
            await loadStreams(match);
        }
    };

    const handlePushToLive = async (match: APIMatch, stream: StreamObj) => {
        const key = `${match.id}-${stream.id}`;
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
            } as any);
            setPushed(prev => ({ ...prev, [key]: true }));
            setTimeout(() => setPushed(prev => ({ ...prev, [key]: false })), 4000);
        } catch (err) {
            console.error('Push failed:', err);
            alert('Failed to push stream to Live Section.');
        } finally {
            setPushing(prev => ({ ...prev, [key]: false }));
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-red-600 to-orange-500 rounded-xl text-white shadow-lg shadow-red-600/20">
                            <Radio size={20} />
                        </div>
                        Streamed.pk Live Importer
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Browse live matches and push any stream to your Live Section instantly.
                    </p>
                </div>
                <button
                    onClick={loadMatches}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:border-red-500 hover:text-red-600 transition-all shadow-sm"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search matches..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:border-red-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Filter size={14} className="text-gray-400 shrink-0" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap border-2 transition-all ${selectedCategory === cat
                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-red-500'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                    {filtered.length} live matches
                </span>
                <span>·</span>
                <span>{categories.length - 1} sports</span>
            </div>

            {/* Match List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 size={36} className="text-red-500 animate-spin" />
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fetching live matches...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                    <Tv size={48} className="opacity-30" />
                    <p className="font-bold text-sm uppercase tracking-widest">No matches found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(match => {
                        const isExpanded = expandedMatchId === match.id;
                        const matchStreams = streams[match.id] || [];
                        const isLoadingStr = loadingStreams[match.id];
                        const matchDate = match.date ? new Date(match.date) : null;

                        return (
                            <div
                                key={match.id}
                                className={`bg-white dark:bg-gray-800/80 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${isExpanded
                                    ? 'border-red-500 shadow-xl shadow-red-500/10'
                                    : 'border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
                                    }`}
                            >
                                {/* Match Header Row */}
                                <button
                                    onClick={() => handleExpandMatch(match)}
                                    className="w-full flex items-center gap-4 p-4 text-left"
                                >
                                    {/* Sport badge */}
                                    <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryColor(match.category)}`}>
                                        {match.category || 'Sport'}
                                    </div>

                                    {/* Title & meta */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{match.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {match.competition && (
                                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                    <Trophy size={9} /> {match.competition}
                                                </span>
                                            )}
                                            {matchDate && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                <Globe size={9} /> {match.sources?.length ?? 0} source{match.sources?.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expand arrow */}
                                    <div className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                                        <ChevronRight size={18} className="text-gray-400" />
                                    </div>
                                </button>

                                {/* Expanded Stream Picker */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3">
                                        {isLoadingStr ? (
                                            <div className="flex items-center gap-3 py-4 text-gray-400">
                                                <Loader2 size={16} className="animate-spin text-red-500" />
                                                <span className="text-xs font-bold uppercase tracking-widest">Loading streams...</span>
                                            </div>
                                        ) : matchStreams.length === 0 ? (
                                            <div className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                No streams available right now
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                                                    {matchStreams.length} stream{matchStreams.length > 1 ? 's' : ''} available — click to push to Live Section
                                                </p>
                                                {matchStreams.map(stream => {
                                                    const key = `${match.id}-${stream.id}`;
                                                    const isPushing = pushing[key];
                                                    const isPushed = pushed[key];
                                                    return (
                                                        <div
                                                            key={stream.id}
                                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700"
                                                        >
                                                            {/* Stream info */}
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${stream.hd ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gray-400'}`}>
                                                                    <Play size={12} fill="white" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-gray-900 dark:text-white">
                                                                            Stream #{stream.streamNo}
                                                                        </span>
                                                                        {stream.hd && (
                                                                            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[8px] font-black rounded uppercase">HD</span>
                                                                        )}
                                                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{stream.language}</span>
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-400 font-medium truncate">
                                                                        via <span className="font-bold capitalize">{stream.source}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Preview link */}
                                                            <a
                                                                href={stream.embedUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                                                title="Preview stream"
                                                            >
                                                                <ExternalLink size={13} />
                                                            </a>

                                                            {/* Push button */}
                                                            <button
                                                                onClick={() => handlePushToLive(match, stream)}
                                                                disabled={isPushing || isPushed}
                                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${isPushed
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700'
                                                                    : 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30'
                                                                    }`}
                                                            >
                                                                {isPushing ? (
                                                                    <><Loader2 size={10} className="animate-spin" /> Pushing...</>
                                                                ) : isPushed ? (
                                                                    <><CheckCircle size={10} /> Pushed!</>
                                                                ) : (
                                                                    <><Zap size={10} /> Go Live</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
