'use client';


import React, { useState, useEffect } from 'react';
import {
    getLiveLinks,
    subscribeToNewsletter,
    getIPTVChannels,
    getIPTVConfig,
    upsertIPTVChannel,
    setDefaultIPTVChannel,
    getTrendingIPTVChannels,
    updateLiveLink,
    setLiveLinkDefault,
    getLiveComments,
    addLiveComment,
    clearLiveComments,
    likeLiveComment,
    subscribeToLiveComments,
    getRealtimeTraffic,
    voteLiveLinkPoll
} from '../services/db';

import { getR2LiveLinks, getR2IPTVChannels } from '../services/r2-data';
import { useAuth } from '../context/AuthContext';
import { parseM3U } from '../lib/m3uParser';
import { LiveLink } from '../types';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import GoogleAdSense from './GoogleAdSense';
import { X, Play, Radio, Vote, Trophy, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle, Share2, Facebook, MessageCircle, ArrowLeft, Bookmark, Link2, TrendingUp, Newspaper, Maximize, Clock, Volume2, VolumeX, Shield, Search, User, Users, Hand, Heart, Reply } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import HLSPlayer from './HLSPlayer';
import { M3UChannel } from '../lib/m3uParser';


const splideCustomStyles = `
  #trending-slider .splide__track {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  #trending-slider .splide__list {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
`;



// --- STATIC HELPERS (Outside to prevent re-renders) ---

const resolveMatchStart = (value: string): number => {
    if (!value) return 0;

    // Handle HH:MM or HH:MM:SS format
    if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
        const parts = value.split(':').map(Number);
        const d = new Date();
        d.setHours(parts[0], parts[1], parts[2] || 0, 0);
        // Adjust date if the time is more than 12 hours in the past, assuming it's for today or tomorrow
        if (Date.now() - d.getTime() > 12 * 60 * 60 * 1000) {
            d.setDate(d.getDate() + 1);
        }
        return d.getTime();
    }

    const parsed = new Date(value).getTime();
    return isNaN(parsed) ? 0 : parsed;
};

const getTimeLeft = (matchDate: string | number, durationMinutes = 125, now: Date = new Date()) => {
    const start = typeof matchDate === 'number' ? matchDate : resolveMatchStart(String(matchDate));
    const endMs = start + durationMinutes * 60 * 1000;
    const remainingMs = endMs - now.getTime();
    if (remainingMs <= 0) return null;
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m left`;
    if (mins > 0) return `${mins}m ${secs}s left`;
    return `${secs}s left`;
};

const getMatchMinute = (matchDate: string | number, durationMinutes = 125, now: Date = new Date()) => {
    const start = typeof matchDate === 'number' ? matchDate : resolveMatchStart(String(matchDate));
    const elapsed = Math.floor((now.getTime() - start) / 60000);
    if (elapsed < 0) return null;
    if (elapsed > durationMinutes + 5) return null;
    return elapsed;
};

// Isolated Timer Components to prevent Re-renders of the whole page
const MatchCardTimer = React.memo(({ matchDate, duration = 125 }: any) => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const startMs = resolveMatchStart(String(matchDate));
    const elapsedMins = Math.floor((now.getTime() - startMs) / 60000);

    if (elapsedMins < 0) {
        const tLeft = getTimeLeft(matchDate, 0, now)?.replace(' left', '');
        return <span className="text-[8px] text-blue-500 font-bold">{tLeft} to go</span>;
    } else if (elapsedMins <= duration) {
        const tLeft = getTimeLeft(matchDate, duration, now);
        return <span className="text-[8px] text-emerald-500 font-bold animate-pulse">{tLeft}</span>;
    }
    return null;
});

const MatchMinuteIndicator = React.memo(({ date }: any) => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const minute = getMatchMinute(date, 125, now);
    return minute !== null ? (
        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded-full border border-amber-200 dark:border-amber-700/50">
            {minute}&apos;
        </span>
    ) : null;
});

const MatchTimeDisplay = React.memo(({ date }: any) => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const timeLeft = getTimeLeft(date, 125, now);
    return timeLeft ? (
        <>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="flex items-center gap-1 text-[10px] font-black text-red-500">
                <Clock size={10} className="animate-pulse" />
                {timeLeft}
            </div>
        </>
    ) : null;
});

const PlayerStatusBanner = React.memo(({ matchStartTime, duration = 125 }: any) => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const tLeft = getTimeLeft(matchStartTime, duration, now);
    if (!tLeft) return <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Please be patient — HD channels may take a moment to load</p>;

    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter animate-pulse">Live Match Active</span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{tLeft} remaining in match</span>
        </div>
    );
});

const MatchCountdown = React.memo(({ matchStartTime, duration = 125 }: any) => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const tLeft = getTimeLeft(matchStartTime, duration, now);
    const startMs = resolveMatchStart(matchStartTime);
    const isFuture = startMs > now.getTime();
    return (
        <>
            <span className="text-white text-[10px] font-black uppercase tracking-wider">
                {isFuture ? 'Kick Off In' : 'Match Time'}
            </span>
            <span className={`text-white text-[10px] font-mono font-bold ${!isFuture && 'text-emerald-300 animate-pulse'}`}>
                {isFuture ? getTimeLeft(matchStartTime, 0, now)?.replace(' left', '') : (tLeft || 'Ended')}
            </span>
        </>
    );
});

const MainLiveClock = React.memo(() => {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="text-white text-[10px] font-mono font-bold">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
});

const splideOptionsTrending = {
    type: 'slide',
    rewind: true,
    drag: true,
    snap: true,
    focus: 0,
    perPage: 5,
    gap: '0.75rem',
    arrows: false,
    pagination: false,
    trimSpace: false,
    flickPower: 300,
    dragMinThreshold: 5,
    flickMaxPages: 1,
    updateOnMove: false,
    throttle: 100,
    padding: { left: 0, right: 0 },
    breakpoints: {
        1280: { perPage: 5, gap: '0.75rem', focus: 0 },
        1024: { perPage: 4, gap: '0.75rem', focus: 0 },
        768: { perPage: 3, gap: '0.5rem', focus: 0, snap: true },
        640: { perPage: 2.5, gap: '0.5rem', focus: 0, snap: true },
        480: { perPage: 2.25, gap: '0.5rem', focus: 0, snap: true },
    },
};

// --- SUB COMPONENTS FOR GRID ---

const LiveMatchCard = React.memo(({ link, selectedLink, handleLinkClick, getWatchingCount, user, updateLiveLink, setLinks, setLiveLinkDefault, showToast }: any) => {
    return (
        <div key={link.id} className="relative group/channel h-full">
            <div
                onClick={() => handleLinkClick(link)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLinkClick(link);
                    }
                }}
                role="button"
                tabIndex={0}
                className={`w-full h-full group text-left relative overflow-hidden bg-white dark:bg-surface-dark-900 px-4 py-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border transition-all duration-300 min-h-[90px] md:min-h-[160px] flex flex-col justify-center cursor-pointer ${selectedLink?.id === link.id
                    ? 'border-red-500 ring-2 ring-red-500/10 shadow-2xl shadow-red-500/20'
                    : 'border-slate-200 dark:border-white/5 hover:border-red-500/50 hover:shadow-xl hover:shadow-black/5'
                    }`}
            >
                {link.isTrending && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg z-10 animate-bounce hover:scale-110 transition-transform">
                        <Activity size={10} className="animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">HOT NOW</span>
                    </div>
                )}
                {link.isDefault && (
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-0.5 bg-primary-600 text-white rounded-full shadow-lg z-10">
                        <Sparkles size={10} fill="currentColor" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">STARTUP</span>
                    </div>
                )}
                {selectedLink?.id === link.id && (
                    <div className="absolute bottom-6 left-3 md:left-6 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-full shadow-xl shadow-red-600/30 z-20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <CheckCircle size={10} className="text-white" fill="white" />
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">Live Now</span>
                    </div>
                )}
                <div className="flex flex-row md:flex-col items-center text-left md:text-center gap-4 md:gap-5">
                    <div className={`flex-shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center transition-all duration-500 relative overflow-hidden ${selectedLink?.id === link.id
                        ? 'bg-gradient-to-br from-red-600 to-orange-600 text-white ring-4 ring-red-500/20 shadow-xl'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-red-50 dark:group-hover:bg-red-900/10 group-hover:text-red-600'
                        }`}>
                        {selectedLink?.id === link.id && (
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                        )}
                        {(link.teamALogo && link.teamBLogo) ? (
                            <div className="flex items-center justify-center w-full h-full gap-2 px-1 bg-white/5 backdrop-blur-sm">
                                <img src={link.teamALogo} alt="" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
                                <span className="text-[10px] font-black text-red-600 italic">VS</span>
                                <img src={link.teamBLogo} alt="" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" />
                            </div>
                        ) : link.thumbnailUrl ? (
                            <img
                                src={link.thumbnailUrl}
                                alt={link.heading}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://i.imgur.com/guz2ajm.png'; // Fallback
                                }}
                            />
                        ) : (
                            <Play size={24} fill="currentColor" className="relative z-10 md:ml-1 md:w-[32px] md:h-[32px]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 w-full flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start gap-2">
                            <h4 className={`font-black text-sm md:text-lg leading-tight transition-colors text-left ${selectedLink?.id === link.id
                                ? 'text-red-500'
                                : 'text-gray-900 dark:text-white group-hover:text-red-500'
                                }`}>
                                {link.heading.trim().split(/\s+/).length > 5
                                    ? link.heading.trim().split(/\s+/).slice(0, 5).join(' ') + '...'
                                    : link.heading}
                            </h4>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`${window.location.origin}/tools/live-tv-hd?v=${link.id}`);
                                    showToast('🔗 Share link copied!');
                                }}
                                className="p-2 -mr-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Share"
                            >
                                <Share2 size={14} />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-auto pt-2">
                            {link.tags && link.tags.slice(0, 2).map((tag: any) => (
                                <span key={tag} className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                    {tag}
                                </span>
                            ))}
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Users size={10} className="animate-pulse" /> {Math.max(1, getWatchingCount(link.id) || 1)} LIVE
                            </span>
                            {(link as any).matchStartTime && (
                                <div className="w-full md:w-auto">
                                    <MatchCardTimer matchDate={(link as any).matchStartTime} duration={(link as any).matchDurationMinutes || 125} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {user?.role === 'admin' && (
                <div className="absolute top-4 right-2 md:right-4 flex flex-col gap-2 z-30 md:opacity-0 group-hover/channel:opacity-100 transition-opacity translate-x-4 md:translate-x-12 group-hover/channel:translate-x-0 duration-300">
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await updateLiveLink(link.id, { isTrending: !link.isTrending });
                                setLinks((prev: any[]) => prev.map(l =>
                                    l.id === link.id ? { ...l, isTrending: !link.isTrending } : l
                                ));
                            } catch (err) {
                                console.error('Failed to toggle trending:', err);
                            }
                        }}
                        className={`p-2.5 rounded-2xl shadow-2xl border-2 transition-all transform hover:scale-110 active:scale-95 ${link.isTrending ? 'bg-amber-500 text-white border-amber-400' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-amber-500 hover:border-amber-500'}`}
                    >
                        <TrendingUp size={16} />
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                if (link.isDefault) {
                                    await updateLiveLink(link.id, { isDefault: false });
                                    setLinks((prev: any[]) => prev.map(l =>
                                        l.id === link.id ? { ...l, isDefault: false } : l
                                    ));
                                } else {
                                    await setLiveLinkDefault(link.id, true);
                                    setLinks((prev: any[]) => prev.map(l => ({ ...l, isDefault: l.id === link.id })));
                                }
                            } catch (err) {
                                console.error('Failed to toggle default:', err);
                            }
                        }}
                        className={`p-2.5 rounded-2xl shadow-2xl border-2 transition-all transform hover:scale-110 active:scale-95 ${link.isDefault ? 'bg-primary-600 text-white border-primary-400' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-primary-600 hover:border-primary-600'}`}
                    >
                        <Sparkles size={16} />
                    </button>
                </div>
            )}
        </div>
    );
});

