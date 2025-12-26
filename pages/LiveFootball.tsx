'use client';

// pages/LiveFootball.tsx
import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Trophy, Calendar, History } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
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

    // Only set interval for live tab
    if (tab === 'live') {
      const interval = setInterval(fetchMatches, 30000);
      return () => clearInterval(interval); // Correct cleanup
    }

    // No interval for upcoming/recent → return nothing
    return undefined;
  }, [tab]);

  return (
    <>
      <Helmet>
        <title>Live Football Scores | Bigyann</title>
        <meta name="description" content="Real-time Premier League, La Liga, Champions League scores" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="text-yellow-500" size={48} />
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
                Live Football Scores
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Real-time updates • Premier League, La Liga, Champions League & more
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {[
                { id: 'live', label: 'Live Now', icon: Trophy },
                { id: 'upcoming', label: 'Upcoming', icon: Calendar },
                { id: 'recent', label: 'Recent', icon: History },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${tab === t.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  <t.icon size={20} />
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchMatches}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg transition-all"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-24">
              <Loader2 className="animate-spin text-primary-600" size={64} />
              <p className="mt-6 text-xl">Loading matches...</p>
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="text-center py-24">
              <Trophy className="mx-auto text-gray-400" size={80} />
              <h2 className="text-3xl font-bold mt-6">No {tab} matches</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">
                Check back soon!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches.map((m) => (
              <div
                key={m.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all ${m.live ? 'ring-4 ring-green-500' : ''
                  }`}
              >
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase opacity-90">{m.league}</p>
                      <h3 className="text-lg font-bold mt-1">{m.country}</h3>
                      {m.round && <p className="text-xs opacity-80">{m.round}</p>}
                    </div>
                    {m.live && (
                      <div className="text-right">
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                          {m.minute ? `${m.minute}'` : 'LIVE'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <h4 className="font-bold text-2xl text-gray-900 dark:text-white">{m.home}</h4>
                    <p className="text-5xl font-extrabold mt-3 text-primary-600">
                      {m.homeScore ?? '-'}
                    </p>
                  </div>

                  <div className="text-center text-4xl font-bold text-gray-400">VS</div>

                  <div className="text-center">
                    <h4 className="font-bold text-2xl text-gray-900 dark:text-white">{m.away}</h4>
                    <p className="text-5xl font-extrabold mt-3 text-primary-600">
                      {m.awayScore ?? '-'}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm font-medium bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-full">
                      {m.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveFootball;