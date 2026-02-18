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
import { getLiveMatches } from '../services/matches';
import { getR2LiveLinks, getR2IPTVChannels } from '../services/r2-data';
import { useAuth } from '../context/AuthContext';
import { parseM3U } from '../lib/m3uParser';
import { LiveLink } from '../types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleAdSense from './GoogleAdSense';
import { X, Play, Radio, Vote, Trophy, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle, Share2, Facebook, MessageCircle, ArrowLeft, Bookmark, Link2, TrendingUp, Newspaper, Maximize, Clock, Volume2, VolumeX, Shield, Search, User, Users, Hand, Heart, Reply } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import HLSPlayer from './HLSPlayer';
import { M3UChannel } from '../lib/m3uParser';
import { APIMatch } from '../types';

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

export const LiveSection: React.FC = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [links, setLinks] = useState<LiveLink[]>([]);

    const [selectedLink, setSelectedLink] = useState<any>(null);

    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeScoreTab, setActiveScoreTab] = useState<'football' | 'cricket'>('football');
    const [cricketScores, setCricketScores] = useState<APIMatch[]>([]);
    const [liveMatches, setLiveMatches] = useState<APIMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [loadingSports, setLoadingSports] = useState(false);
    const [sports, setSports] = useState<{ id: string; name: string }[]>([]);
    const [selectedSport, setSelectedSport] = useState<string>('all');
    const [loadingCricket, setLoadingCricket] = useState(false);
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
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const playerRef = React.useRef<HTMLDivElement>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Removed adCountdown

    const handleLinkClick = (link: any) => {
        if (selectedLink?.id === link.id) return;
        setPendingLink(null);
        setSelectedLink(link); // Directly play
        // Update URL without full refresh to enable tracking per channel
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.set('v', link.id);
        router.push(`/tools/live-tv?${params.toString()}`, { scroll: false });
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

    useEffect(() => {
        setIsMounted(true);
        const loadInitialData = async () => {
            try {
                const [fetchedLinks, config, r2Channels] = await Promise.all([
                    getR2LiveLinks(),
                    getIPTVConfig(),
                    getR2IPTVChannels()
                ]);

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
                    setShowAd(false);
                }

            } catch (error) {
                console.error('Error in initial load:', error);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadInitialData();

        // Fetch Live Matches from new API
        const fetchLiveMatches = async () => {
            setLoadingMatches(true);
            try {
                const data = await getLiveMatches();
                setLiveMatches(data);
            } catch (err) {
                console.error('Failed to fetch live matches:', err);
            } finally {
                setLoadingMatches(false);
            }
        };

        const fetchSportsList = async () => {
            setLoadingSports(true);
            try {
                const { getSports } = await import('../services/matches');
                const data = await getSports();
                setSports(data);
            } catch (err) {
                console.error('Failed to fetch sports:', err);
            } finally {
                setLoadingSports(false);
            }
        };

        fetchLiveMatches();
        fetchSportsList();

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
        if (selectedSport !== 'all') {
            const fetchBySport = async () => {
                setLoadingMatches(true);
                try {
                    const { getMatchesBySport } = await import('../services/matches');
                    const data = await getMatchesBySport(selectedSport);
                    setLiveMatches(data);
                } catch (err) {
                    console.error('Failed to fetch matches:', err);
                } finally {
                    setLoadingMatches(false);
                }
            };
            fetchBySport();
        } else {
            // Re-fetch all live matches if switching back to 'all'
            const fetchAll = async () => {
                setLoadingMatches(true);
                try {
                    const data = await getLiveMatches();
                    setLiveMatches(data);
                } catch (err) { }
                finally { setLoadingMatches(false); }
            };
            fetchAll();
        }
    }, [selectedSport]);

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



    const allTags = ['All', ...Array.from(new Set(links.flatMap(link => link.tags || [])))];
    const filteredLinks = selectedTag === 'All' ? links : links.filter(link => link.tags?.includes(selectedTag));

    const trendingItems = Array.from(new Map([
        ...links.filter(l => l.isTrending).map(l => ({ ...l, itemType: 'sports' })),
        ...iptvChannels.filter(c => c.isTrending).map(c => ({
            id: c.id, heading: c.name, iframeUrl: c.url, isHLS: c.url.includes('.m3u8'),
            tags: [c.group], isIPTV: true, itemType: 'iptv', trendingOrder: c.trendingOrder
        }))
    ].map(item => [`${item.itemType}-${item.id}`, item])).values());

    const getWatchingCount = (id: string, onlyWatching: boolean = true) => {
        if (!realtimeStats.activePages) return 0;
        // Search for users on /tools/live-tv?v=ID
        const match = realtimeStats.activePages.find(p => p.slug.includes(`v=${id}`));
        if (!match) return 0;
        return onlyWatching ? (match.watchingCount || 0) : (match.count || 0);
    };

    if (!isMounted) return null;

    return (
        <section id="live-section" className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-light/5 via-transparent opacity-50 pointer-events-none" />

            <div className="py-6 md:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="space-y-4 md:space-y-8">

                    {/* HD Alert */}
                    <div className="bg-accent-success/5 border-accent-success/20 border rounded-card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent-success/20 flex items-center justify-center text-accent-success"><Clock size={20} /></div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Please be patient — HD channels may take a moment to load</p>
                    </div>

                    {/* Top Ad */}
                    <div className="w-full flex justify-center items-center overflow-hidden" style={{ minHeight: '110px' }}>
                        <GoogleAdSense slot="7838572857" format="auto" minHeight="110px" responsive={false} style={{ display: 'block', width: '100%', height: '110px' }} />
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
                                            {trendingItems.sort((a, b) => (a.trendingOrder ?? 999) - (b.trendingOrder ?? 999)).map((link) => (
                                                <SplideSlide key={`${link.itemType}-${link.id}`}>
                                                    <button onClick={() => handleLinkClick(link)} className="w-full block group text-left">
                                                        <div className={`relative flex items-center gap-2 md:gap-3 p-2 md:p-2.5 bg-white dark:bg-surface-dark-900 rounded-xl md:rounded-2xl border transition-all ${selectedLink?.id === link.id ? 'border-primary-light ring-2 ring-primary-light/20 bg-primary-50/10 shadow-md' : 'border-slate-200 dark:border-slate-800'}`}>
                                                            <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all ${selectedLink?.id === link.id ? 'bg-gradient-to-br from-primary-600 to-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-primary-light'}`}>
                                                                <span className="text-[5px] font-black tracking-widest mb-0.5">LIVE</span>
                                                                <div className={`h-1.5 w-1.5 rounded-full ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`} />
                                                            </div>
                                                            <h3 className={`text-[10px] font-bold line-clamp-2 dark:text-white`}>{link.heading}</h3>
                                                        </div>
                                                    </button>
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
                                                            <div className="w-full max-w-sm mb-6 bg-white/5 rounded-xl overflow-hidden"><GoogleAdSense slot="7838572857" format="rectangle" responsive={true} /></div>
                                                            <p className="text-gray-400 mb-8 max-w-sm">Sign in to watch <span className="text-white font-bold">{selectedLink.heading}</span>.</p>
                                                            <div className="flex gap-4 w-full max-w-xs"><Link href="/login" className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-black uppercase text-sm">Log In</Link><Link href="/signup" className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black uppercase text-sm">Sign Up</Link></div>
                                                        </div>
                                                    )}
                                                    {selectedLink.isHLS || (typeof selectedLink.iframeUrl === 'string' && selectedLink.iframeUrl.includes('.m3u8')) ? (
                                                        <HLSPlayer src={selectedLink.youtubeUrl || selectedLink.iframeUrl} className="w-full h-full [&>video]:object-cover" autoPlay={true} muted={isMuted} onReady={() => setIsWatching(true)} />
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
                                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-black uppercase rounded-md border border-green-200 dark:border-green-800/50">
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

                                                {/* STANDALONE LIVE POLL CARD */}
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
                                        <div className="relative h-full flex flex-col bg-gradient-to-br from-white via-red-50/30 to-orange-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-orange-950/20 rounded-[32px] border-2 border-red-200 dark:border-red-900/50 shadow-xl overflow-hidden min-h-[500px] lg:min-h-[690px] lg:max-h-[1100px]">
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
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl w-fit border border-gray-200 dark:border-white/5">
                                    <button onClick={() => setIsIPTVMode(false)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${!isIPTVMode ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Live Sports</button>
                                    <button onClick={() => setIsIPTVMode(true)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isIPTVMode ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>IPTV Channels</button>
                                </div>
                                {isIPTVMode && (
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input type="text" placeholder="Search Channels..." value={iptvSearch} onChange={(e) => setIptvSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border dark:border-white/10 rounded-xl text-sm outline-none dark:text-white" />
                                    </div>
                                )}
                                {!isIPTVMode && (
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map(tag => (
                                            <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTag === tag ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>{tag}</button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* GRID - Live Sports */}
                            {!isIPTVMode ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Tv size={24} className="text-secondary-light" />
                                        <h2 className="text-gray-900 dark:text-white">Available Channels</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredLinks
                                            .sort((a, b) => {
                                                const isAActive = selectedLink?.id === a.id;
                                                const isBActive = selectedLink?.id === b.id;
                                                if (isAActive !== isBActive) return isAActive ? -1 : 1;
                                                return 0;
                                            })
                                            .map((link) => (
                                                <div key={link.id} className="relative group/channel">
                                                    <button
                                                        onClick={() => handleLinkClick(link)}
                                                        className={`w-full group text-left relative overflow-hidden bg-white dark:bg-surface-dark-900 p-6 rounded-card border transition-all duration-300 ${selectedLink?.id === link.id
                                                            ? 'border-primary-light ring-2 ring-primary-light/20 shadow-lg'
                                                            : 'border-slate-200 dark:border-slate-800 hover:border-primary-light/50'
                                                            }`}
                                                    >
                                                        {link.isTrending && (
                                                            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-full shadow-sm z-10 animate-pulse">
                                                                <TrendingUp size={8} fill="currentColor" />
                                                                <span className="text-[7px] font-black uppercase tracking-tighter">HOT</span>
                                                            </div>
                                                        )}
                                                        {link.isDefault && (
                                                            <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-primary-600 text-white rounded-full shadow-sm z-10">
                                                                <Sparkles size={8} fill="currentColor" />
                                                                <span className="text-[7px] font-black uppercase tracking-tighter">DEFAULT</span>
                                                            </div>
                                                        )}
                                                        {selectedLink?.id === link.id && (
                                                            <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full border border-primary-200 dark:border-primary-800/50">
                                                                <span className="relative flex h-1.5 w-1.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-600 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-600"></span>
                                                                </span>
                                                                <span className="text-[8px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-tighter">NOW</span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col items-center text-center gap-4 md:flex-row md:text-left md:gap-4">
                                                            <div className={`flex-shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-500 relative overflow-hidden ${selectedLink?.id === link.id
                                                                ? 'bg-gradient-to-br from-primary-600 to-primary-dark text-white ring-2 ring-primary-light/30 shadow-lg'
                                                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/10 group-hover:text-primary-600 text-primary-light group-hover:scale-110'
                                                                }`}>
                                                                {selectedLink?.id === link.id && (
                                                                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                                )}
                                                                <Play size={20} fill="currentColor" className="relative z-10 ml-0.5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 w-full">
                                                                <h4 className={`font-bold text-sm md:text-base line-clamp-2 transition-colors ${selectedLink?.id === link.id
                                                                    ? 'text-primary-dark'
                                                                    : 'text-gray-900 dark:text-white group-hover:text-primary-light'
                                                                    }`}>
                                                                    {link.heading}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                                    {link.tags && link.tags.slice(0, 2).map((tag) => (
                                                                        <span key={tag} className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                                            #{tag}
                                                                        </span>
                                                                    ))}
                                                                    {user?.role === 'admin' && (
                                                                        <span className="flex items-center gap-1 text-[8px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">
                                                                            <Activity size={8} /> {getWatchingCount(link.id)} watching
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                    {user?.role === 'admin' && (
                                                        <div className="absolute -top-3 -right-2 flex flex-col gap-2 z-30">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        await updateLiveLink(link.id, { isTrending: !link.isTrending });
                                                                        setLinks(prev => prev.map(l =>
                                                                            l.id === link.id ? { ...l, isTrending: !link.isTrending } : l
                                                                        ));
                                                                    } catch (err) {
                                                                        console.error('Failed to toggle trending:', err);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${link.isTrending
                                                                    ? 'bg-amber-500 text-white border-amber-400'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-amber-500 hover:border-amber-500'}`}
                                                                title={link.isTrending ? "Remove Trending" : "Mark as Trending"}
                                                            >
                                                                <TrendingUp size={14} />
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        if (link.isDefault) {
                                                                            await updateLiveLink(link.id, { isDefault: false });
                                                                            setLinks(prev => prev.map(l =>
                                                                                l.id === link.id ? { ...l, isDefault: false } : l
                                                                            ));
                                                                        } else {
                                                                            await setLiveLinkDefault(link.id, true);
                                                                            setLinks(prev => prev.map(l => ({
                                                                                ...l,
                                                                                isDefault: l.id === link.id
                                                                            })));
                                                                            setIptvChannels(prev => prev.map(c => ({
                                                                                ...c,
                                                                                isDefault: false
                                                                            })));
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Failed to toggle default:', err);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${link.isDefault
                                                                    ? 'bg-primary-600 text-white border-primary-400'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-primary-600 hover:border-primary-600'}`}
                                                                title={link.isDefault ? "Remove Default" : "Set as Default"}
                                                            >
                                                                <Sparkles size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Tv size={24} className="text-secondary-light" />
                                            <h2 className="text-gray-900 dark:text-white">IPTV Channels ({iptvChannels.filter(c => hasFullList || c.isTrending).length})</h2>
                                        </div>
                                        {user?.role === 'admin' && !hasFullList && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const allChannels = await getIPTVChannels();
                                                        setIptvChannels(allChannels.map((c: any) => ({
                                                            id: c.id,
                                                            name: c.name,
                                                            url: c.url,
                                                            logo: c.logo || '',
                                                            group: c.category || 'Uncategorized',
                                                            isTrending: !!c.isTrending,
                                                            isDefault: !!c.isDefault,
                                                            trendingOrder: c.trendingOrder
                                                        })));
                                                        setHasFullList(true);
                                                    } catch (err) {
                                                        console.error('Failed to load full IPTV list:', err);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-primary-600/10 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-600 hover:text-white transition-all border border-primary-600/20"
                                            >
                                                Load Full Channel List (Saves Data)
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                                        {iptvChannels
                                            .filter(c => {
                                                // Only show trending if full list filter is not active
                                                if (!hasFullList && !c.isTrending) return false;

                                                const matchesSearch = c.name.toLowerCase().includes(iptvSearch.toLowerCase());
                                                const matchesTag = iptvTag === 'All'
                                                    || (iptvTag === 'Trending' && !!c.isTrending)
                                                    || (iptvTag === 'Default' && !!c.isDefault)
                                                    || c.group === iptvTag;
                                                return matchesSearch && matchesTag;
                                            })
                                            .sort((a, b) => {
                                                const isAActive = selectedLink?.id === a.id;
                                                const isBActive = selectedLink?.id === b.id;
                                                if (isAActive !== isBActive) return isAActive ? -1 : 1;
                                                if (!!b.isTrending !== !!a.isTrending) return b.isTrending ? 1 : -1;
                                                if (!!b.isDefault !== !!a.isDefault) return b.isDefault ? 1 : -1;
                                                return a.name.localeCompare(b.name);
                                            })
                                            .slice(0, 300)
                                            .map((channel) => (
                                                <div key={channel.id} className="relative group/channel">
                                                    <button
                                                        onClick={() => handleIptvClick(channel)}
                                                        className={`w-full group text-left relative overflow-hidden bg-white dark:bg-surface-dark-900 p-4 rounded-xl border transition-all duration-300 ${selectedLink?.id === channel.id
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
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = 'https://i.imgur.com/guz2ajm.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Play size={18} className="text-primary-light" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0 w-full">
                                                                <h4 className={`font-bold text-[11px] md:text-xs line-clamp-1 transition-colors ${selectedLink?.id === channel.id
                                                                    ? 'text-primary-dark'
                                                                    : 'text-gray-900 dark:text-white group-hover:text-primary-light'
                                                                    }`}>
                                                                    {channel.name}
                                                                </h4>
                                                                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                                                                    {channel.group && (
                                                                        <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                                                            {channel.group}
                                                                        </span>
                                                                    )}
                                                                    {user?.role === 'admin' && (
                                                                        <span className="flex items-center gap-1 text-[8px] font-bold text-green-600 dark:text-green-500 uppercase tracking-wider">
                                                                            <Activity size={8} /> {getWatchingCount(channel.id)} watching
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {user?.role === 'admin' && (
                                                        <div className="absolute -top-3 -right-2 flex flex-col gap-2 z-30">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        await upsertIPTVChannel(channel, { isTrending: !channel.isTrending });
                                                                        setIptvChannels(prev => prev.map(c =>
                                                                            c.id === channel.id ? { ...c, isTrending: !channel.isTrending } : c
                                                                        ));
                                                                    } catch (err) {
                                                                        console.error('Failed to toggle trending:', err);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${channel.isTrending
                                                                    ? 'bg-amber-500 text-white border-amber-400'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-amber-500 hover:border-amber-500'}`}
                                                                title={channel.isTrending ? "Remove Trending" : "Mark as Trending"}
                                                            >
                                                                <TrendingUp size={14} />
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        if (channel.isDefault) {
                                                                            await upsertIPTVChannel(channel, { isDefault: false });
                                                                            setIptvChannels(prev => prev.map(c =>
                                                                                c.id === channel.id ? { ...c, isDefault: false } : c
                                                                            ));
                                                                        } else {
                                                                            await setDefaultIPTVChannel(channel);
                                                                            setIptvChannels(prev => prev.map(c => ({
                                                                                ...c,
                                                                                isDefault: c.id === channel.id
                                                                            })));
                                                                            setLinks(prev => prev.map(l => ({
                                                                                ...l,
                                                                                isDefault: false
                                                                            })));
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Failed to toggle default:', err);
                                                                    }
                                                                }}
                                                                className={`p-2 rounded-full shadow-xl border-2 transition-all transform hover:scale-110 active:scale-95 ${channel.isDefault
                                                                    ? 'bg-primary-600 text-white border-primary-400'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:text-primary-600 hover:border-primary-600'}`}
                                                                title={channel.isDefault ? "Remove Default" : "Set as Default"}
                                                            >
                                                                <Sparkles size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        {iptvChannels.filter(c => c.name.toLowerCase().includes(iptvSearch.toLowerCase())).length === 0 && (
                                            <div className="col-span-full py-12 text-center">
                                                <div className="bg-gray-100 dark:bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Search size={32} className="text-gray-400" />
                                                </div>
                                                <h3 className="text-gray-900 dark:text-white font-bold mb-1">No channels found</h3>
                                                <p className="text-gray-500 text-sm">Try searching for a different keyword</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* AdSense: Above Live Scores */}
                            <div className="w-full flex justify-center items-center overflow-hidden my-6" style={{ minHeight: '110px' }}>
                                <GoogleAdSense slot="7838572857" format="auto" minHeight="110px" responsive={false} style={{ display: 'block', width: '100%', height: '110px' }} />
                            </div>

                            {/* LIVESCORE TAB */}
                            <div className="space-y-4 mt-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-2xl bg-primary-light/10 text-primary-light border border-primary-light/20">
                                            <Activity className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-gray-900 dark:text-white">Live Match <span className="gradient-text">Scores</span></h2>
                                            {liveMatches.length > 0 && (
                                                <p className="text-[10px] font-bold text-accent-success uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                                    <span className="flex h-1.5 w-1.5 rounded-full bg-accent-success animate-pulse" />
                                                    {liveMatches.length} matches currently live
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner overflow-x-auto no-scrollbar max-w-full">
                                        <button onClick={() => setSelectedSport('all')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedSport === 'all' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500'}`}>🔥 Live Now</button>
                                        {sports.map((sport) => (
                                            <button
                                                key={sport.id}
                                                onClick={() => setSelectedSport(sport.id)}
                                                className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${selectedSport === sport.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500'}`}
                                            >
                                                {sport.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 min-h-[400px]">
                                    {activeScoreTab === 'football' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {loadingMatches ? (
                                                <div className="col-span-full py-20 text-center dark:text-white flex flex-col items-center justify-center gap-4">
                                                    <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                                                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Syncing Live Matches...</p>
                                                </div>
                                            ) : liveMatches.length > 0 ? (
                                                liveMatches.map((match) => (
                                                    <div key={match.id} className="group relative bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-6 border border-transparent hover:border-primary-600/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-600/10">
                                                        <div className="flex flex-col gap-6">
                                                            {/* Match Status & Category */}
                                                            <div className="flex items-center justify-between">
                                                                <span className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white text-[10px] font-black uppercase rounded-full animate-pulse shadow-lg shadow-primary-600/20">
                                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                                    Live
                                                                </span>
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{match.category}</span>
                                                            </div>

                                                            {/* Teams Grid */}
                                                            <div className="flex items-center justify-between gap-4">
                                                                {/* Home Team */}
                                                                <div className="flex-1 flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                        {match.teams?.home?.badge ? (
                                                                            <img src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`} alt={match.teams.home.name} className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <div className="text-2xl font-black text-primary-600">{(match.teams?.home?.name || 'H')[0]}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black text-gray-900 dark:text-white text-center line-clamp-1 uppercase">{match.teams?.home?.name || 'Home'}</span>
                                                                </div>

                                                                {/* VS Badge */}
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-tighter">VS</div>
                                                                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                                                                </div>

                                                                {/* Away Team */}
                                                                <div className="flex-1 flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                        {match.teams?.away?.badge ? (
                                                                            <img src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`} alt={match.teams.away.name} className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <div className="text-2xl font-black text-primary-600">{(match.teams?.away?.name || 'A')[0]}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black text-gray-900 dark:text-white text-center line-clamp-1 uppercase">{match.teams?.away?.name || 'Away'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Match Title & Info */}
                                                            <div className="text-center pt-2">
                                                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 line-clamp-2 min-h-[2.5rem]">{match.title}</h4>
                                                                <div className="flex items-center justify-center gap-4">
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                        <Clock size={12} />
                                                                        {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                    <div className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                                        <Share2 size={12} />
                                                                        {match.sources.length} Sources
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action Button */}
                                                            {/* Action Button hidden for now as requested */}
                                                            {/* <button
                                                                onClick={() => {
                                                                    console.log('Match sources:', match.sources);
                                                                }}
                                                                className="w-full py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-300 shadow-sm"
                                                            >
                                                                Watch Stream
                                                            </button> */}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-20 text-center">
                                                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em]">No Live Matches Right Now</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">Check back later for upcoming fixtures</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {loadingCricket ? (
                                                <div className="col-span-full py-20 text-center dark:text-white flex flex-col items-center justify-center gap-4">
                                                    <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                                                    <p className="text-sm font-bold uppercase tracking-widest opacity-50">Syncing Cricket Matches...</p>
                                                </div>
                                            ) : cricketScores.length > 0 ? (
                                                cricketScores.map((match) => (
                                                    <div key={match.id} className="group relative bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-6 border border-transparent hover:border-primary-600/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-600/10">
                                                        <div className="flex flex-col gap-6">
                                                            {/* Match Status & Category */}
                                                            <div className="flex items-center justify-between">
                                                                <span className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white text-[10px] font-black uppercase rounded-full animate-pulse shadow-lg shadow-primary-600/20">
                                                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                                    Live
                                                                </span>
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{match.category}</span>
                                                            </div>

                                                            {/* Teams Grid */}
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex-1 flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                        {match.teams?.home?.badge ? (
                                                                            <img src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`} alt={match.teams.home.name} className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <div className="text-2xl font-black text-primary-600">{(match.teams?.home?.name || 'H')[0]}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black text-gray-900 dark:text-white text-center line-clamp-1 uppercase">{match.teams?.home?.name || 'Home'}</span>
                                                                </div>

                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div className="px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-[10px] font-black text-gray-500 uppercase tracking-tighter">VS</div>
                                                                    <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                                                                </div>

                                                                <div className="flex-1 flex flex-col items-center gap-3">
                                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 p-3 shadow-md border border-gray-100 dark:border-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                        {match.teams?.away?.badge ? (
                                                                            <img src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`} alt={match.teams.away.name} className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <div className="text-2xl font-black text-primary-600">{(match.teams?.away?.name || 'A')[0]}</div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black text-gray-900 dark:text-white text-center line-clamp-1 uppercase">{match.teams?.away?.name || 'Away'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="text-center pt-2">
                                                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 line-clamp-2 min-h-[2.5rem]">{match.title}</h4>
                                                            </div>

                                                            {/* <button
                                                                className="w-full py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[10px] font-black uppercase rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-300 shadow-sm"
                                                            >
                                                                Watch Stream
                                                            </button> */}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-full py-20 text-center">
                                                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em]">No Cricket Matches Right Now</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AdSense: Below Live Scores */}
                            <div className="w-full flex justify-center items-center overflow-hidden my-8" style={{ minHeight: '110px' }}>
                                <GoogleAdSense slot="7838572857" format="auto" minHeight="110px" responsive={false} style={{ display: 'block', width: '100%', height: '110px' }} />
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

                            {/* AdSense: After On Demand Request */}
                            <div className="w-full flex justify-center items-center overflow-hidden my-10" style={{ minHeight: '110px' }}>
                                <GoogleAdSense slot="7838572857" format="auto" minHeight="110px" responsive={false} style={{ display: 'block', width: '100%', height: '110px' }} />
                            </div>



                            {/* NEWSLETTER */}
                            <div className="relative group/cta mt-16 pb-10">
                                <div className="relative bg-gradient-to-br from-red-600 to-orange-600 rounded-[2.5rem] p-10 md:p-16 text-white text-center shadow-2xl overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                    <h2 className="text-3xl md:text-5xl font-black mb-4">Stay <span className="text-yellow-300">Updated</span></h2>
                                    <p className="max-w-2xl mx-auto mb-10 text-white/80">Get instant notifications for match starts and exclusive streaming links.</p>
                                    {isSubscribed ? <div className="text-xl font-bold flex items-center justify-center gap-2"><CheckCircle size={24} /> You're on the list!</div> : (
                                        <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                                            <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Email address" className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white outline-none focus:bg-white/20 transition-all" required />
                                            <button type="submit" disabled={submitting} className="px-10 py-4 bg-white text-primary-600 font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl">{submitting ? <RefreshCw className="animate-spin" /> : 'Subscribe Now'}</button>
                                        </form>
                                    )}
                                </div>
                            </div>

                            {/* AdSense: Bottom Ad */}
                            <div className="w-full flex justify-center items-center overflow-hidden mt-10" style={{ minHeight: '110px' }}>
                                <GoogleAdSense slot="7838572857" format="auto" minHeight="110px" responsive={false} style={{ display: 'block', width: '100%', height: '110px' }} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section >
    );
};