const IPTVChannelCard = React.memo(({ channel, selectedLink, handleIptvClick, getWatchingCount, user, upsertIPTVChannel, setIptvChannels, setDefaultIPTVChannel, setLinks, showToast }: any) => {
    return (
        <div key={channel.id} className="relative group/channel">
            <div
                onClick={() => handleIptvClick(channel)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleIptvClick(channel);
                    }
                }}
                role="button"
                tabIndex={0}
                className={`w-full group text-left relative overflow-hidden bg-white dark:bg-surface-dark-900 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${selectedLink?.id === channel.id
                    ? 'border-primary-light ring-2 ring-primary-light/20 shadow-md'
                    : channel.isTrending
                        ? 'border-amber-200 dark:border-amber-500/30 bg-amber-50/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-primary-light/50'
                    }`}
            >
                {channel.isTrending && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-full shadow-sm z-10 animate-pulse">
                        <TrendingUp size={8} fill="currentColor" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">HOT</span>
                    </div>
                )}
                {channel.isDefault && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-primary-600 text-white rounded-full shadow-sm z-10">
                        <Sparkles size={8} fill="currentColor" />
                        <span className="text-[7px] font-black uppercase tracking-tighter">DEFAULT</span>
                    </div>
                )}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500 relative overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 ${channel.isTrending ? 'ring-2 ring-amber-500/20' : ''}`}>
                        {channel.logo ? (
                            <img
                                src={channel.logo}
                                alt={channel.name}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://i.imgur.com/guz2ajm.png'; }}
                            />
                        ) : (
                            <Play size={18} className="text-primary-light" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                        <h4 className={`font-bold text-[11px] md:text-xs line-clamp-1 transition-colors ${selectedLink?.id === channel.id ? 'text-primary-dark' : 'text-gray-900 dark:text-white group-hover:text-primary-light'}`}>
                            {channel.name}
                        </h4>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                            {channel.group && (
                                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {channel.group}
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-[8px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded-md">
                                <Activity size={8} className="animate-pulse" /> {getWatchingCount(channel.id) || 1} watching
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            {user?.role === 'admin' && (
                <div className="absolute -top-3 -right-2 flex flex-col gap-2 z-30">
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await upsertIPTVChannel(channel, { isTrending: !channel.isTrending });
                                setIptvChannels((prev: any[]) => prev.map(c => c.id === channel.id ? { ...c, isTrending: !channel.isTrending } : c));
                            } catch (err) { console.error('Failed to toggle trending:', err); }
                        }}
                        className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${channel.isTrending ? 'bg-amber-500 text-white border-amber-400' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-amber-500 hover:border-amber-500'}`}
                    >
                        <TrendingUp size={14} />
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                if (channel.isDefault) {
                                    await upsertIPTVChannel(channel, { isDefault: false });
                                    setIptvChannels((prev: any[]) => prev.map(c => c.id === channel.id ? { ...c, isDefault: false } : c));
                                } else {
                                    await setDefaultIPTVChannel(channel);
                                    setIptvChannels((prev: any[]) => prev.map(c => ({ ...c, isDefault: c.id === channel.id })));
                                    setLinks((prev: any[]) => prev.map(l => ({ ...l, isDefault: false })));
                                }
                            } catch (err) { console.error('Failed to toggle default:', err); }
                        }}
                        className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${channel.isDefault ? 'bg-primary-600 text-white border-primary-400' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-primary-600 hover:border-primary-600'}`}
                    >
                        <Sparkles size={14} />
                    </button>
                </div>
            )}
        </div>
    );
});


