'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Trophy, Calendar, History, ChevronRight, Activity, ChevronLeft } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import GoogleAdSense from '../components/GoogleAdSense';

import { footballApi } from '../api/football';

type Tab = 'live' | 'upcoming' | 'recent';

interface Match {
  id: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  status: string;
  league: string;
  country: string;
  round?: string;
  live: boolean;
}

const LiveFootball: React.FC = () => {
  const [tab, setTab] = useState<Tab>('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const data = await (tab === 'live'
        ? footballApi.liveMatches()
        : tab === 'upcoming'
          ? footballApi.upcomingMatches()
          : footballApi.recentMatches()
      );

      const list = data.data || [];
      const formatted = list.map((m: any) => ({
        id: m.id,
        home: m.participants?.[0]?.data?.name || m.localteam?.data?.name || 'Home',
        away: m.participants?.[1]?.data?.name || m.visitorteam?.data?.name || 'Away',
        homeScore: m.scores?.find((s: any) => s.description === 'CURRENT')?.score?.goals_home,
        awayScore: m.scores?.find((s: any) => s.description === 'CURRENT')?.score?.goals_away,
        minute: m.time?.minute,
        status: m.time?.status || 'Scheduled',
        league: m.league?.data?.name || m.league?.name || 'Unknown League',
        country: m.league?.country?.name || m.league?.data?.country?.name || '',
        round: m.round?.name || m.round?.data?.name,
        live: m.time?.status === 'LIVE' || m.time?.status === 'HT' || m.time?.status === 'FT',
      }));

      setMatches(formatted);
    } catch (err) {
      console.error('Football API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    if (tab === 'live') {
      const interval = setInterval(fetchMatches, 30000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  const splideOptions = {
    perPage: 3,
    perMove: 1,
    gap: '1.5rem',
    arrows: true,
    pagination: false,
    breakpoints: {
      1280: { perPage: 3 },
      1024: { perPage: 2 },
      640: { perPage: 2.5, gap: '1rem', arrows: false, pagination: true }, // 2.5 per page as requested
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-2 md:px-4 relative overflow-hidden">
      {/* Subtle Background deco */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
            Live <span className="text-primary-600">Scores</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Football Hub • Global Updates
          </p>

          <div className="flex justify-center gap-2 mt-8">
            {[
              { id: 'live', label: 'Live', icon: Trophy },
              { id: 'upcoming', label: 'Upcoming', icon: Calendar },
              { id: 'recent', label: 'Recent', icon: History },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-xl font-bold transition-all text-[10px] md:text-sm ${tab === t.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white'
                  }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* AdSense: After Header/Tabs */}
        <div className="max-w-7xl mx-auto px-4 my-12">
          <GoogleAdSense
            slot="7838572857"
            format="auto"
            responsive={true}
          />
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="animate-spin text-primary-600 mb-4" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Matches</span>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
            <Trophy className="mx-auto text-gray-200 dark:text-gray-800" size={64} />
            <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">No active matches</p>
          </div>
        )}

        {!loading && matches.length > 0 && (
          <div className="relative group/football-slider">
            <Splide options={splideOptions} className="football-splide">
              {matches.map((m) => (
                <SplideSlide key={m.id} className="pb-12">
                  <div
                    className={`group bg-white dark:bg-[#111] rounded-2xl md:rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-6 md:p-10 hover:border-primary-500/30 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between h-full ${m.live ? 'border-primary-500/50' : ''}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6 md:mb-10">
                        <div className="min-w-0">
                          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary-600 truncate">{m.league}</p>
                          <h3 className="text-[7px] md:text-xs font-bold text-gray-400 truncate mt-1">
                            {m.country}
                          </h3>
                        </div>
                        {m.live && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[8px] md:text-[10px] font-black animate-pulse">
                            <Activity size={12} />
                            {m.minute ? `${m.minute}'` : 'LIVE'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-4 md:space-y-8">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm md:text-2xl text-gray-900 dark:text-white truncate flex-1 pr-4">{m.home}</h4>
                          <span className="text-lg md:text-3xl font-black text-primary-600 tabular-nums">
                            {m.homeScore ?? '-'}
                          </span>
                        </div>

                        <div className="h-px bg-gray-50 dark:bg-white/5 relative flex items-center justify-center">
                          <span className="absolute px-3 bg-white dark:bg-[#111] text-[7px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">VS</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm md:text-2xl text-gray-900 dark:text-white truncate flex-1 pr-4">{m.away}</h4>
                          <span className="text-lg md:text-3xl font-black text-primary-600 tabular-nums">
                            {m.awayScore ?? '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 md:mt-12 pt-4 md:pt-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[8px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {m.status}
                      </span>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        )}

        {/* AdSense: After Matches Slider */}
        {!loading && matches.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 my-12">
            <GoogleAdSense
              slot="7838572857"
              format="auto"
              responsive={true}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        /* Premium Slider Buttons for Football */
        .football-splide .splide__arrow {
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            width: 4rem !important;
            height: 4rem !important;
            opacity: 0 !important;
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1) !important;
        }
        .football-splide .splide__arrow svg {
            fill: #fff !important;
            width: 1.75rem !important;
            height: 1.75rem !important;
        }
        .dark .football-splide .splide__arrow {
            background: rgba(20, 20, 20, 0.7) !important;
        }
        .group\/football-slider:hover .splide__arrow {
            opacity: 1 !important;
        }
        .football-splide .splide__arrow:hover {
            background: #8b5cf6 !important;
            border-color: #8b5cf6 !important;
            transform: scale(1.1) !important;
        }
        .football-splide .splide__arrow--prev { left: -2rem !important; }
        .football-splide .splide__arrow--next { right: -2rem !important; }
        
        .football-splide .splide__pagination {
            bottom: -0.5rem !important;
        }
        .football-splide .splide__pagination__page {
          width: 6px;
          height: 6px;
          background: rgba(200, 200, 200, 0.2) !important;
        }
        .football-splide .splide__pagination__page.is-active {
          background: #8b5cf6 !important;
          transform: scale(1.5) !important;
        }
      `}</style>
    </div>
  );
};

export default LiveFootball;