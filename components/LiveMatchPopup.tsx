import React, { useState, useEffect } from 'react';
import { Trophy, X, ExternalLink, Siren } from 'lucide-react';
import { getLiveMatches } from '../services/db';
import { LiveMatch } from '../types';

export const LiveMatchPopup: React.FC = () => {
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            const data = await getLiveMatches();
            // Only show active matches
            const activeMatches = data.filter((m: any) => m.isActive);
            setMatches(activeMatches);
        };
        fetchMatches();

        // Optional: Polling for updates every 1 minute
        const interval = setInterval(fetchMatches, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible || matches.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-right-10 fade-in duration-500">
            <div className="flex flex-col gap-3 items-end">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        className="group relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-primary-500/20 overflow-hidden w-60 md:w-64 transition-all hover:scale-[1.02] hover:border-primary-500/50"
                    >
                        {/* Status Bar */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-3 py-1.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live</span>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={11} />
                            </button>
                        </div>

                        <div className="p-3">
                            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight mb-2 text-center line-clamp-1">
                                {match.title}
                            </p>

                            {match.team1 && match.team2 ? (
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex-1 text-center">
                                        <div className="w-8 h-8 mx-auto bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center mb-1 group-hover:rotate-3 transition-transform">
                                            <Trophy size={16} className="text-yellow-500" />
                                        </div>
                                        <p className="text-[10px] font-bold dark:text-white truncate px-1">{match.team1}</p>
                                    </div>
                                    <div className="text-primary-600 font-black text-[10px] italic opacity-50">VS</div>
                                    <div className="flex-1 text-center">
                                        <div className="w-8 h-8 mx-auto bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center mb-1 group-hover:-rotate-3 transition-transform">
                                            <Trophy size={16} className="text-primary-500" />
                                        </div>
                                        <p className="text-[10px] font-bold dark:text-white truncate px-1">{match.team2}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 mb-3 bg-gray-50 dark:bg-gray-900/40 p-2 rounded-xl">
                                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center shrink-0">
                                        <Siren size={16} className="text-primary-600" />
                                    </div>
                                    <p className="text-xs font-bold dark:text-gray-200 line-clamp-2">
                                        Click to watch the live stream
                                    </p>
                                </div>
                            )}

                            <a
                                href={match.matchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-gray-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/20"
                            >
                                <ExternalLink size={12} />
                                Watch Stream
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