export const LiveSection: React.FC = () => {
    const [isMounted, setIsMounted] = useState(false);
    // Global liveTime removed to prevent massive re-renders
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [reactions, setReactions] = useState<Record<string, number>>({ '🔥': 0, '❤️': 0, '👏': 0, '😮': 0 });
    const [userReacted, setUserReacted] = useState<string | null>(null);




    const [links, setLinks] = useState<LiveLink[]>([]);

    const [selectedLink, setSelectedLink] = useState<any>(null);

    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [showAd, setShowAd] = useState(false); // Kept for compatibility but unused
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [onDemandName, setOnDemandName] = useState('');
    const [onDemandMessage, setOnDemandMessage] = useState('');
    const [playerKey, setPlayerKey] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showDiscussions, setShowDiscussions] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [iptvChannels, setIptvChannels] = useState<M3UChannel[]>([]);
    const [isIPTVMode, setIsIPTVMode] = useState(false);
    const [iptvTag, setIptvTag] = useState<string>('All');
    const [iptvSearch, setIptvSearch] = useState('');
    const [isWatching, setIsWatching] = useState(false);

    // Track watching state
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('analytics_watch_state', {
            detail: { isWatching: isWatching }
        }));
    }, [isWatching]);

    // Reset watching state when link changes
    useEffect(() => {
        setIsWatching(false);
    }, [selectedLink?.id]);
    const [iptvWatchTime, setIptvWatchTime] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [iptvConfig, setIptvConfig] = useState<any>(null);
    const [hasFullList, setHasFullList] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [realtimeStats, setRealtimeStats] = useState<{ activeUsers: number; activePages: any[] }>({ activeUsers: 0, activePages: [] });

    const showToast = React.useCallback((msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 2500);
    }, []);

    const handleReaction = React.useCallback((emoji: string) => {
        if (userReacted === emoji) return;
        setReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
        setUserReacted(emoji);
        showToast(`You reacted ${emoji}`);
    }, [userReacted, showToast]);
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const playerRef = React.useRef<HTMLDivElement>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Removed adCountdown

    const handlePlayerReady = React.useCallback(() => {
        setIsWatching(true);
    }, []);

    const handleLinkClick = (link: any) => {
        if (selectedLink?.id === link.id) return;
        setPendingLink(null);
        setSelectedLink(link); // Directly play
        // Update URL without full refresh to enable tracking per channel
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('v', link.id);
        router.push(`/tools/live-tv-hd?${params.toString()}`, { scroll: false });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleVote = async (team: 'A' | 'B') => {
        if (!user) {
            alert('Please login to vote');
            return;
        }
        if (!selectedLink?.id || isVoting) return;

        try {
            setIsVoting(true);
            const { link } = await voteLiveLinkPoll(selectedLink.id, team, user.id);
            // Update the selected link with new poll data
            setSelectedLink((prev: any) => ({
                ...prev,
                poll: link.poll
            }));

            // Also update it in the list of links so it persists if we switch and come back
            setLinks((prev: LiveLink[]) => prev.map(l => l.id === link.id ? link : l));

        } catch (error: any) {
            alert(error.message || 'Failed to vote');
        } finally {
            setIsVoting(false);
        }
    };

    // Removed skipAd and timer effect


    const handleIptvClick = async (channel: M3UChannel) => {
        const liveLink: any = {
            id: channel.id,
            heading: channel.name,
            iframeUrl: channel.url,
            isHLS: channel.url.includes('.m3u8'),
            tags: [channel.group],
            isIPTV: true
        };
        handleLinkClick(liveLink);

        try {
            await upsertIPTVChannel(channel, { isTrending: true });
        } catch (err) {
            console.error('Failed to mark IPTV as trending:', err);
        }
    };

    useEffect(() => {
        if (selectedLink?.id) {
            const unsubscribe = subscribeToLiveComments(selectedLink.id, (fetchedComments) => {
                setComments(fetchedComments);
            });
            return () => unsubscribe();
        }
    }, [selectedLink?.id]);

    // Real-time clock ticker removed (Moved to localized components)

    useEffect(() => {
        setIsMounted(true);
        const loadInitialData = async () => {
            try {
                const [fetchedLinks, config, r2Channels] = await Promise.all([
                    getR2LiveLinks(),
                    getIPTVConfig(),
                    getR2IPTVChannels()
                ]);

                console.log('DEBUG: Fetched live links from R2:', fetchedLinks);
                setLinks(fetchedLinks);

                setIptvConfig(config);

                const mappedChannels: M3UChannel[] = r2Channels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    logo: c.logo || '',
                    group: c.category,
                    isTrending: !!c.isTrending,
                    isDefault: !!c.isDefault,
                    trendingOrder: c.trendingOrder
                }));

                let finalIptv = mappedChannels;

                if (mappedChannels.length === 0 && config?.m3uUrl) {
                    try {
                        const proxyUrl = `/api/proxy?url=${encodeURIComponent(config.m3uUrl)}`;
                        const res = await fetch(proxyUrl);
                        const content = await res.text();
                        finalIptv = parseM3U(content);
                    } catch (err) {
                        console.error('Failed to load remote IPTV M3U:', err);
                    }
                }

                setIptvChannels(finalIptv);

                // Initial selection logic: check URL first, then default, then fallback
                const urlV = searchParams?.get('v');
                const defaultIptv = finalIptv.find(c => c.isDefault);
                const actualDefaultSports = fetchedLinks.find((link: LiveLink) => link.isDefault);

                let initialLink = null;

                if (urlV) {
                    // Try to find in sports links
                    initialLink = fetchedLinks.find(l => l.id === urlV);
                    if (!initialLink) {
                        // Try to find in IPTV channels
                        const channel = finalIptv.find(c => c.id === urlV);
                        if (channel) {
                            initialLink = channel;
                            setIsIPTVMode(true);
                        }
                    }
                }

                if (!initialLink) {
                    initialLink = actualDefaultSports || defaultIptv || fetchedLinks.find((link: LiveLink) => link.isTrending) || fetchedLinks[0];
                }

                if (initialLink) {
                    const isIPTV = finalIptv.some(c => c.id === (initialLink as any).id);
                    if (isIPTV) setIsIPTVMode(true);

                    const formattedLink: any = isIPTV ? {
                        id: (initialLink as any).id,
                        heading: (initialLink as any).name,
                        iframeUrl: (initialLink as any).url,
                        isHLS: (initialLink as any).url.includes('.m3u8'),
                        tags: [(initialLink as any).group],
                        isIPTV: true
                    } : initialLink;

                    setPendingLink(null);
                    setSelectedLink(formattedLink);

                    // If no V param is in URL, add it automatically to fix the user's reported ad loading issue
                    if (!urlV && typeof window !== 'undefined') {
                        const currentParams = new URLSearchParams(window.location.search);
                        // Use usePathname() hook for reliable path construction, 
                        // fallback to hardcoded path if for some reason pathname is home
                        const safePath = (pathname && pathname !== '/') ? pathname : '/tools/live-tv-hd';
                        const newUrl = `${safePath}?${currentParams.toString()}`;

                        setTimeout(() => {
                            router.replace(newUrl, { scroll: false });
                        }, 100);
                    }

                    setShowAd(false);
                }

            } catch (error) {
                console.error('Error in initial load:', error);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadInitialData();


        // Fetch realtime traffic stats
        const fetchTraffic = async () => {
            try {
                const stats = await getRealtimeTraffic();
                setRealtimeStats(stats);
            } catch (err) {
                console.error('Failed to fetch traffic stats:', err);
            }
        };
        fetchTraffic();
        const trafficInterval = setInterval(fetchTraffic, 30000); // Update every 30s

        // Inject custom styles
        const style = document.createElement('style');
        style.textContent = splideCustomStyles;
        document.head.appendChild(style);
        return () => {
            clearInterval(trafficInterval);
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);



    useEffect(() => {
        let interval: NodeJS.Timeout;
        const isIPTV = selectedLink?.isIPTV;
        const shouldLimit = (isIPTV) || (!isIPTV && iptvConfig?.enableSportsLimit);
        const limitSeconds = (iptvConfig?.guestLimitMinutes || 5) * 60;

        if (selectedLink && shouldLimit && !user && !showAd) {
            interval = setInterval(() => {
                setIptvWatchTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= limitSeconds) {
                        setShowLoginPrompt(true);
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            setIptvWatchTime(0);
            setShowLoginPrompt(false);
        }
        return () => clearInterval(interval);
    }, [selectedLink, user, showAd, iptvConfig]);

    useEffect(() => {
        if (iframeRef.current && selectedLink) {
            const iframe = iframeRef.current;
            const attemptAdBlock = () => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const style = iframeDoc.createElement('style');
                        style.textContent = `
[id *= "ad-"], [class*= "ad-"], [class*= "popup"], [class*= "overlay"]: not([class*= "video"]),
    [id *= "popup"], div[style *= "position: fixed"][style *= "z-index: 9"],
    iframe[src *= "ads"], iframe[src *= "doubleclick"], iframe[src *= "googlesyndication"] {
    display: none!important;
    visibility: hidden!important;
    opacity: 0!important;
    pointer - events: none!important;
}
`;
                        iframeDoc.head?.appendChild(style);
                    }
                } catch (e) { }
            };
            attemptAdBlock();
            iframe.addEventListener('load', attemptAdBlock);
            const interval = setInterval(attemptAdBlock, 2000);
            return () => {
                iframe.removeEventListener('load', attemptAdBlock);
                clearInterval(interval);
            };
        }
    }, [selectedLink]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail) return;
        setSubmitting(true);
        try {
            await subscribeToNewsletter(newsletterEmail);
            setIsSubscribed(true);
            setNewsletterEmail('');
        } catch (error) {
            alert('Subscription failed.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOnDemandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const prefilledMessage = `* ON DEMAND REQUEST *% 0A % 0A * Name:* ${onDemandName}% 0A * Channel Name:* ${onDemandMessage} `;
        window.open(`https://wa.me/9779805671898?text=${encodeURIComponent(prefilledMessage)}`, '_blank');
        setOnDemandName(''); setOnDemandMessage('');
    };

    const handleRefresh = () => setPlayerKey(prev => prev + 1);

    const toggleFullscreen = () => {
        if (playerRef.current) {
            if (!document.fullscreenElement) playerRef.current.requestFullscreen();
            else document.exitFullscreen();
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (iframeRef.current) {
            try {
                const iframe = iframeRef.current;
                iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: isMuted ? 'unMute' : 'mute' }), '*');
                iframe.contentWindow?.postMessage({ type: 'mute', value: !isMuted }, '*');
            } catch (e) { }
        }
    };

    const handlePostComment = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();
        const textToPost = parentId ? replyText : commentText;
        if (!textToPost.trim() || !selectedLink) return;
        if (!user) { setShowLoginPrompt(true); return; }
        try {
            const commentData: any = {
                channelId: selectedLink.id, text: textToPost, userId: user?.id,
                userName: user?.name || 'Anonymous', userRole: user?.role, userAvatar: user?.avatar
            };
            if (parentId) commentData.parentId = parentId;
            await addLiveComment(commentData);
            if (parentId) { setReplyText(''); setReplyingTo(null); } else setCommentText('');
        } catch (error) { }
    };

    const handleLikeComment = async (commentId: string) => {
        if (!user) { setShowLoginPrompt(true); return; }
        try {
            await likeLiveComment(commentId, user.id);
        } catch (error) { }
    };

    const handleClearComments = async () => {
        if (!selectedLink || !confirm('Clear all?')) return;
        try { await clearLiveComments(selectedLink.id); setComments([]); } catch (e) { }
    };

    const getChannelComments = () => {
        if (!selectedLink) return [];
        const realComments = comments.filter(c => c.channelId === selectedLink.id);
        const welcomeMsg: any = {
            id: 'welcome-bot',
            channelId: selectedLink.id,
            text: "Welcome! 👋 watch Live Hd Full match. Please be respectful in the chat. If the stream buffers, try refreshing or switching channels. Enjoy the match!",
            userId: 'admin-bot',
            userName: 'Bigyann Admin',
            userRole: 'admin',
            userAvatar: 'https://appflicks.com/wp-content/uploads/2025/08/FB_IMG_16036454436998781.jpg',
            timestamp: new Date(),
            likes: []
        };
        return [welcomeMsg, ...realComments];
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
    };

    // Static helpers moved outside component for performance



    // Sorting function for matches
    const sortMatches = (matchList: any[]) => {
        return [...matchList].sort((a, b) => {
            const isAActive = selectedLink?.id === a.id;
            const isBActive = selectedLink?.id === b.id;
            if (isAActive !== isBActive) return isAActive ? -1 : 1;
            if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
            const now = Date.now();
            const startA = resolveMatchStart((a as any).matchStartTime);
            const startB = resolveMatchStart((b as any).matchStartTime);
            const isALive = startA > 0 && now >= startA && now <= (startA + ((a as any).matchDurationMinutes || 125) * 60000);
            const isBLive = startB > 0 && now >= startB && now <= (startB + ((b as any).matchDurationMinutes || 125) * 60000);
            if (isALive !== isBLive) return isALive ? -1 : 1;
            if (a.isTrending !== b.isTrending) return a.isTrending ? -1 : 1;
            if (startA > 0 && startB > 0) {
                if (startA !== startB) return startA - startB;
            } else if (startA > 0) return -1; else if (startB > 0) return 1;
            return 0;
        });
    };

    const allTags = React.useMemo(() => ['All', ...Array.from(new Set(links.flatMap(link => link.tags || [])))], [links]);

    const filteredLinks = React.useMemo(() => {
        const now = Date.now();
        const availableLinks = links.filter(link => {
            if (!(link as any).matchStartTime) return true;
            // Admin sees all active links regardless of time
            if (user?.role === 'admin') return true;

            const startMs = resolveMatchStart(String((link as any).matchStartTime));
            const duration = (link as any).matchDurationMinutes || 125;
            const endMs = startMs + (duration * 60000);

            // Lenient filter: keep link visible for 24 hours after it supposedly ended
            // This prevents issues with incorrect device clocks (user setting date forward)
            return now <= endMs + (24 * 60 * 60000);
        });
        return selectedTag === 'All' ? availableLinks : availableLinks.filter(link => link.tags?.includes(selectedTag));
    }, [links, selectedTag, user?.role]);

    const iptvTags = React.useMemo(() => {
        const groups = Array.from(new Set(iptvChannels.map(c => c.group).filter(Boolean)));
        return ['All', 'Trending', 'Default', ...groups.sort()];
    }, [iptvChannels]);

    const trendingItems = React.useMemo(() => {
        const now = Date.now();
        const availableLinks = links.filter(link => {
            if (!(link as any).matchStartTime) return true;
            if (user?.role === 'admin') return true;

            const startMs = resolveMatchStart(String((link as any).matchStartTime));
            const duration = (link as any).matchDurationMinutes || 125;
            return now <= startMs + ((duration + 1440) * 60000); // 24 extra hours
        });

        return Array.from(new Map([
            ...availableLinks.filter(l => l.isTrending).map(l => ({ ...l, itemType: 'sports' })),
            ...iptvChannels.filter(c => c.isTrending).map(c => ({
                id: c.id, heading: c.name, iframeUrl: c.url, isHLS: c.url.includes('.m3u8'),
                tags: [c.group], isIPTV: true, itemType: 'iptv', trendingOrder: c.trendingOrder
            }))
        ].map(item => [`${item.itemType}-${item.id}`, item])).values());
    }, [links, iptvChannels]);

    const getWatchingCount = (id: string, onlyWatching: boolean = true) => {
        if (!realtimeStats.activePages) return 0;
        // Search for users on /tools/live-tv-hd?v=ID or other variants
        const matchingPages = realtimeStats.activePages.filter(p => p.slug.includes(`v=${id}`));
        if (matchingPages.length === 0) return 0;

        // Sum the counts if multiple page variants match the same video ID
        return matchingPages.reduce((acc, p) =>
            acc + (onlyWatching ? (p.watchingCount || 0) : (p.count || 0)),
            0);
    };

    if (!isMounted) return null;

    return (
        <section id="live-section" className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-light/5 via-transparent opacity-50 pointer-events-none" />

            <div className="pt-0 pb-6 md:pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="space-y-3 md:space-y-6">

                    {/* HD Alert + Live Clock */}
                    <div className="bg-accent-success/5 border-accent-success/20 border rounded-card p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-full bg-accent-success/20 flex items-center justify-center text-accent-success shrink-0"><Clock size={20} /></div>
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">HD channels may take a moment to load and Ignore Onetime Ads. Also support us By sharing this Link</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-red-600 rounded-full sm:ml-auto shrink-0 shadow-lg shadow-red-600/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                            </span>
                            <span className="text-white text-[10px] font-black uppercase tracking-wider">
                                {selectedLink?.matchStartTime ? 'Match Active' : 'Live'}
                            </span>
                        </div>
                    </div>

                    {/* Top Ads - Desktop (728x120) & Mobile (320x100) */}
                    <div className="w-full !mt-2 !mb-4">
                        {/* DESKTOP & TABS */}
                        <div className="hidden md:flex justify-center items-center overflow-hidden" style={{ minHeight: '120px' }}>
                            <GoogleAdSense
                                slot="1229236704"
                                format="horizontal"
                                responsive={false}
                                minHeight="120px"
                                style={{ width: '728px', height: '120px' }}
                            />
                        </div>
                        {/* MOBILE */}
                        <div className="flex md:hidden justify-center items-center overflow-hidden" style={{ minHeight: '100px' }}>
                            <GoogleAdSense
                                slot="1557976551"
                                format="horizontal"
                                responsive={false}
                                minHeight="100px"
                                style={{ width: '320px', height: '100px' }}
                            />
                        </div>
                    </div>

                    {isDataLoading ? (
                        <div className="w-full min-h-[300px] flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-800 backdrop-blur-sm">
                            <div className="relative mb-4">
                                <div className="w-16 h-16 border-4 border-red-100 dark:border-red-900/30 border-t-red-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Activity size={24} className="text-red-600 animate-pulse" />
                                </div>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] animate-pulse">Initializing Live Center</h3>
                            <p className="text-sm text-gray-500 font-medium mt-2">Connecting to streaming servers...</p>
                        </div>
                    ) : (
                        <>
                            {/* Trending Slider */}
                            {trendingItems.length > 0 && (
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="shrink-0">
                                        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-bold uppercase"><TrendingUp size={16} className="animate-pulse" /> Trending Now</button>
                                    </div>
                                    <div className="w-full md:flex-1 min-w-0">
                                        <Splide id="trending-slider" options={splideOptionsTrending}>
                                            {trendingItems.sort((a, b) => {
                                                // 1. Current Active Link at top
                                                const isAActive = selectedLink?.id === a.id;
                                                const isBActive = selectedLink?.id === b.id;
                                                if (isAActive !== isBActive) return isAActive ? -1 : 1;

                                                // 2. Default status
                                                if ((a as any).isDefault !== (b as any).isDefault) return (a as any).isDefault ? -1 : 1;

                                                const now = Date.now();
                                                const startA = resolveMatchStart((a as any).matchStartTime);
                                                const startB = resolveMatchStart((b as any).matchStartTime);

                                                const isALive = startA > 0 && now >= startA && now <= (startA + ((a as any).matchDurationMinutes || 125) * 60000);
                                                const isBLive = startB > 0 && now >= startB && now <= (startB + ((b as any).matchDurationMinutes || 125) * 60000);

                                                // 3. Live Matches
                                                if (isALive !== isBLive) return isALive ? -1 : 1;

                                                // 4. Manual Trending Order (Tie breaker)
                                                const orderA = a.trendingOrder ?? 999;
                                                const orderB = b.trendingOrder ?? 999;
                                                if (orderA !== orderB) return orderA - orderB;

                                                // 5. Upcoming matches by time
                                                if (startA > 0 && startB > 0) {
                                                    if (startA !== startB) return startA - startB;
                                                } else if (startA > 0) return -1;
                                                else if (startB > 0) return 1;

                                                return 0;
                                            }).map((link) => (
                                                <SplideSlide key={`${link.itemType}-${link.id}`}>
                                                    <div
                                                        onClick={() => handleLinkClick(link)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleLinkClick(link);
                                                            }
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                        className="w-full block group text-left cursor-pointer"
                                                    >
                                                        <div className={`relative flex items-center gap-2 md:gap-3 p-2 md:p-2.5 bg-white dark:bg-surface-dark-900 rounded-xl md:rounded-2xl border transition-all ${selectedLink?.id === link.id ? 'border-primary-light ring-2 ring-primary-light/20 bg-primary-50/10 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
                                                            <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all ${selectedLink?.id === link.id ? 'bg-gradient-to-br from-primary-600 to-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-primary-light'}`}>
                                                                <span className="text-[5px] font-black tracking-widest mb-0.5">LIVE</span>
                                                                <div className={`h-1.5 w-1.5 rounded-full ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <h3 className={`text-[10px] font-bold line-clamp-2 dark:text-white`}>{link.heading}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Mini time badge for trending slider */}
                                                                    {(link as any).matchStartTime && (
                                                                        <MatchCardTimer matchDate={(link as any).matchStartTime} duration={(link as any).matchDurationMinutes || 125} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SplideSlide>
                                            ))}
                                        </Splide>
                                    </div>
                                </div>
                            )}

                            {/* MAIN PLAYER & DISCUSSION WRAPPER */}
                            {(selectedLink) && (
                                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                                    <div className="w-full lg:w-[60%] flex flex-col gap-4">
                                        <div ref={playerRef} className="relative bg-black rounded-[32px] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-white/10 w-full aspect-video lg:aspect-[16/10]">
                                            {selectedLink && (
                                                <>
                                                    {showLoginPrompt && !user && (
                                                        <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in backdrop-blur-xl">
                                                            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce"><User size={32} className="text-white" /></div>
                                                            <h2 className="text-2xl font-black text-white mb-4 uppercase">Login Required</h2>
                                                            <div className="flex justify-center mt-3 mb-6 w-full">
                                                                <GoogleAdSense
                                                                    slot="7838572857"
                                                                    format="horizontal"
                                                                    style={{ width: '100%', maxWidth: '728px', minHeight: '90px' }}
                                                                />
                                                            </div>
                                                            <p className="text-gray-400 mb-8 max-w-sm">Sign in to watch <span className="text-white font-bold">{selectedLink.heading}</span>.</p>
                                                            <div className="flex gap-4 w-full max-w-xs"><Link href="/login" className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-black uppercase text-sm">Log In</Link><Link href="/signup" className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black uppercase text-sm">Sign Up</Link></div>
                                                        </div>
                                                    )}
                                                    {selectedLink.isHLS || (typeof selectedLink.iframeUrl === 'string' && selectedLink.iframeUrl.includes('.m3u8')) ? (
                                                        <HLSPlayer key={playerKey} src={selectedLink.youtubeUrl || selectedLink.iframeUrl} className="w-full h-full [&>video]:object-cover" autoPlay={true} muted={isMuted} onReady={handlePlayerReady} />
                                                    ) : (
                                                        <iframe ref={iframeRef} key={playerKey} src={selectedLink.youtubeUrl || selectedLink.iframeUrl} title={selectedLink.heading} className="w-full h-full border-0 absolute top-0 left-0" allowFullScreen referrerPolicy="no-referrer" onLoad={() => setTimeout(() => setIsWatching(true), 2000)} />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {selectedLink && (
                                            <>
                                                {/* METADATA CARD */}
                                                <div className="bg-white dark:bg-surface-dark-900 rounded-[32px] p-4 md:p-6 border border-gray-200 dark:border-white/10 shadow-xl transition-all">
                                                    <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-gray-100/50 dark:bg-white/5 rounded-2xl">
                                                        <button onClick={handleRefresh} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase text-gray-700 dark:text-gray-200 border dark:border-white/5 group shadow-sm transition-all"><RefreshCw size={14} className="group-active:rotate-180 duration-500" /> Refresh</button>
                                                        <button onClick={toggleMute} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase text-gray-700 dark:text-gray-200 border dark:border-white/5 shadow-sm transition-all">{isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} {isMuted ? 'Unmute' : 'Mute'}</button>
                                                        <button onClick={toggleFullscreen} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase text-gray-700 dark:text-gray-200 border dark:border-white/5 shadow-sm transition-all"><Maximize size={14} /> View</button>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                                        <div className="w-full md:flex-1 min-w-0">
                                                            <Link href="/" className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md mb-2"><ArrowLeft size={10} className="mr-1" /> Home</Link>
                                                            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight truncate">{selectedLink.heading || selectedLink.title}</h3>
                                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                                {selectedLink.tags && selectedLink.tags.map((tag: string) => (
                                                                    <span key={tag} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase rounded-md border border-red-200 dark:border-red-800/50">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                                {selectedLink.isIPTV && selectedLink.tags && (
                                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase rounded-md border border-blue-200 dark:border-blue-800/50">
                                                                        IPTV Channel
                                                                    </span>
                                                                )}
                                                                {user?.role === 'admin' && (
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-black uppercase rounded-md border border-green-200 dark:border-green-800/50 shadow-sm animate-in fade-in duration-500">
                                                                        <div className="relative flex h-1.5 w-1.5">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                                                        </div>
                                                                        <User size={10} /> {Math.max(1, getWatchingCount(selectedLink.id, true))} Watching now
                                                                    </span>
                                                                )}
                                                                {user?.role === 'admin' && (
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[9px] font-black uppercase rounded-md border border-orange-200 dark:border-orange-800/50">
                                                                        <Users size={10} /> {getWatchingCount(selectedLink.id, false)} on Page
                                                                    </span>
                                                                )}
                                                                {user?.role === 'admin' && (
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-black uppercase rounded-md border border-blue-200 dark:border-blue-800/50">
                                                                        <Activity size={10} /> Total Site: {realtimeStats.activeUsers}
                                                                    </span>
                                                                )}
                                                                {selectedLink.matchStartTime && (
                                                                    <MatchTimeDisplay date={selectedLink.matchStartTime} />
                                                                )}
                                                                {/* Public live viewer count */}
                                                                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase rounded-md border border-red-200 dark:border-red-800/50">
                                                                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" /></span>
                                                                    {Math.max(1, getWatchingCount(selectedLink.id, true))} watching live
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Facebook size={16} /></button>
                                                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm"><MessageCircle size={16} /></button>
                                                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Copied!"); }} className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm"><Link2 size={16} /></button>
                                                            <button onClick={() => setSelectedLink(null)} className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl shadow-sm transition-all"><X size={20} /></button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ENGAGEMENT BAR — Emoji Reactions + Share */}
                                                <div className="flex flex-wrap items-center gap-2 p-4 bg-white dark:bg-surface-dark-900 rounded-[24px] border border-gray-100 dark:border-white/5 shadow-md">
                                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">React:</span>
                                                    {(['🔥', '❤️', '👏', '😮'] as const).map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(emoji)}
                                                            title={`React with ${emoji}`}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold transition-all duration-200 active:scale-90 select-none ${userReacted === emoji
                                                                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20 scale-110'
                                                                : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-red-400 hover:scale-105 dark:text-white'
                                                                }`}
                                                        >
                                                            {emoji}
                                                            {(reactions[emoji] || 0) > 0 && (
                                                                <span className="text-[10px] font-black tabular-nums">{reactions[emoji]}</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('🔗 Link copied! Share with friends'); }}
                                                        className="ml-auto flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:scale-105 transition-all active:scale-95"
                                                    >
                                                        <Share2 size={12} /> Share Stream
                                                    </button>
                                                </div>

                                                {selectedLink.poll && (
                                                    <div className="w-full bg-white dark:bg-surface-dark-900 rounded-[32px] p-5 md:p-6 border border-gray-200 dark:border-white/10 shadow-xl transition-all">
                                                        <div className="flex flex-col md:flex-row items-center gap-6">
                                                            <div className="flex items-center gap-4 min-w-fit">
                                                                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                                                                    <Vote size={24} />
                                                                </div>
                                                                <div className="hidden sm:block text-left">
                                                                    <h4 className="text-[12px] font-black uppercase text-gray-900 dark:text-white leading-none">Who will win?</h4>
                                                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Global Prediction</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {[
                                                                    { id: 'A', name: selectedLink.poll.teamA, votes: selectedLink.poll.votesA || 0, color: 'from-blue-600 to-indigo-600', bg: 'bg-blue-500/10' },
                                                                    { id: 'B', name: selectedLink.poll.teamB, votes: selectedLink.poll.votesB || 0, color: 'from-red-600 to-orange-600', bg: 'bg-red-500/10' }
                                                                ].map((item) => {
                                                                    const totalVotes = (selectedLink.poll.votesA || 0) + (selectedLink.poll.votesB || 0);
                                                                    const pct = totalVotes > 0 ? Math.round((item.votes / totalVotes) * 100) : 0;
                                                                    const hasVoted = selectedLink.poll.votedUserIds?.includes(user?.id || '');

                                                                    return (
                                                                        <button
                                                                            key={item.id}
                                                                            disabled={isVoting || hasVoted}
                                                                            onClick={() => handleVote(item.id as 'A' | 'B')}
                                                                            className={`relative h-14 w-full rounded-2xl border transition-all overflow-hidden flex items-center justify-between px-6 group ${hasVoted ? 'border-transparent bg-gray-50 dark:bg-white/5 cursor-default' : 'border-gray-100 dark:border-white/5 hover:border-red-500 bg-white dark:bg-white/5 shadow-sm active:scale-[0.98]'}`}
                                                                        >
                                                                            <div
                                                                                className={`absolute left-0 bottom-0 top-0 bg-gradient-to-r ${item.color} ${hasVoted ? 'opacity-20' : 'opacity-10 group-hover:opacity-20'} transition-all duration-1000`}
                                                                                style={{ width: `${pct}%` }}
                                                                            />
                                                                            <div className="relative z-10 flex items-center gap-3">
                                                                                <span className={`text-[12px] font-black uppercase transition-colors ${hasVoted ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 group-hover:text-red-500'}`}>
                                                                                    {item.name}
                                                                                </span>
                                                                                {!hasVoted && (
                                                                                    <div className="px-2 py-0.5 bg-red-600 text-[8px] font-black text-white rounded uppercase opacity-0 group-hover:opacity-100 transition-opacity">Vote</div>
                                                                                )}
                                                                            </div>
                                                                            <span className="relative z-10 text-sm font-black text-gray-900 dark:text-white">
                                                                                {pct}%
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="w-full lg:w-[40%] flex flex-col h-auto">
                                        <div className="relative h-full flex flex-col bg-gradient-to-br from-white via-red-50/30 to-orange-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-orange-950/20 rounded-[32px] border-2 border-red-200 dark:border-red-900/50 shadow-xl overflow-hidden min-h-[500px] lg:min-h-0 lg:h-full">
                                            <div className="relative p-4 md:p-6 flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg text-white shadow-red-500/20"><MessageCircle size={18} /></div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Discussion</h4>
                                                                <span className="px-1.5 py-0.5 bg-red-600 text-[8px] font-black text-white rounded-md animate-pulse">LIVE</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getChannelComments().length} Points</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {user?.role === 'admin' && <button onClick={handleClearComments} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Shield size={16} /></button>}
                                                        <button onClick={() => setShowDiscussions(!showDiscussions)} className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 lg:hidden">{showDiscussions ? 'Hide Feed' : 'Show Feed'}</button>
                                                    </div>
                                                </div>
                                                <div className={`flex flex-col h-full overflow-hidden ${showDiscussions ? '' : 'hidden lg:flex'}`}>
                                                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-4 border border-red-100 dark:border-red-800/30 shadow-sm mb-4">
                                                        <div className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">{(user?.name?.[0] || 'Y').toUpperCase()}</div>
                                                            <textarea
                                                                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                                                                placeholder="Share thoughts..."
                                                                className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-xs dark:text-white outline-none focus:ring-1 focus:ring-red-500 resize-none transition-all"
                                                                rows={2}
                                                            />
                                                        </div>
                                                        <div className="flex justify-end mt-3">
                                                            <button
                                                                onClick={(e) => handlePostComment(e)}
                                                                disabled={!commentText.trim()}
                                                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg active:scale-95 disabled:opacity-50"
                                                            >Post Comment</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4 pb-4">
                                                        {getChannelComments().length > 0 ? (
                                                            getChannelComments().filter(c => !c.parentId).map((comment) => (
                                                                <div key={comment.id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-red-500/20">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0">
                                                                            {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : comment.userName?.[0]}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className={`text-[11px] font-black truncate ${comment.userRole === 'admin' ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{comment.userName}</span>
                                                                                <span className="text-[9px] text-gray-400 font-bold uppercase whitespace-nowrap">{formatTimeAgo(comment.timestamp)}</span>
                                                                            </div>
                                                                            <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">{comment.text}</p>
                                                                            <div className="flex gap-4 mt-2">
                                                                                <button onClick={() => handleLikeComment(comment.id)} className={`flex items-center gap-1 text-[9px] font-black ${comment.likes?.includes(user?.id) ? 'text-red-500' : 'text-gray-400'}`}><Heart size={10} fill={comment.likes?.includes(user?.id) ? "currentColor" : "none"} /> {comment.likes?.length || 0}</button>
                                                                                <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-[9px] font-black text-gray-400 hover:text-red-600 flex items-center gap-1"><Reply size={10} /> Reply</button>
                                                                            </div>
                                                                            {replyingTo === comment.id && (
                                                                                <div className="mt-2 flex gap-2"><input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Reply..." className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 text-[10px] rounded-lg border outline-none" /><button onClick={(e) => handlePostComment(e, comment.id)} className="px-3 bg-red-600 text-white rounded-lg text-[9px] font-bold">Send</button></div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center h-full opacity-30 select-none grayscale"><MessageCircle size={40} className="mb-2" /><p className="text-[10px] font-black uppercase tracking-widest text-center">No messages yet. Be the first!</p></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* CHANNEL PICKER & GRID */}
                            <div className="flex flex-col gap-6">
                                <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 via-gray-50/95 to-gray-50/80 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-gray-200/50 dark:border-white/5 shadow-sm md:shadow-none transition-all duration-300">
                                    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                                        <div className="flex items-center gap-2 bg-gray-200/50 dark:bg-white/5 p-1 rounded-2xl w-fit border border-gray-200/50 dark:border-white/5">
                                            <div className="px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-red-600 text-white shadow-xl shadow-red-600/20">
                                                <div className="flex items-center gap-2"><Trophy size={14} /> Live Sports</div>
                                            </div>
                                        </div>

                                        {isIPTVMode && (
                                            <div className="flex flex-col gap-4">
                                                <div className="relative w-full max-w-xl group">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search among thousands of TV channels..."
                                                        value={iptvSearch}
                                                        onChange={(e) => setIptvSearch(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-white/5 rounded-2xl text-sm outline-none dark:text-white focus:border-red-500/50 focus:ring-8 focus:ring-red-500/5 transition-all shadow-md group-hover:shadow-lg placeholder:text-gray-400 font-medium"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                                    {iptvTags.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setIptvTag(tag)}
                                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${iptvTag === tag
                                                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20 active:scale-95'
                                                                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:border-red-500/50 hover:text-red-500'
                                                                }`}
                                                        >
                                                            {tag === 'Trending' ? '🔥 Trending' : tag === 'Default' ? '✨ Default' : tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {!isIPTVMode && (
                                            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                                                {allTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => setSelectedTag(tag)}
                                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${selectedTag === tag
                                                            ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20 active:scale-95'
                                                            : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:border-red-500/50 hover:text-red-500'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {selectedTag === 'All' ? (
                                        allTags.filter(tag => tag !== 'All').map(tag => {
                                            const matchesInTag = sortMatches(links.filter(l => l.tags?.includes(tag)));
                                            if (matchesInTag.length === 0) return null;
                                            return (
                                                <div key={tag} className="space-y-6">
                                                    <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                                                        <div className="w-2 h-8 bg-red-600 rounded-full" />
                                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{tag}</h2>
                                                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 text-[10px] font-bold rounded-lg uppercase">{matchesInTag.length} Items</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 transition-all duration-500">
                                                        {matchesInTag.map((link) => (
                                                            <LiveMatchCard key={link.id} link={link} selectedLink={selectedLink} handleLinkClick={handleLinkClick} getWatchingCount={getWatchingCount} user={user} updateLiveLink={updateLiveLink} setLinks={setLinks} setLiveLinkDefault={setLiveLinkDefault} showToast={showToast} />
                                                        ))}
                                                    </div>

                                                    {/* AD AFTER CATEGORY */}
                                                    <div className="w-full !my-8">
                                                        {/* DESKTOP & TABS */}
                                                        <div className="hidden md:flex justify-center items-center overflow-hidden" style={{ minHeight: '120px' }}>
                                                            <GoogleAdSense
                                                                slot="1229236704"
                                                                format="horizontal"
                                                                responsive={false}
                                                                minHeight="120px"
                                                                style={{ width: '728px', height: '120px' }}
                                                            />
                                                        </div>
                                                        {/* MOBILE */}
                                                        <div className="flex md:hidden justify-center items-center overflow-hidden" style={{ minHeight: '100px' }}>
                                                            <GoogleAdSense
                                                                slot="1557976551"
                                                                format="horizontal"
                                                                responsive={false}
                                                                minHeight="100px"
                                                                style={{ width: '320px', height: '100px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                                                <div className="w-2 h-8 bg-red-600 rounded-full" />
                                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedTag}</h2>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 transition-all duration-500">
                                                {sortMatches(filteredLinks).map((link) => (
                                                    <LiveMatchCard key={link.id} link={link} selectedLink={selectedLink} handleLinkClick={handleLinkClick} getWatchingCount={getWatchingCount} user={user} updateLiveLink={updateLiveLink} setLinks={setLinks} setLiveLinkDefault={setLiveLinkDefault} showToast={showToast} />
                                                ))}
                                            </div>

                                            {/* AD AFTER CATEGORY */}
                                            <div className="w-full !my-8">
                                                {/* DESKTOP & TABS */}
                                                <div className="hidden md:flex justify-center items-center overflow-hidden" style={{ minHeight: '120px' }}>
                                                    <GoogleAdSense
                                                        slot="1229236704"
                                                        format="horizontal"
                                                        responsive={false}
                                                        minHeight="120px"
                                                        style={{ width: '728px', height: '120px' }}
                                                    />
                                                </div>
                                                {/* MOBILE */}
                                                <div className="flex md:hidden justify-center items-center overflow-hidden" style={{ minHeight: '100px' }}>
                                                    <GoogleAdSense
                                                        slot="1557976551"
                                                        format="horizontal"
                                                        responsive={false}
                                                        minHeight="100px"
                                                        style={{ width: '320px', height: '100px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {selectedTag === 'All' && links.filter(l => !l.tags || l.tags.length === 0).length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
                                                <div className="w-2 h-8 bg-gray-400 rounded-full" />
                                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Other Channels</h2>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                                                {sortMatches(links.filter(l => !l.tags || l.tags.length === 0)).map((link) => (
                                                    <LiveMatchCard key={link.id} link={link} selectedLink={selectedLink} handleLinkClick={handleLinkClick} getWatchingCount={getWatchingCount} user={user} updateLiveLink={updateLiveLink} setLinks={setLinks} setLiveLinkDefault={setLiveLinkDefault} showToast={showToast} />
                                                ))}
                                            </div>

                                            {/* AD AFTER CATEGORY */}
                                            <div className="w-full !my-8">
                                                {/* DESKTOP & TABS */}
                                                <div className="hidden md:flex justify-center items-center overflow-hidden" style={{ minHeight: '120px' }}>
                                                    <GoogleAdSense
                                                        slot="1229236704"
                                                        format="horizontal"
                                                        responsive={false}
                                                        minHeight="120px"
                                                        style={{ width: '728px', height: '120px' }}
                                                    />
                                                </div>
                                                {/* MOBILE */}
                                                <div className="flex md:hidden justify-center items-center overflow-hidden" style={{ minHeight: '100px' }}>
                                                    <GoogleAdSense
                                                        slot="1557976551"
                                                        format="horizontal"
                                                        responsive={false}
                                                        minHeight="100px"
                                                        style={{ width: '320px', height: '100px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ON DEMAND REQUEST */}
                                <div className="mt-8 grid lg:grid-cols-2 gap-8 items-center bg-white dark:bg-gray-800/50 p-8 md:p-12 rounded-[32px] border dark:border-white/10 shadow-xl overflow-hidden relative group/ondemand">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/ondemand:scale-110 transition-all"><MessageCircle size={150} className="text-red-500" /></div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4">On <span className="text-red-600">Demand</span> Request</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">Can't find your match? Send us a request and we'll try to add it for you instantly.</p>
                                        <div className="flex gap-4"><div className="flex items-center gap-2 text-xs font-bold text-accent-success"><CheckCircle size={16} /> Fast Support</div><div className="flex items-center gap-2 text-xs font-bold text-accent-success"><CheckCircle size={16} /> 24/7 Monitoring</div></div>
                                    </div>
                                    <form onSubmit={handleOnDemandSubmit} className="space-y-4 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl relative z-10">
                                        <input type="text" placeholder="Your Name" value={onDemandName} onChange={(e) => setOnDemandName(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-700 focus:border-red-500 transition-all" required />
                                        <textarea placeholder="Match or Channel Name (e.g. Star Sports HD, IPL Match)" value={onDemandMessage} onChange={(e) => setOnDemandMessage(e.target.value)} rows={3} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-700 focus:border-red-500 transition-all" required />
                                        <button type="submit" className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase shadow-xl flex items-center justify-center gap-2">Send Request <MessageCircle size={18} /></button>
                                    </form>
                                </div>

                                <div className="flex justify-center mt-3">
                                    <GoogleAdSense
                                        slot="7838572857"
                                        format="horizontal"
                                        responsive={false}
                                        minHeight="50px"
                                        fallbackImage="/cover.png"
                                        style={{ width: '100%', maxWidth: '728px', height: '50px' }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* TOAST NOTIFICATION */}
            {toastMsg && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-gray-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-6 py-3 rounded-2xl shadow-2xl border border-white/10 dark:border-black/5 flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white"><CheckCircle size={14} /></div>
                        <span className="text-sm font-black uppercase tracking-tight">{toastMsg}</span>
                    </div>
                </div>
            )}
        </section>
    );
};