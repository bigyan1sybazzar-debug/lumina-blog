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
        <div className="fixed bottom-44 right-6 w-72 md:w-80 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-primary-500 overflow-hidden">
                <div className="bg-primary-600 px-4 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <Siren size={18} className="animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-wider">Live Match</span>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    {matches.map((match) => (
                        <div key={match.id} className="space-y-3">
                            <div className="text-center">
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-2">
                                    {match.title}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 text-center">
                                        <div className="w-10 h-10 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-1">
                                            <Trophy size={20} className="text-yellow-500" />
                                        </div>
                                        <p className="text-xs font-bold dark:text-white line-clamp-1">{match.team1}</p>
                                    </div>
                                    <div className="text-primary-600 font-black text-sm italic">VS</div>
                                    <div className="flex-1 text-center">
                                        <div className="w-10 h-10 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-1">
                                            <Trophy size={20} className="text-primary-500" />
                                        </div>
                                        <p className="text-xs font-bold dark:text-white line-clamp-1">{match.team2}</p>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={match.matchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30"
                            >
                                <ExternalLink size={14} />
                                Watch Live Now
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
