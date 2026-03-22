'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Loader2, RefreshCw, Trophy, Calendar, History,
  ChevronRight, Activity, Search, Clock, Zap,
  Globe, Shield, Star, Filter, TrendingUp, ArrowLeft,
  Flag, CircleDot
} from 'lucide-react';
import Link from 'next/link';
import GoogleAdSense from '../components/GoogleAdSense';
import { getLiveScores, LiveMatch } from '../services/livescore-data';

type Tab = 'live' | 'upcoming' | 'finished';

// --- Live Ticker Clock (client-only to avoid hydration mismatch) ---
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


// --- Score Badge ---
const ScoreBadge = ({ score, isLive }: { score: number; isLive: boolean }) => (
  <span
    className={`text-2xl md:text-3xl font-black tabular-nums transition-all duration-300 ${isLive
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-900 dark:text-white'
      }`}
  >
    {score}
  </span>
);

// --- League Badge ---
const getLeagueAccent = (league: string) => {
  if (league.includes('Premier League')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
  if (league.includes('La Liga')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
  if (league.includes('Champions League')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
  if (league.includes('Serie A')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
  if (league.includes('Bundesliga')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
  if (league.includes('Ligue 1')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
  if (league.includes('Europa')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
  return 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10';
};

// --- Match Card (Live Section style) ---
const MatchCard = React.memo(({ match }: { match: LiveMatch }) => {
  const isLive = match.category === 'LIVE';
  const isFinished = match.category === 'FINISHED';
  const leagueAccent = getLeagueAccent(match.league);

  return (
    <div className={`group relative bg-white dark:bg-surface-dark-900 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 overflow-hidden flex flex-col justify-between
            ${isLive
        ? 'border-primary-500/50 ring-1 ring-primary-500/10 shadow-xl shadow-primary-500/5'
        : 'border-slate-200 dark:border-white/5 hover:border-primary-500/30 hover:shadow-xl hover:shadow-black/5'
      }`}>

      {/* Live pulse glow */}
      {isLive && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Top: League + Status */}
      <div className="px-4 pt-4 md:px-6 md:pt-6 flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${leagueAccent}`}>
            <Trophy size={9} />
            {match.league.length > 22 ? match.league.slice(0, 22) + '…' : match.league}
          </span>
        </div>

        {isLive && (
          <span className="flex items-center gap-1.5 shrink-0 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-wide animate-pulse border border-red-200 dark:border-red-800/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
            </span>
            {match.status || 'LIVE'}
          </span>
        )}
        {isFinished && (
          <span className="shrink-0 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-wide border border-gray-200 dark:border-white/10">
            FT
          </span>
        )}
        {!isLive && !isFinished && (
          <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wide border border-blue-200 dark:border-blue-800/30">
            <Clock size={9} />
            {match.status}
          </span>
        )}
      </div>

      {/* Score section */}
      <div className="px-4 md:px-6 py-5 md:py-8 flex flex-col gap-3 md:gap-5 flex-1">
        {/* Home */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isLive
              ? 'bg-gradient-to-br from-primary-600 to-orange-500 text-white'
              : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
              }`}>
              {match.homeTeam[0]}
            </div>
            <h4 className="font-black text-sm md:text-base text-gray-900 dark:text-white truncate">
              {match.homeTeam}
            </h4>
          </div>
          <ScoreBadge score={match.homeScore} isLive={isLive} />
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
          <span className="text-[9px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-widest px-1">VS</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
        </div>

        {/* Away */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
              {match.awayTeam[0]}
            </div>
            <h4 className="font-black text-sm md:text-base text-gray-900 dark:text-white truncate">
              {match.awayTeam}
            </h4>
          </div>
          <ScoreBadge score={match.awayScore} isLive={isLive} />
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-3 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
        <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">
          {match.time}
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <Activity size={9} className="animate-pulse" /> Live
          </span>
        )}
      </div>
    </div>
  );
});
MatchCard.displayName = 'MatchCard';

// --- Skeleton Card ---
const SkeletonCard = () => (
  <div className="bg-white dark:bg-surface-dark-900 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-5 md:p-8 space-y-5 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-4 w-28 bg-gray-100 dark:bg-white/10 rounded-lg" />
      <div className="h-4 w-14 bg-red-100 dark:bg-red-900/20 rounded-full" />
    </div>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10" />
          <div className="h-4 w-24 bg-gray-100 dark:bg-white/10 rounded-lg" />
        </div>
        <div className="h-7 w-8 bg-gray-100 dark:bg-white/10 rounded-lg" />
      </div>
      <div className="h-px bg-gray-100 dark:bg-white/5" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10" />
          <div className="h-4 w-20 bg-gray-100 dark:bg-white/10 rounded-lg" />
        </div>
        <div className="h-7 w-8 bg-gray-100 dark:bg-white/10 rounded-lg" />
      </div>
    </div>
    <div className="h-px bg-gray-50 dark:bg-white/5" />
    <div className="h-3 w-16 bg-gray-100 dark:bg-white/10 rounded-full" />
  </div>
);

// --- Main Page ---
const LiveFootball: React.FC = () => {
  const [tab, setTab] = useState<Tab>('live');
  const [allMatches, setAllMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMatches = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLiveScores();
      setAllMatches(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Live Score Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(() => fetchMatches(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter by tab
  const tabMatches = useMemo(() => {
    return allMatches.filter(m => {
      if (tab === 'live') return m.category === 'LIVE';
      if (tab === 'upcoming') return m.category === 'UPCOMING';
      if (tab === 'finished') return m.category === 'FINISHED';
      return true;
    });
  }, [allMatches, tab]);

  // Get league list for filters
  const leagues = useMemo(() => {
    const all = Array.from(new Set(tabMatches.map(m => m.league))).sort();
    return ['All', ...all];
  }, [tabMatches]);

  // Filter by search + league
  const filteredMatches = useMemo(() => {
    return tabMatches.filter(m => {
      const matchesSearch = search.trim() === '' ||
        m.homeTeam.toLowerCase().includes(search.toLowerCase()) ||
        m.awayTeam.toLowerCase().includes(search.toLowerCase()) ||
        m.league.toLowerCase().includes(search.toLowerCase());
      const matchesLeague = leagueFilter === 'All' || m.league === leagueFilter;
      return matchesSearch && matchesLeague;
    });
  }, [tabMatches, search, leagueFilter]);

  // Counts
  const liveCount = allMatches.filter(m => m.category === 'LIVE').length;
  const upcomingCount = allMatches.filter(m => m.category === 'UPCOMING').length;
  const finishedCount = allMatches.filter(m => m.category === 'FINISHED').length;

  const tabs = [
    { id: 'live' as Tab, label: 'Live', icon: Activity, count: liveCount, pulse: true },
    { id: 'upcoming' as Tab, label: 'Upcoming', icon: Calendar, count: upcomingCount, pulse: false },
    { id: 'finished' as Tab, label: 'Finished', icon: History, count: finishedCount, pulse: false },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
      {/* Background deco blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-light/5 via-transparent opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

      <div className="pt-0 pb-8 md:pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-6 md:space-y-8">

          {/* --- TOP STATUS BAR (same as LiveSection) --- */}
          <div className="bg-accent-success/5 border-accent-success/20 border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-accent-success/20 flex items-center justify-center text-accent-success shrink-0">
                <CircleDot size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Live scores refresh every 30 seconds. Scores sourced from live data.
                </p>
              </div>
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

          {/* --- AD --- */}
          <div className="w-full flex justify-center items-center overflow-hidden !mt-2 !mb-2" style={{ minHeight: '50px' }}>
            <GoogleAdSense
              slot="7838572857"
              format="horizontal"
              responsive={false}
              minHeight="50px"
              fallbackImage="/cover.png"
              style={{ width: '100%', height: '50px' }}
            />
          </div>

          {/* --- HERO HEADER --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link
                  href="/"
                  className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-primary-500 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md transition-colors"
                >
                  <ArrowLeft size={10} className="mr-1" /> Home
                </Link>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                Live <span className="text-primary-600">Scores</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                Football Hub • Global Updates • Real-Time Data
              </p>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchMatches(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:border-primary-500/50 hover:text-primary-600 transition-all shadow-sm disabled:opacity-50 self-start md:self-auto"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* --- TAB BAR (same style as LiveSection filter tabs) --- */}
          <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 via-gray-50/95 to-gray-50/80 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-gray-200/50 dark:border-white/5 shadow-sm md:shadow-none transition-all duration-300">
            <div className="flex flex-col gap-4 max-w-7xl mx-auto">

              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setLeagueFilter('All'); setSearch(''); }}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${tab === t.id
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20 active:scale-95'
                      : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-white'
                      }`}
                  >
                    <t.icon size={12} className={t.pulse && tab === t.id ? 'animate-pulse' : ''} />
                    {t.label}
                    {t.count > 0 && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${tab === t.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                        }`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search + League filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Search teams, leagues..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl text-sm outline-none dark:text-white focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm placeholder:text-gray-400 font-medium"
                  />
                </div>

                {/* League filter pills - scrollable */}
                {leagues.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:max-w-sm md:max-w-lg">
                    {leagues.slice(0, 8).map(league => (
                      <button
                        key={league}
                        onClick={() => setLeagueFilter(league)}
                        className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${leagueFilter === league
                          ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                          : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:border-primary-500/50 hover:text-primary-500'
                          }`}
                      >
                        {league === 'All' ? '🌍 All' : league.length > 16 ? league.slice(0, 16) + '…' : league}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- LOADING STATE --- */}
          {loading && (
            <div className="space-y-6">
              <div className="w-full min-h-[200px] flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800 backdrop-blur-sm">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-red-100 dark:border-red-900/30 border-t-red-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={24} className="text-red-600 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] animate-pulse">Loading Live Scores</h3>
                <p className="text-sm text-gray-500 font-medium mt-2">Connecting to sports data servers...</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {/* --- EMPTY STATE --- */}
          {!loading && filteredMatches.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex flex-col items-center">
              <Trophy className="text-gray-200 dark:text-gray-800 mb-4" size={64} />
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {tab === 'live' ? 'No Live Matches' : tab === 'upcoming' ? 'No Upcoming Matches' : 'No Finished Matches'}
              </h3>
              <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">
                {tab === 'live' ? 'Check back soon — matches update every 30s' : 'Check back later'}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* --- MATCHES GRID --- */}
          {!loading && filteredMatches.length > 0 && (
            <div className="space-y-6">
              {/* Section header (LiveSection style) */}
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                <div className="w-2 h-8 bg-red-600 rounded-full" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {tab === 'live' ? 'Live Now' : tab === 'upcoming' ? 'Upcoming' : 'Finished'}
                </h2>
                <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold rounded-lg uppercase">
                  {filteredMatches.length} Matches
                </span>
                {leagueFilter !== 'All' && (
                  <button
                    onClick={() => setLeagueFilter('All')}
                    className="ml-auto text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider hover:underline"
                  >
                    Clear Filter ✕
                  </button>
                )}
              </div>

              {/* Chunked grid — ad injected every 8 cards */}
              {Array.from({ length: Math.ceil(filteredMatches.length / 8) }, (_, chunkIdx) => {
                const chunk = filteredMatches.slice(chunkIdx * 8, chunkIdx * 8 + 8);
                const isLastChunk = chunkIdx === Math.ceil(filteredMatches.length / 8) - 1;
                return (
                  <React.Fragment key={chunkIdx}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 transition-all duration-500">
                      {chunk.map(match => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                    {!isLastChunk && (
                      <div className="w-full flex justify-center items-center overflow-hidden" style={{ minHeight: '50px' }}>
                        <GoogleAdSense
                          slot="7838572857"
                          format="horizontal"
                          responsive={false}
                          minHeight="50px"
                          fallbackImage="/cover.png"
                          style={{ width: '100%', height: '50px' }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}


          {/* Last refresh label */}
          {!loading && (
            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <Clock size={10} />
              Last updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {isRefreshing && <span className="text-primary-500 animate-pulse"> · Refreshing…</span>}
            </div>
          )}

          {/* --- AD after matches --- */}
          {!loading && filteredMatches.length > 0 && (
            <div className="flex justify-center">
              <GoogleAdSense
                slot="7838572857"
                format="horizontal"
                responsive={false}
                minHeight="50px"
                fallbackImage="/cover.png"
                style={{ width: '100%', maxWidth: '728px', height: '50px' }}
              />
            </div>
          )}

          {/* --- ALL TABS SUMMARY (stats row) --- */}
          {!loading && (
            <div className="mt-4 grid grid-cols-3 gap-4 md:gap-6">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setLeagueFilter('All'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`group relative overflow-hidden bg-white dark:bg-surface-dark-900 rounded-2xl md:rounded-[2rem] border transition-all duration-300 p-4 md:p-6 flex flex-col items-center text-center gap-2 ${tab === t.id
                    ? 'border-red-500 ring-1 ring-red-500/10 shadow-xl shadow-red-500/10'
                    : 'border-slate-200 dark:border-white/5 hover:border-primary-500/30 hover:shadow-lg'
                    }`}
                >
                  {tab === t.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-transparent pointer-events-none" />
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tab === t.id
                    ? 'bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:text-primary-500'
                    }`}>
                    <t.icon size={18} className={t.pulse && tab === t.id ? 'animate-pulse' : ''} />
                  </div>
                  <span className={`text-2xl md:text-3xl font-black tabular-nums ${tab === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {t.count}
                  </span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
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
};

export default LiveFootball;