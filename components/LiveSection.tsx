'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks, getHighlights, subscribeToNewsletter, getIPTVChannels, getIPTVConfig, updateIPTVChannel, setDefaultIPTVChannel, getTrendingIPTVChannels, updateLiveLink, setLiveLinkDefault } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { parseM3U } from '../lib/m3uParser';
import { LiveLink, Highlight } from '../types';
import Link from 'next/link';
import Image from 'next/image';
import GoogleAdSense from './GoogleAdSense';
import { X, Play, Radio, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle, Share2, Facebook, MessageCircle, ArrowLeft, Bookmark, Link2, TrendingUp, Newspaper, Maximize, Clock, Volume2, VolumeX, Shield, Search, User, Hand } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import HLSPlayer from './HLSPlayer';
import { M3UChannel } from '../lib/m3uParser';

// Custom styles to remove Splide padding
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


const splideOptionsHighlights = {
    perPage: 4,
    perMove: 1,
    gap: '1rem',
    arrows: true,
    pagination: false,
    drag: 'free',
    snap: false,
    breakpoints: {
        1024: { perPage: 3 },
        768: { perPage: 2 },
        480: { perPage: 1.5, gap: '0.75rem', arrows: false, pagination: true },
    },
};

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
    const [links, setLinks] = useState<LiveLink[]>([]);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [selectedLink, setSelectedLink] = useState<any>(null);

    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeScoreTab, setActiveScoreTab] = useState<'football' | 'cricket'>('football');
    const [cricketScores, setCricketScores] = useState<any[]>([]);
    const [loadingCricket, setLoadingCricket] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string>('All');
    // const [adTimer, setAdTimer] = useState(0); // Removed timer
    const [showAd, setShowAd] = useState(false);
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [onDemandName, setOnDemandName] = useState('');
    const [onDemandMessage, setOnDemandMessage] = useState('');
    const [playerKey, setPlayerKey] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showDiscussions, setShowDiscussions] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<{ id: string; channelId: string; text: string; timestamp: Date; }[]>([]);
    const [iptvChannels, setIptvChannels] = useState<M3UChannel[]>([]);
    const [isIPTVMode, setIsIPTVMode] = useState(false);
    const [iptvTag, setIptvTag] = useState<string>('All');
    const [iptvSearch, setIptvSearch] = useState('');
    const [iptvWatchTime, setIptvWatchTime] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [iptvConfig, setIptvConfig] = useState<any>(null);
    const { user } = useAuth();
    const playerRef = React.useRef<HTMLDivElement>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    const [canSkip, setCanSkip] = useState(false);

    const handleLinkClick = (link: any) => {
        if (selectedLink?.id === link.id) return;

        setPendingLink(link);
        setShowAd(true);
        setCanSkip(false);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const skipAd = () => {
        if (pendingLink) {
            setSelectedLink(pendingLink);
            setPendingLink(null);
        }
        setShowAd(false);
        setCanSkip(false);
        // Ensure we scroll to player when ad is skipped
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleIptvClick = (channel: M3UChannel) => {
        const liveLink: any = {
            id: channel.id,
            heading: channel.name,
            iframeUrl: channel.url,
            isHLS: channel.url.includes('.m3u8'),
            tags: [channel.group],
            isIPTV: true // Flag to distinguish for limit logic
        };
        handleLinkClick(liveLink);
    };

    // Detect ad click (window blur or iframe focus) to unlock
    useEffect(() => {
        const handleUnblock = () => {
            if (showAd) {
                skipAd();
            }
        };

        if (showAd) {
            window.addEventListener('blur', handleUnblock);

            // Robust check for desktop: if an iframe captures focus, it's an ad click
            const interval = setInterval(() => {
                if (document.activeElement instanceof HTMLIFrameElement && showAd) {
                    handleUnblock();
                }
            }, 500);

            return () => {
                window.removeEventListener('blur', handleUnblock);
                clearInterval(interval);
            };
        }
    }, [showAd]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Parallelize all metadata calls
                const [fetchedLinks, fetchedHighlights, config, dbTrendingChannels] = await Promise.all([
                    getLiveLinks(),
                    getHighlights(),
                    getIPTVConfig(),
                    getTrendingIPTVChannels()
                ]);

                setLinks(fetchedLinks);
                setHighlights(fetchedHighlights);
                setIptvConfig(config);

                // Initialize IPTV list with trending items
                const mappedDb: M3UChannel[] = dbTrendingChannels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    logo: c.logo || '',
                    group: c.category,
                    isTrending: !!c.isTrending,
                    isDefault: !!c.isDefault,
                    trendingOrder: c.trendingOrder
                }));

                let finalIptv = mappedDb;

                // Optimization: Skip remote fetch if we already have channels in Firestore
                if (mappedDb.length === 0 && config?.m3uUrl) {
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

                // Default selection logic - Prioritize explicit defaults first
                const defaultIptv = finalIptv.find(c => c.isDefault);
                const actualDefaultSports = fetchedLinks.find((link: LiveLink) => link.isDefault);
                const trendingSports = fetchedLinks.find((link: LiveLink) => link.isTrending);
                const trendingIptv = finalIptv.find(c => c.isTrending);
                const fallbackSports = fetchedLinks[0];

                let initialLink = null;
                let isIPTV = false;

                if (actualDefaultSports) {
                    initialLink = actualDefaultSports;
                    isIPTV = false;
                } else if (defaultIptv) {
                    initialLink = defaultIptv;
                    isIPTV = true;
                } else if (trendingSports) {
                    initialLink = trendingSports;
                    isIPTV = false;
                } else if (trendingIptv) {
                    initialLink = trendingIptv;
                    isIPTV = true;
                } else if (fallbackSports) {
                    initialLink = fallbackSports;
                    isIPTV = false;
                }

                if (initialLink) {
                    setIsIPTVMode(isIPTV);
                    const formattedLink: any = isIPTV ? {
                        id: (initialLink as any).id,
                        heading: (initialLink as any).name || (initialLink as any).heading,
                        iframeUrl: (initialLink as any).url || (initialLink as any).iframeUrl,
                        isHLS: ((initialLink as any).url || (initialLink as any).iframeUrl || '').includes('.m3u8'),
                        tags: (initialLink as any).group ? [(initialLink as any).group] : (initialLink as any).tags,
                        isIPTV: true
                    } : initialLink;

                    setPendingLink(formattedLink);
                    setShowAd(true);
                    setCanSkip(false);
                }

            } catch (error) {
                console.error('Error in initial load:', error);
            }
        };

        loadInitialData();
    }, [user?.role]);

    useEffect(() => {
        if (activeScoreTab === 'cricket' && cricketScores.length === 0) {
            setLoadingCricket(true);
            fetch('/api/cricket-scores')
                .then(res => res.json())
                .then(data => {
                    setCricketScores(data);
                    setLoadingCricket(false);
                })
                .catch(err => {
                    console.error('Failed to fetch cricket scores:', err);
                    setLoadingCricket(false);
                });
        }
    }, [activeScoreTab, cricketScores.length]);

    // IPTV/Sports Watch Time and Login Prompt logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Determine if current link should be limited
        const isIPTV = selectedLink?.isIPTV;
        const isSports = !isIPTV; // If not IPTV, it's a Live Sports link

        const shouldLimit = (isIPTV) || (isSports && iptvConfig?.enableSportsLimit);
        const limitSeconds = (iptvConfig?.guestLimitMinutes || 5) * 60;

        // Check if limit applies and user is NOT logged in
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
            // Reset if they are logged in, switched to unrestricted content, or closed player
            setIptvWatchTime(0);
            setShowLoginPrompt(false);
        }
        return () => clearInterval(interval);
    }, [selectedLink, user, showAd, iptvConfig]);

    // Auto-block ads when iframe loads
    useEffect(() => {
        if (iframeRef.current && selectedLink) {
            const iframe = iframeRef.current;

            const attemptAdBlock = () => {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        // Inject ad-blocking CSS
                        const style = iframeDoc.createElement('style');
                        style.textContent = `
                            /* Hide common ad elements */
                            [id*="ad-"],
                            [class*="ad-"],
                            [class*="popup"],
                            [class*="overlay"]:not([class*="video"]),
                            [id*="popup"],
                            div[style*="position: fixed"][style*="z-index: 9"],
                            iframe[src*="ads"],
                            iframe[src*="doubleclick"],
                            iframe[src*="googlesyndication"] {
                                display: none !important;
                                visibility: hidden !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }
                        `;
                        iframeDoc.head?.appendChild(style);
                    }
                } catch (e) {
                    // CORS restriction - expected for external iframes
                    console.log('Cannot inject ad-blocking styles due to CORS');
                }
            };

            // Try immediately
            attemptAdBlock();

            // Try again after iframe loads
            iframe.addEventListener('load', attemptAdBlock);

            // Try periodically for dynamically loaded ads
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
            console.error('Subscription failed:', error);
            alert('Subscription failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };


    const handleOnDemandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const whatsappNumber = '9779805671898';
        const prefilledMessage = `*ON DEMAND REQUEST*%0A%0A*Name:* ${onDemandName}%0A*Channel Name:* ${onDemandMessage}`;
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;
        window.open(whatsappUrl, '_blank');

        setOnDemandName('');
        setOnDemandMessage('');
    };

    const handleRefresh = () => {
        setPlayerKey(prev => prev + 1);
    };

    const toggleFullscreen = () => {
        if (playerRef.current) {
            if (!document.fullscreenElement) {
                playerRef.current.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (iframeRef.current) {
            try {
                // Try multiple methods to control audio
                const iframe = iframeRef.current;

                // Method 1: YouTube API
                iframe.contentWindow?.postMessage(
                    JSON.stringify({ event: 'command', func: isMuted ? 'unMute' : 'mute' }),
                    '*'
                );

                // Method 2: Generic mute command
                iframe.contentWindow?.postMessage(
                    { type: 'mute', value: !isMuted },
                    '*'
                );

                // Method 3: Try to access and mute video elements (may not work due to CORS)
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const videos = iframeDoc.querySelectorAll('video');
                        videos.forEach((video: any) => {
                            video.muted = !isMuted;
                        });
                    }
                } catch (e) {
                    // CORS restriction - expected for external iframes
                }
            } catch (e) {
                console.log('Cannot control iframe audio:', e);
            }
        }
    };

    const clearAds = () => {
        if (iframeRef.current) {
            try {
                const iframe = iframeRef.current;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

                if (iframeDoc) {
                    // Remove common ad elements
                    const adSelectors = [
                        'iframe[src*="ads"]',
                        'iframe[src*="doubleclick"]',
                        'iframe[src*="googlesyndication"]',
                        '[id*="ad"]',
                        '[class*="ad-"]',
                        '[class*="popup"]',
                        '[class*="overlay"]',
                        '[class*="modal"]',
                        'div[style*="position: fixed"]',
                        'div[style*="z-index: 9"]',
                    ];

                    adSelectors.forEach(selector => {
                        try {
                            const elements = iframeDoc.querySelectorAll(selector);
                            elements.forEach((el: any) => {
                                // Check if it's likely an ad (not the main video)
                                if (!el.querySelector('video') || el.querySelector('video').duration < 10) {
                                    el.remove();
                                }
                            });
                        } catch (e) {
                            // Continue with other selectors
                        }
                    });

                    alert('Attempted to clear ads. Note: Some ads may be protected by the iframe source.');
                } else {
                    alert('Cannot access iframe content due to browser security restrictions. Try the Refresh Player button instead.');
                }
            } catch (e) {
                alert('Cannot clear ads due to browser security restrictions. The iframe content is from a different domain.');
            }
        }
    };

    const handlePostComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !selectedLink) return;

        const newComment = {
            id: Date.now().toString(),
            channelId: selectedLink.id,
            text: commentText,
            timestamp: new Date(),
        };

        setComments([newComment, ...comments]);
        setCommentText('');
    };

    const getChannelComments = () => {
        if (!selectedLink) return [];
        return comments.filter(c => c.channelId === selectedLink.id);
    };

    const formatTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const groupedHighlights = highlights.reduce((acc, h) => {
        if (!acc[h.category]) acc[h.category] = [];
        acc[h.category].push(h);
        return acc;
    }, {} as Record<string, Highlight[]>);

    const allTags = ['All', ...Array.from(new Set(links.flatMap(link => link.tags || [])))];
    const filteredLinks = selectedTag === 'All'
        ? links
        : links.filter(link => link.tags?.includes(selectedTag));

    const iptvAllGroups = ['All', 'Trending', 'Default', ...Array.from(new Set(iptvChannels.map(c => c.group).filter(Boolean)))];

    const trendingItems = [
        ...links.filter(l => l.isTrending).map(l => ({ ...l, itemType: 'sports' })),
        ...iptvChannels.filter(c => c.isTrending).map(c => ({
            id: c.id,
            heading: c.name,
            iframeUrl: c.url,
            isHLS: (c.url || '').includes('.m3u8'),
            tags: [c.group],
            isIPTV: true,
            itemType: 'iptv',
            trendingOrder: c.trendingOrder
        }))
    ];

    return (
        <section id="live-section" className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
            {/* Custom Splide Styles */}
            <style dangerouslySetInnerHTML={{ __html: splideCustomStyles }} />

            {/* Design System Background Gradients */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-light/5 via-transparent to-primary-light/5 opacity-50 pointer-events-none" />

            <div className="py-6 md:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="space-y-4 md:space-y-8">
                    <div className="bg-accent-success/5 border-accent-success/20 border rounded-card p-4 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent-success/20 flex items-center justify-center text-accent-success">
                            <Clock size={20} />
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Please be patient — HD channels may take a moment to load
                        </p>
                    </div>

                    {/* Top Ad - Increased height for better fit */}
                    <div className="w-full flex justify-center min-h-[60px] md:min-h-[100px] max-h-[120px] md:max-h-none my-4 bg-gray-50 dark:bg-white/5 rounded-xl items-center overflow-hidden">
                        <GoogleAdSense
                            slot="7838572857"
                            format="horizontal"
                            responsive={false}
                            style={{ display: 'block', width: '100%', height: '110px' }}
                            className="flex justify-center"
                        />
                    </div>

                    {trendingItems.length > 0 && (
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                            <div className="shrink-0">
                                <button
                                    onClick={() => document.getElementById('trending-slider')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-bold uppercase tracking-wider hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                                >
                                    <TrendingUp size={16} className="animate-pulse" />
                                    Trending Now
                                </button>
                            </div>
                            <div className="w-full md:flex-1 min-w-0">
                                <Splide
                                    id="trending-slider"
                                    options={splideOptionsTrending}
                                    className=""
                                >
                                    {trendingItems
                                        .sort((a, b) => {
                                            // Primary Sort: User Defined Trending Order
                                            const orderA = a.trendingOrder ?? 999;
                                            const orderB = b.trendingOrder ?? 999;
                                            if (orderA !== orderB) return orderA - orderB;

                                            // Secondary Sort: Currently Playing Item First
                                            const isAActive = selectedLink?.id === a.id;
                                            const isBActive = selectedLink?.id === b.id;
                                            if (isAActive !== isBActive) return isAActive ? -1 : 1;
                                            return 0;
                                        })
                                        .map((link) => (
                                            <SplideSlide key={link.id}>
                                                <button
                                                    onClick={() => handleLinkClick(link)}
                                                    className={`w-full block group text-left ${selectedLink?.id === link.id ? 'scale-[0.98] transition-transform' : ''}`}
                                                >
                                                    <div className={`relative flex items-center gap-2 md:gap-3 p-2 md:p-2.5 bg-white dark:bg-surface-dark-900 rounded-xl md:rounded-2xl border transition-all active:scale-[0.97] cursor-pointer ${selectedLink?.id === link.id
                                                        ? 'border-primary-light ring-2 ring-primary-light/20 bg-primary-50/10 shadow-md'
                                                        : 'border-slate-200 dark:border-slate-800 group-hover:border-primary-light/50 shadow-sm hover:shadow-md'}`}
                                                    >
                                                        {selectedLink?.id === link.id && (
                                                            <div className="absolute top-1 right-1 md:top-2 md:right-2 flex items-center gap-1 md:gap-1.5 px-1.5 py-0.5 md:px-2 bg-primary-100 dark:bg-primary-900/30 rounded-full border border-primary-200 dark:border-primary-800/50 z-10">
                                                                <span className="relative flex h-1 w-1 md:h-1.5 md:w-1.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-600 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-1 w-1 md:h-1.5 md:w-1.5 bg-primary-600"></span>
                                                                </span>
                                                                <span className="text-[7px] md:text-[8px] font-black text-primary-700 dark:text-primary-400 uppercase tracking-tighter">NOW</span>
                                                            </div>
                                                        )}

                                                        <div className="relative group/icon flex-shrink-0">
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative z-10 overflow-hidden ${selectedLink?.id === link.id
                                                                ? 'bg-gradient-to-br from-primary-600 via-primary-dark to-orange-500 text-white shadow-lg shadow-primary-500/30 ring-2 ring-white/20'
                                                                : 'bg-gray-100 dark:bg-white/5 text-primary-light group-hover/icon:bg-primary-50 dark:group-hover/icon:bg-primary-900/20'
                                                                }`}>
                                                                {/* Glow effect for selected state */}
                                                                {selectedLink?.id === link.id && (
                                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent animate-pulse" />
                                                                )}

                                                                <span className={`text-[5px] md:text-[6px] font-black tracking-[0.2em] mb-0.5 transition-colors ${selectedLink?.id === link.id ? 'text-white/90' : 'text-gray-400 group-hover/icon:text-primary-600'}`}>LIVE</span>
                                                                <div className="relative">
                                                                    <div className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full flex items-center justify-center ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`}>
                                                                        <div className={`absolute h-full w-full rounded-full animate-ping opacity-75 ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`} />
                                                                        <div className={`h-0.5 w-0.5 md:h-1 md:w-1 rounded-full ${selectedLink?.id === link.id ? 'bg-primary-600' : 'bg-white'}`} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Decorative ring */}
                                                            <div className={`absolute -inset-0.5 md:-inset-1 rounded-lg md:rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-300 border border-primary-light/30 ${selectedLink?.id === link.id ? 'opacity-100 animate-pulse' : ''}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pr-8 md:pr-0">
                                                            <h3 className={`text-[10px] md:text-[11px] font-bold line-clamp-2 leading-tight transition-colors ${selectedLink?.id === link.id
                                                                ? 'text-red-700 dark:text-red-400'
                                                                : 'text-gray-900 dark:text-gray-100 group-hover:text-red-500'}`}
                                                            >
                                                                {link.heading}
                                                            </h3>
                                                        </div>
                                                    </div>
                                                </button>
                                            </SplideSlide>
                                        ))}
                                </Splide>
                            </div>
                        </div>
                    )}

                    {links.length > 0 && (
                        <div className="flex flex-col gap-3 md:gap-6">
                            {(selectedLink || showAd) && (
                                <div
                                    ref={playerRef}
                                    className="relative bg-black rounded-3xl overflow-hidden shadow-xl md:shadow-2xl border border-gray-200/50 dark:border-white/10 w-full"
                                >
                                    <div className="aspect-[4/3] md:aspect-video w-full relative">
                                        {showAd ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm group z-50">
                                                <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
                                                    {/* Internal Ad Unit - Restored per request */}
                                                    {/* Added onClick to simulate unlock for localhost/testing or if user clicks 'near' the ad */}
                                                    <div
                                                        onClick={() => {
                                                            // Fallback: If the user clicks the container area, we unblock the stream.
                                                            // Redirection for real ads is handled by the ad network itself.
                                                            skipAd();
                                                        }}
                                                        className="mb-6 w-full max-w-[336px] bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative shrink-0 cursor-pointer transition-all hover:border-white/30 hover:shadow-3xl"
                                                    >
                                                        <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-2xl select-none pointer-events-none">ADS</div>
                                                        <div className="relative z-10">
                                                            <GoogleAdSense
                                                                slot="7838572857"
                                                                className="w-full h-full min-h-[250px]"
                                                                format="rectangle"
                                                                responsive={true}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center text-center max-w-lg z-30">
                                                        <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse ring-4 ring-red-600/10">
                                                            <img
                                                                src="https://smoyjtogaiu8cxbm.public.blob.vercel-storage.com/single-tap_18407087.png"
                                                                alt="Tap to unlock"
                                                                className="w-16 h-16 object-contain animate-bounce invert"
                                                            />
                                                        </div>
                                                        <h3 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                                                            STREAM LOCKED
                                                        </h3>
                                                        <p className="text-gray-300 text-sm md:text-base font-medium max-w-sm mx-auto mb-8 border-t border-b border-white/10 py-4">
                                                            To start watching, please support us by clicking the <span className="text-white font-bold underline decoration-yellow-500 decoration-2 underline-offset-4">ADVERTISEMENT ABOVE</span>.
                                                        </p>
                                                    </div>
                                                </div>





                                                {pendingLink && (
                                                    <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-black/40 backdrop-blur-sm px-3 md:px-4 py-2 rounded-lg border border-white/10 z-20">
                                                        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase mb-1">Up Next:</p>
                                                        <p className="text-white text-[10px] md:text-xs font-black truncate max-w-[120px] md:max-w-[150px]">{pendingLink.heading}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : selectedLink && (
                                            <>
                                                {showLoginPrompt && !user && (
                                                    <div className="absolute inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                                                        <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-primary-600/40 animate-bounce">
                                                            <User size={40} className="text-white" />
                                                        </div>
                                                        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Login Required</h2>

                                                        {/* Added Ad to Popup */}
                                                        <div className="w-full max-w-sm mb-6 bg-white/5 rounded-xl overflow-hidden border border-white/10">
                                                            <GoogleAdSense
                                                                slot="7838572857"
                                                                format="rectangle"
                                                                responsive={true}
                                                            />
                                                        </div>

                                                        <p className="text-gray-400 max-w-sm mb-8 font-medium">
                                                            To continue watching <span className="text-white font-bold">{selectedLink.heading}</span> and enjoy unlimited IPTV streaming, please sign in to your account.
                                                        </p>
                                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                                                            <Link
                                                                href="/login"
                                                                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary-600/25 active:scale-95 text-center"
                                                            >
                                                                Log In
                                                            </Link>
                                                            <Link
                                                                href="/signup"
                                                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all backdrop-blur-sm active:scale-95 text-center"
                                                            >
                                                                Sign Up
                                                            </Link>
                                                        </div>
                                                        <p className="mt-8 text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                                                            Free {iptvConfig?.guestLimitMinutes || 5}-minute preview finished
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedLink.isHLS || (typeof selectedLink.iframeUrl === 'string' && selectedLink.iframeUrl.includes('.m3u8')) ? (
                                                    <HLSPlayer
                                                        src={selectedLink.youtubeUrl || selectedLink.iframeUrl}
                                                        className="w-full h-full [&>video]:object-cover"
                                                        autoPlay={true}
                                                        muted={isMuted}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full relative overflow-hidden">
                                                        <iframe
                                                            ref={iframeRef}
                                                            key={playerKey}
                                                            src={selectedLink.youtubeUrl || selectedLink.iframeUrl}
                                                            title={selectedLink.heading || selectedLink.title}
                                                            className="w-[100%] h-[100%] border-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.35] md:scale-100"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen;"
                                                            allowFullScreen
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {!showAd && selectedLink && (
                                        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 md:p-5 border-t border-gray-200 dark:border-white/10">
                                            <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-gray-100/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
                                                <button
                                                    onClick={handleRefresh}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-500 transition-all shadow-sm border border-gray-200 dark:border-white/5 group"
                                                >
                                                    <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
                                                    Refresh Player
                                                </button>
                                                <button
                                                    onClick={toggleMute}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-500 transition-all shadow-sm border border-gray-200 dark:border-white/5"
                                                >
                                                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                    {isMuted ? 'Unmute' : 'Mute'}
                                                </button>
                                                <button
                                                    onClick={toggleFullscreen}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-500 transition-all shadow-sm border border-gray-200 dark:border-white/5"
                                                >
                                                    <Maximize size={14} />
                                                    Fullscreen
                                                </button>
                                                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />
                                                <p className="hidden md:block text-[9px] font-bold text-gray-400 uppercase italic">
                                                    Use these controls to avoid clicking ads inside the video
                                                </p>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                                <div className="w-full md:flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <Link
                                                            href="/"
                                                            className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md mb-2"
                                                        >
                                                            <ArrowLeft className="w-2.5 h-2.5 mr-1" />
                                                            Home
                                                        </Link>
                                                    </div>
                                                    <h3 className="text-base sm:text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                                        {selectedLink.heading || selectedLink.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const url = window.location.href;
                                                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                                                        }}
                                                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-blue-600 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                        title="Share on Facebook"
                                                    >
                                                        <Facebook size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const url = window.location.href;
                                                            const text = "Watch Live on Bigyann! " + url;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                        }}
                                                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                                        title="Share on WhatsApp"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(window.location.href);
                                                            alert("Link copied to clipboard!");
                                                        }}
                                                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-primary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
                                                        title="Copy Page Link"
                                                    >
                                                        <Link2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                                            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                                                            if (isMobile) {
                                                                alert("To keep Bigyann on your phone: \n\n• iPhone: Tap the Share button below and select 'Add to Home Screen'. \n• Android: Tap the three dots at the top right and select 'Add to Home Screen'.");
                                                            } else {
                                                                const shortcut = isMac ? "Cmd+D" : "Ctrl+D";
                                                                alert(`To bookmark this page, press ${shortcut} on your keyboard.`);
                                                            }
                                                        }}
                                                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                                                        title="How to Bookmark"
                                                    >
                                                        <Bookmark size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedLink(null)}
                                                        className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                        title="Close player"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Discussions Section - Redesigned */}
                                            <div className="mt-6 relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-primary-500/10 to-orange-500/10 blur-2xl opacity-50 rounded-3xl" />
                                                <div className="relative bg-gradient-to-br from-white via-red-50/30 to-orange-50/30 dark:from-gray-800 dark:via-red-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800/50 shadow-xl overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
                                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />

                                                    <div className="relative p-4 md:p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2.5 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl shadow-lg">
                                                                    <MessageCircle size={20} className="text-white" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-lg font-black text-gray-900 dark:text-white">
                                                                        Channel Discussions
                                                                    </h4>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Share your thoughts with the community
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setShowDiscussions(!showDiscussions)}
                                                                className="px-4 py-2 bg-white dark:bg-gray-700 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all shadow-sm border border-red-200 dark:border-red-700"
                                                            >
                                                                {showDiscussions ? 'Hide' : 'Show'} Comments
                                                            </button>
                                                        </div>

                                                        {showDiscussions && (
                                                            <div className="space-y-4 animate-in slide-in-from-top duration-300">
                                                                <div className="bg-white dark:bg-gray-900/50 rounded-xl p-4 border border-red-100 dark:border-red-800/30 shadow-sm">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                            You
                                                                        </div>
                                                                        <div className="flex-1 space-y-3">
                                                                            <textarea
                                                                                value={commentText}
                                                                                onChange={(e) => setCommentText(e.target.value)}
                                                                                placeholder="What do you think about this channel? Share your experience..."
                                                                                className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                                                                                rows={3}
                                                                            />
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="text-xs text-gray-400">
                                                                                    💡 Be respectful and constructive
                                                                                </p>
                                                                                <button
                                                                                    onClick={handlePostComment}
                                                                                    disabled={!commentText.trim()}
                                                                                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                                                >
                                                                                    Post Comment
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Display Comments */}
                                                                {getChannelComments().length > 0 ? (
                                                                    <div className="pt-4 border-t-2 border-dashed border-red-200 dark:border-red-800/30 space-y-3">
                                                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                                            💬 {getChannelComments().length} Comment{getChannelComments().length !== 1 ? 's' : ''}
                                                                        </p>
                                                                        {getChannelComments().map((comment) => (
                                                                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-red-100 dark:border-red-800/20">
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                                                        U
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <span className="text-xs font-bold text-gray-900 dark:text-white">User</span>
                                                                                            <span className="text-xs text-gray-400">{formatTimeAgo(comment.timestamp)}</span>
                                                                                        </div>
                                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                                                            {comment.text}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="pt-4 border-t-2 border-dashed border-red-200 dark:border-red-800/30">
                                                                        <div className="text-center py-8">
                                                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                                                                                <MessageCircle size={28} className="text-red-400" />
                                                                            </div>
                                                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                                                                                No comments yet
                                                                            </p>
                                                                            <p className="text-xs text-gray-400">
                                                                                Be the first to start the conversation! 🎉
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {!showDiscussions && (
                                                            <div className="text-center py-3">
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    💬 Click "Show Comments" to join the discussion
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 bg-gray-100/50 dark:bg-white/5 p-1.5 rounded-2xl w-fit border border-gray-200 dark:border-white/5">
                                    <button
                                        onClick={() => setIsIPTVMode(false)}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${!isIPTVMode
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        Live Sports
                                    </button>
                                    <button
                                        onClick={() => setIsIPTVMode(true)}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${isIPTVMode
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        IPTV Channels
                                    </button>
                                </div>

                                {isIPTVMode && (
                                    <div className="relative w-full max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search IPTV channels..."
                                            value={iptvSearch}
                                            onChange={(e) => setIptvSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:border-red-500 focus:outline-none transition-all shadow-sm"
                                        />
                                        {iptvSearch && (
                                            <button
                                                onClick={() => setIptvSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!isIPTVMode ? (
                                    allTags.length > 1 && (
                                        <div className="z-10 relative">
                                            <div className="md:hidden mb-2">
                                                <select
                                                    value={selectedTag}
                                                    onChange={(e) => setSelectedTag(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-red-500 focus:outline-none transition-all"
                                                >
                                                    {allTags.map(tag => (
                                                        <option key={tag} value={tag}>
                                                            {tag === 'All' ? 'All Coverage' : tag}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="hidden md:flex flex-wrap gap-2 mb-4">
                                                {allTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => setSelectedTag(tag)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${selectedTag === tag
                                                            ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {tag === 'All' ? 'All Coverage' : tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="z-10 relative" />
                                )}
                            </div>

                            <div>
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
                                                                                // Clear defaults in both collections locally
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
                                                <h2 className="text-gray-900 dark:text-white">IPTV Channels ({iptvChannels.filter(c => c.name.toLowerCase().includes(iptvSearch.toLowerCase())).length})</h2>
                                            </div>
                                            {iptvChannels.length < 50 && (
                                                <button
                                                    onClick={async () => {
                                                        const allChannels = await getIPTVChannels();
                                                        setIptvChannels(allChannels.map((c: any) => ({
                                                            id: c.id,
                                                            name: c.name,
                                                            url: c.url,
                                                            logo: c.logo || '',
                                                            group: c.category,
                                                            isTrending: !!c.isTrending,
                                                            isDefault: !!c.isDefault
                                                        })));
                                                    }}
                                                    className="px-4 py-2 bg-primary-600/10 text-primary-600 rounded-xl text-xs font-bold hover:bg-primary-600 hover:text-white transition-all"
                                                >
                                                    Load Full Channel List (Saves Data)
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                                            {iptvChannels
                                                .filter(c => {
                                                    const matchesSearch = c.name.toLowerCase().includes(iptvSearch.toLowerCase());
                                                    const matchesTag = iptvTag === 'All'
                                                        || (iptvTag === 'Trending' && !!c.isTrending)
                                                        || (iptvTag === 'Default' && !!c.isDefault)
                                                        || c.group === iptvTag;
                                                    return matchesSearch && matchesTag;
                                                })
                                                .sort((a, b) => {
                                                    // 1. Prioritize active (selected) channel
                                                    const isAActive = selectedLink?.id === a.id;
                                                    const isBActive = selectedLink?.id === b.id;
                                                    if (isAActive !== isBActive) return isAActive ? -1 : 1;

                                                    // 2. Prioritize trending
                                                    if (!!b.isTrending !== !!a.isTrending) return b.isTrending ? 1 : -1;

                                                    // 3. Prioritize default
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
                                                                </div>
                                                            </div>
                                                        </button>

                                                        {user?.role === 'admin' && (
                                                            <div className="absolute -top-3 -right-2 flex flex-col gap-2 z-30">
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        try {
                                                                            await updateIPTVChannel(channel.id, { isTrending: !channel.isTrending });
                                                                            setIptvChannels(prev => prev.map(c =>
                                                                                c.id === channel.id ? { ...c, isTrending: !c.isTrending } : c
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
                                                                                await updateIPTVChannel(channel.id, { isDefault: false });
                                                                                setIptvChannels(prev => prev.map(c =>
                                                                                    c.id === channel.id ? { ...c, isDefault: false } : c
                                                                                ));
                                                                            } else {
                                                                                await setDefaultIPTVChannel(channel.id);
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
                            </div>

                            <div className="mt-4 bg-white dark:bg-gray-800/50 rounded-3xl p-6 md:p-10 border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden relative group/ondemand">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover/ondemand:scale-110 transition-transform duration-500">
                                    <MessageCircle size={120} className="text-red-500" />
                                </div>
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light/10 text-primary-light rounded-full label-micro !text-[10px] mb-4">
                                            <Sparkles size={12} />
                                            Request Live Channels
                                        </div>
                                        <h2 className="text-gray-900 dark:text-white mb-4">
                                            On <span className="gradient-text">Demand</span> Request
                                        </h2>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            Can't find your match? Send us a request! Tell us which channel or match you want to watch, and we'll try to add it for you instantly.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-accent-success/10 text-accent-success rounded-lg">
                                                    <CheckCircle size={16} />
                                                </div>
                                                <p className="label-micro !text-xs">Fast Support</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-accent-success/10 text-accent-success rounded-lg">
                                                    <CheckCircle size={16} />
                                                </div>
                                                <p className="label-micro !text-xs">24/7 Monitoring</p>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleOnDemandSubmit} className="bg-white dark:bg-surface-dark-900 p-8 rounded-card border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Your Name"
                                                value={onDemandName}
                                                onChange={(e) => setOnDemandName(e.target.value)}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <textarea
                                                placeholder="Name of Match or Channel (e.g. Star Sports HD 1, IPL Match)"
                                                value={onDemandMessage}
                                                onChange={(e) => setOnDemandMessage(e.target.value)}
                                                rows={3}
                                                className="input-field"
                                                required
                                            ></textarea>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full btn-primary"
                                        >
                                            Send Request
                                            <MessageCircle size={16} className="ml-2 inline" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center my-4">
                        <GoogleAdSense
                            slot="7838572857"
                            format="auto"
                            responsive={true}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary-light/10 border border-primary-light/20">
                                    <Activity className="w-7 h-7 text-primary-light" />
                                </div>
                                <div className="space-y-1">
                                    <span className="label-micro !text-primary-light">Real-Time Updates</span>
                                    <h2 className="text-gray-900 dark:text-white">
                                        Live Match <span className="gradient-text">Scores</span>
                                    </h2>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner self-start md:self-auto">
                                <button
                                    onClick={() => setActiveScoreTab('football')}
                                    className={`px-6 py-3 rounded-xl label-micro !text-[11px] transition-all duration-300 ${activeScoreTab === 'football'
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    ⚽ Football
                                </button>
                                <button
                                    onClick={() => setActiveScoreTab('cricket')}
                                    className={`px-6 py-3 rounded-xl label-micro !text-[11px] transition-all duration-300 ${activeScoreTab === 'cricket'
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    🏏 Cricket
                                </button>
                            </div>
                        </div>

                        <div className="relative bg-white dark:bg-surface-dark-900 rounded-card p-6 md:p-10 border border-slate-200 dark:border-slate-800 min-h-[400px] overflow-hidden shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-primary-500/5 to-red-500/5 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

                            {activeScoreTab === 'football' ? (
                                <div className="relative z-10 w-full h-[650px] rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 shadow-inner">
                                    <iframe
                                        src="https://www.scorebat.com/embed/livescore/"
                                        className="w-full h-full border-0"
                                        title="Live Football Scores"
                                        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                                    />
                                </div>
                            ) : (
                                <div className="relative z-10 w-full min-h-[400px]">
                                    {loadingCricket ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <RefreshCw className="animate-spin text-red-500 mb-4" size={32} />
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching Live Scores...</p>
                                        </div>
                                    ) : cricketScores.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {cricketScores.map((match) => (
                                                <a
                                                    key={match.id}
                                                    href={match.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-red-500/30 transition-all hover:shadow-lg flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 rounded-full border border-red-100 dark:border-red-900/20">
                                                                <span className="relative flex h-1.5 w-1.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                                                                </span>
                                                                <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Live Now</span>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors leading-relaxed">
                                                            {match.title}
                                                        </h3>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-400 font-medium italic">Click for details</span>
                                                        <ChevronRight size={14} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <Activity className="text-gray-300 mb-4" size={48} />
                                            <p className="text-gray-500 font-bold">No active matches found at the moment.</p>
                                            <p className="text-xs text-gray-400 mt-2">Please check back later for live updates.</p>
                                        </div>
                                    )}
                                    <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                                        Data provided by ESPNCricinfo
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {highlights.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-accent-premium/10 border border-accent-premium/20">
                                    <Sparkles className="w-7 h-7 text-accent-premium" />
                                </div>
                                <div className="space-y-1">
                                    <span className="label-micro !text-accent-premium">Best Moments</span>
                                    <h2 className="text-gray-900 dark:text-white">
                                        Match <span className="text-accent-premium">Highlights</span>
                                    </h2>
                                </div>
                            </div>

                            {Object.entries(groupedHighlights).map(([category, items]) => (
                                <div key={category} className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1 h-6 bg-primary-600 rounded-full" />
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">
                                            {category}
                                        </h3>
                                    </div>
                                    <div className="relative group/highlights">
                                        <Splide options={splideOptionsHighlights} className="highlights-splide">
                                            {items.map((item) => (
                                                <SplideSlide key={item.id}>
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleLinkClick(item as any)}
                                                        className="group cursor-pointer bg-white dark:bg-surface-dark-900 rounded-card overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]"
                                                    >
                                                        <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                            <Image
                                                                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeUrl.split('/').pop()?.split('?')[0]}/mqdefault.jpg`}
                                                                alt={item.title}
                                                                fill
                                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
                                                                    <Play size={24} fill="currentColor" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-5">
                                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 min-h-[40px] group-hover:text-primary-light transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <div className="flex items-center justify-between mt-4 uppercase">
                                                                <span className="label-micro !text-[9px]">
                                                                    {category}
                                                                </span>
                                                                <Tv size={14} className="text-slate-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SplideSlide>
                                            ))}
                                        </Splide>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center my-8">
                        <GoogleAdSense
                            slot="7838572857"
                            format="horizontal"
                            responsive={true}
                        />
                    </div>

                    <div className="relative group/cta">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative bg-gradient-to-br from-red-600 to-red-700 md:to-orange-600 rounded-[2.5rem] p-10 md:p-16 overflow-hidden shadow-2xl text-white transform hover:scale-[1.01] transition-all duration-500">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-24 -mb-24 animate-pulse" />

                            <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full label-micro !text-[11px] border border-white/30">
                                    <Send size={14} />
                                    Stay Updated
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-white text-3xl md:text-5xl font-black tracking-tight leading-tight">
                                        Join the <span className="text-yellow-300">Live Coverage</span> Inner Circle
                                    </h2>
                                    <p className="text-white/80 text-lg max-w-2xl mx-auto">
                                        Get instant notifications for live match starts, breaking highlights, and exclusive streaming links delivered straight to your inbox.
                                    </p>
                                </div>

                                {isSubscribed ? (
                                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-lg">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h3 className="text-white font-bold text-xl">You're on the list!</h3>
                                        <p className="text-white/70">Welcome to the Bigyann community.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                                        <div className="flex-1 relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                                                <Radio size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                value={newsletterEmail}
                                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                className="w-full px-5 py-4 pl-14 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-8 py-4 bg-white text-primary-600 font-black rounded-2xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="animate-spin" size={20} />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    Subscribe Now
                                                    <ChevronRight size={20} />
                                                </div>
                                            )}
                                        </button>
                                    </form>
                                )}

                                <p className="label-micro !text-[11px] tracking-[0.2em] text-white/50">
                                    Protected by secure Zoho Infrastructure
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .highlights-splide .splide__arrow {
                    background: rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(12px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    width: 3rem !important;
                    height: 3rem !important;
                    opacity: 0 !important;
                    transition: all 0.4s ease !important;
                }
                .highlights-splide .splide__arrow svg {
                    fill: #fff !important;
                    width: 1.25rem !important;
                    height: 1.25rem !important;
                }
                .dark .highlights-splide .splide__arrow {
                    background: rgba(0, 0, 0, 0.5) !important;
                }
                .group\/highlights:hover .splide__arrow {
                    opacity: 1 !important;
                }
                .highlights-splide .splide__arrow:hover {
                    background: #dc2626 !important;
                    border-color: #dc2626 !important;
                }

                .splide__pagination__page.is-active {
                    background: #dc2626 !important;
                    transform: scale(1.2);
                }
                @media (max-width: 640px) {
                    .splide__pagination {
                        bottom: -1.5rem !important;
                    }
                }
            `}</style>
        </section>
    );
};