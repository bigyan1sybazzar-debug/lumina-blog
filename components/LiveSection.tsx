'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks, getHighlights, subscribeToNewsletter } from '../services/db';
import { LiveLink, Highlight } from '../types';
import Link from 'next/link';
import GoogleAdSense from './GoogleAdSense';
import { X, Play, Radio, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle, Share2, Facebook, MessageCircle, ArrowLeft, Bookmark, Link2, TrendingUp, Newspaper, Maximize, Clock } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';


const splideOptionsHighlights = {
    perPage: 4,
    perMove: 1,
    gap: '1rem',
    arrows: true,
    pagination: false,
    drag: true,
    snap: true,
    breakpoints: {
        1024: { perPage: 3 },
        768: { perPage: 2 },
        480: { perPage: 1.5, gap: '0.75rem', arrows: false, pagination: true },
    },
};

const splideOptionsTrending = {
    type: 'loop',
    drag: true,
    snap: true,
    focus: 'center',
    perPage: 6,
    gap: '1.5rem',
    arrows: false,
    pagination: false,
    trimSpace: false,
    flickPower: 300,
    breakpoints: {
        1280: { perPage: 5 },
        1024: { perPage: 4 },
        768: { perPage: 3 },
        640: { perPage: 2.2 },
        480: { perPage: 1.8, gap: '1rem' },
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
    const [adTimer, setAdTimer] = useState(0);
    const [showAd, setShowAd] = useState(false);
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [onDemandName, setOnDemandName] = useState('');
    const [onDemandMessage, setOnDemandMessage] = useState('');
    const [playerKey, setPlayerKey] = useState(0);
    const playerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAd && adTimer > 0) {
            interval = setInterval(() => {
                setAdTimer((prev) => prev - 1);
            }, 1000);
        } else if (showAd && adTimer === 0) {
            skipAd();
        }
        return () => clearInterval(interval);
    }, [showAd, adTimer]);

    useEffect(() => {
        getLiveLinks().then((fetchedLinks) => {
            setLinks(fetchedLinks);
            if (fetchedLinks.length > 0 && !selectedLink) {
                const defaultLink = fetchedLinks.find(link => link.isDefault) || fetchedLinks[0];
                setPendingLink(defaultLink);
                setShowAd(true);
                setAdTimer(5);
            }
        });
        getHighlights().then(setHighlights);

        getHighlights().then(setHighlights);
    }, []);

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

    const handleLinkClick = (link: LiveLink) => {
        if (selectedLink?.id === link.id) return;

        setPendingLink(link);
        setShowAd(true);
        setAdTimer(5);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const skipAd = () => {
        if (pendingLink) {
            setSelectedLink(pendingLink);
            setPendingLink(null);
        }
        setShowAd(false);
        setAdTimer(0);
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

    const groupedHighlights = highlights.reduce((acc, h) => {
        if (!acc[h.category]) acc[h.category] = [];
        acc[h.category].push(h);
        return acc;
    }, {} as Record<string, Highlight[]>);

    const allTags = ['All', ...Array.from(new Set(links.flatMap(link => link.tags || [])))];
    const filteredLinks = selectedTag === 'All'
        ? links
        : links.filter(link => link.tags?.includes(selectedTag));

    return (
        <section id="live-section" className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen relative overflow-hidden">
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

                    <div className="w-full flex justify-center min-h-[100px] my-4 bg-gray-50 dark:bg-white/5 rounded-xl items-center overflow-hidden">
                        <GoogleAdSense
                            slot="7838572857"
                            format="horizontal"
                            responsive={true}
                            style={{ display: 'block', width: '100%' }}
                        />
                    </div>

                    {links.filter(l => l.isTrending).length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => document.getElementById('trending-slider')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-bold uppercase tracking-wider hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors cursor-pointer"
                                >
                                    <TrendingUp size={16} className="animate-pulse" />
                                    Trending Now
                                </button>
                            </div>
                            <Splide id="trending-slider" options={splideOptionsTrending}>
                                {links.filter(l => l.isTrending).map((link) => (
                                    <SplideSlide key={link.id}>
                                        <button
                                            onClick={() => handleLinkClick(link)}
                                            className={`w-full block group text-left ${selectedLink?.id === link.id ? 'scale-95 transition-transform' : ''}`}
                                        >
                                            <div className={`flex items-center gap-4 p-3 bg-white dark:bg-surface-dark-900 rounded-card border transition-all active:scale-[0.97] cursor-pointer ${selectedLink?.id === link.id
                                                ? 'border-primary-light ring-2 ring-primary-light/20 bg-primary-50/10'
                                                : 'border-slate-200 dark:border-slate-800 group-hover:border-primary-light/50 shadow-sm hover:shadow-md'}`}
                                            >
                                                <div className="relative group/icon">
                                                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 relative z-10 overflow-hidden ${selectedLink?.id === link.id
                                                        ? 'bg-gradient-to-br from-primary-600 via-primary-dark to-orange-500 text-white shadow-lg shadow-primary-500/40 ring-2 ring-white/20'
                                                        : 'bg-gray-100 dark:bg-white/5 text-primary-light group-hover/icon:bg-primary-50 dark:group-hover/icon:bg-primary-900/20'
                                                        }`}>
                                                        {/* Glow effect for selected state */}
                                                        {selectedLink?.id === link.id && (
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent animate-pulse" />
                                                        )}

                                                        <span className={`text-[8px] font-black tracking-[0.2em] mb-1 transition-colors ${selectedLink?.id === link.id ? 'text-white/90' : 'text-gray-400 group-hover/icon:text-primary-600'}`}>LIVE</span>
                                                        <div className="relative">
                                                            <div className={`h-3 w-3 rounded-full flex items-center justify-center ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`}>
                                                                <div className={`absolute h-full w-full rounded-full animate-ping opacity-75 ${selectedLink?.id === link.id ? 'bg-white' : 'bg-primary-600'}`} />
                                                                <div className={`h-1.5 w-1.5 rounded-full ${selectedLink?.id === link.id ? 'bg-primary-600' : 'bg-white'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Decorative ring */}
                                                    <div className={`absolute -inset-1 rounded-[1.25rem] opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500 border border-primary-light/30 ${selectedLink?.id === link.id ? 'opacity-100 animate-pulse' : ''}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`text-[8px] md:text-[11px] font-bold line-clamp-2 leading-tight transition-colors ${selectedLink?.id === link.id
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
                    )}

                    {links.length > 0 && (
                        <div className="flex flex-col gap-4 md:gap-6">
                            {(selectedLink || showAd) && (
                                <div
                                    ref={playerRef}
                                    className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 w-full"
                                >
                                    <div className="aspect-video w-full relative">
                                        {showAd ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm group z-50">
                                                <div className="w-full h-full flex items-center justify-center p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl place-items-center">
                                                        {/* Ad Unit 1 - Centered Square */}
                                                        <div className="w-full max-w-[336px] h-64 md:h-auto md:aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl relative">
                                                            <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-4xl select-none pointer-events-none">ADS</div>
                                                            <GoogleAdSense
                                                                slot="7838572857"
                                                                className="w-full h-full"
                                                                format="rectangle"
                                                                responsive={true}
                                                            />
                                                        </div>
                                                        {/* Ad Unit 2 - Hidden on Mobile, Side-by-Side on Desktop */}
                                                        <div className="hidden md:flex aspect-square w-full max-w-[336px] bg-black/40 rounded-2xl overflow-hidden border border-white/10 items-center justify-center shadow-2xl relative">
                                                            <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-4xl select-none pointer-events-none">ADS</div>
                                                            <GoogleAdSense
                                                                slot="7838572857"
                                                                className="w-full h-full"
                                                                format="rectangle"
                                                                responsive={true}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-6 right-6 flex items-center gap-4 z-20">
                                                    {adTimer > 0 ? (
                                                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white text-sm font-bold border border-white/10">
                                                            Ad can be skipped in {adTimer}s...
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={skipAd}
                                                            className="bg-white text-black hover:bg-red-600 hover:text-white px-6 py-2 rounded-lg text-sm font-black transition-all transform hover:scale-105 flex items-center gap-2 shadow-xl"
                                                        >
                                                            Skip Ad <ChevronRight size={18} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
                                                    <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">ADVERTISEMENT</span>
                                                </div>

                                                {pendingLink && (
                                                    <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 z-20">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Up Next:</p>
                                                        <p className="text-white text-xs font-black truncate max-w-[150px]">{pendingLink.heading}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : selectedLink && (
                                            <iframe
                                                key={playerKey}
                                                src={selectedLink.youtubeUrl || selectedLink.iframeUrl}
                                                title={selectedLink.heading || selectedLink.title}
                                                className="w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen;"
                                                allowFullScreen
                                                referrerPolicy="no-referrer"
                                            />
                                        )}
                                    </div>
                                    {!showAd && selectedLink && (
                                        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 md:p-5 border-t border-gray-200 dark:border-white/10">
                                            <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-gray-100/50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
                                                <button
                                                    onClick={handleRefresh}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-500 transition-all shadow-sm border border-gray-200 dark:border-white/5 group"
                                                >
                                                    <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
                                                    Refresh Player
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
                                                            className="inline-flex items-center text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md"
                                                        >
                                                            <ArrowLeft className="w-2.5 h-2.5 mr-1" />
                                                            Home
                                                        </Link>
                                                        {selectedLink.tags?.map((tag: string, i: number) => (
                                                            <span key={i} className="text-[10px] bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-red-500/20">
                                                                {tag}
                                                            </span>
                                                        ))}
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
                                                            alert("To bookmark this page, press Ctrl+D (Windows) or Cmd+D (Mac) on your keyboard.");
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
                                        </div>
                                    )}
                                </div>
                            )}

                            {allTags.length > 1 && (
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
                                    <div className="w-full flex justify-center min-h-[100px] mt-8 mb-4 bg-gray-50 dark:bg-white/5 rounded-xl items-center overflow-hidden">
                                        <GoogleAdSense
                                            slot="7838572857"
                                            format="horizontal"
                                            responsive={true}
                                            style={{ display: 'block', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Tv size={24} className="text-secondary-light" />
                                        <h2 className="text-gray-900 dark:text-white">Available Channels</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filteredLinks.map((link) => (
                                            <button
                                                key={link.id}
                                                onClick={() => handleLinkClick(link)}
                                                className={`group text-left relative overflow-hidden bg-white dark:bg-surface-dark-900 p-6 rounded-card border transition-all duration-300 ${selectedLink?.id === link.id
                                                    ? 'border-primary-light ring-2 ring-primary-light/20 shadow-lg'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-primary-light/50'
                                                    }`}
                                            >
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
                                                        {link.tags && link.tags.length > 0 && (
                                                            <div className="flex flex-wrap justify-center md:justify-start gap-1 mt-2">
                                                                {link.tags.slice(0, 1).map((tag, i) => (
                                                                    <span key={i} className="label-micro px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                                                            <img
                                                                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeUrl.split('/').pop()?.split('?')[0]}/mqdefault.jpg`}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-secondary-600/20 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative bg-gradient-to-br from-primary-600 to-primary-dark md:to-secondary-600 rounded-[2.5rem] p-10 md:p-16 overflow-hidden shadow-2xl text-white transform hover:scale-[1.01] transition-all duration-500">
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