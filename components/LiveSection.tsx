'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks, getHighlights, subscribeToNewsletter } from '../services/db';
import { LiveLink, Highlight } from '../types';
import Link from 'next/link';
import GoogleAdSense from './GoogleAdSense';
import { X, Play, Radio, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle, Share2, Facebook, MessageCircle, ArrowLeft } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

// CricketScoreWidget removed as it is replaced by an iframe source

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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showAd && adTimer > 0) {
            interval = setInterval(() => {
                setAdTimer((prev) => prev - 1);
            }, 1000);
        } else if (showAd && adTimer === 0) {
            // Auto-skip when timer hits 0
            skipAd();
        }
        return () => clearInterval(interval);
    }, [showAd, adTimer]);

    useEffect(() => {
        getLiveLinks().then((fetchedLinks) => {
            setLinks(fetchedLinks);
            // Show ad for the default link (or first link) on initial load
            if (fetchedLinks.length > 0 && !selectedLink) {
                const defaultLink = fetchedLinks.find(link => link.isDefault) || fetchedLinks[0];
                setPendingLink(defaultLink);
                setShowAd(true);
                setAdTimer(5);
            }
        });
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
        // Don't show ad if clicking the same link
        if (selectedLink?.id === link.id) return;

        setPendingLink(link);
        setShowAd(true);
        setAdTimer(5);

        // Scroll to top so user sees the player
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



    const groupedHighlights = highlights.reduce((acc, h) => {
        if (!acc[h.category]) acc[h.category] = [];
        acc[h.category].push(h);
        return acc;
    }, {} as Record<string, Highlight[]>);

    const allTags = ['All', ...Array.from(new Set(links.flatMap(link => link.tags || [])))];
    const filteredLinks = selectedTag === 'All'
        ? links
        : links.filter(link => link.tags?.includes(selectedTag));

    // Removed early return to ensure Live Scores Tabs are always visible when component is rendered
    // if (links.length === 0 && highlights.length === 0) return null;

    const splideOptionsHighlights = {
        perPage: 4,
        perMove: 1,
        gap: '1rem',
        arrows: true,
        pagination: false,
        breakpoints: {
            1024: { perPage: 3 },
            768: { perPage: 2 },
            480: { perPage: 1.5, gap: '0.75rem', arrows: false, pagination: true },
        },
    };

    return (
        <section id="live-section" className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 relative overflow-hidden p-0 m-0">


            <div className="py-4">
                {/* Animated Background Deco */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] -ml-64 -mb-64 animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 border rounded-2xl p-3 mb-4 shadow-sm">
                        <p className="text-[10px] md:text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                            <span className="text-base">⏳</span>
                            <span>Please be patient — HD channels may take a moment to load</span>
                        </p>
                    </div>

                    {/* VIDEO PLAYER AND CHANNEL LIST LAYOUT */}
                    {links.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {/* Video Player Section - Always on top */}
                            {(selectedLink || showAd) && (
                                <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10">
                                    <div className="aspect-video w-full relative">
                                        {showAd ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 group">
                                                <div className="w-full h-full max-w-4xl mx-auto p-4 flex flex-col justify-center overflow-hidden">
                                                    <GoogleAdSense
                                                        slot="7838572857"
                                                        className="w-full h-full"
                                                        minHeight="250px"
                                                        format="rectangle"
                                                    />
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
                                                src={selectedLink.youtubeUrl || selectedLink.iframeUrl}
                                                title={selectedLink.heading || selectedLink.title}
                                                className="w-full h-full border-0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                    {!showAd && selectedLink && (
                                        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 md:p-6 border-t border-gray-200 dark:border-white/10">
                                            {/* Top Metadata Row */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
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
                                                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
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

                            {/* TAGS FILTER - Moved below video */}
                            {allTags.length > 1 && (
                                <div className="z-10 relative">
                                    {/* Mobile Dropdown */}
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

                                    {/* Desktop Buttons */}
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
                            )}

                            {/* Channel List - Always below video */}
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Tv size={20} className="text-red-500 hidden md:block" />
                                    Available Channels
                                </h3>
                                {/* Mobile now uses grid-cols-2 for 2 items per row */}
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {filteredLinks.map((link) => (
                                        <button
                                            key={link.id}
                                            onClick={() => handleLinkClick(link)}
                                            className={`group text-left relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-xl p-4 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${selectedLink?.id === link.id
                                                ? 'border-red-500 shadow-lg shadow-red-500/20'
                                                : 'border-gray-200/50 dark:border-white/10 hover:border-red-500/50'
                                                }`}
                                        >
                                            {/* Active indicator */}
                                            {selectedLink?.id === link.id && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center text-center gap-2 md:flex-row md:text-left md:gap-3">
                                                <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${selectedLink?.id === link.id
                                                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-110'
                                                    : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 group-hover:scale-110'
                                                    }`}>
                                                    <Play size={18} fill="currentColor" className="ml-0.5 md:w-5 md:h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0 w-full">
                                                    <h4 className={`font-bold text-xs md:text-sm line-clamp-2 transition-colors ${selectedLink?.id === link.id
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400'
                                                        }`}>
                                                        {link.heading}
                                                    </h4>
                                                    {link.tags && link.tags.length > 0 && (
                                                        <div className="flex flex-wrap justify-center md:justify-start gap-1 mt-1">
                                                            {link.tags.slice(0, 1).map((tag, i) => (
                                                                <span key={i} className="text-[7px] md:text-[8px] bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">
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
                    )}




                    {/* LIVE SCORES TABS */}
                    <div className="mt-24">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/10 to-red-500/10 border border-primary-500/20">
                                    <Activity className="w-7 h-7 text-primary-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-primary-500 uppercase tracking-wider">Real-Time Updates</span>
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white">
                                        Live Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-red-500">Scores</span>
                                    </h2>
                                </div>
                            </div>
                            <div className="flex bg-white dark:bg-gray-800/50 p-1.5 rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 self-start md:self-auto">
                                <button
                                    onClick={() => setActiveScoreTab('football')}
                                    className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeScoreTab === 'football'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl shadow-red-500/30 scale-105'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    ⚽ Football
                                </button>
                                <button
                                    onClick={() => setActiveScoreTab('cricket')}
                                    className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeScoreTab === 'cricket'
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/30 scale-105'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                        }`}
                                >
                                    🏏 Cricket
                                </button>
                            </div>
                        </div>

                        <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-[2.5rem] p-6 md:p-10 border border-gray-200/50 dark:border-white/10 min-h-[400px] overflow-hidden backdrop-blur-xl shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-primary-500/5 to-red-500/5 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

                            {activeScoreTab === 'football' ? (
                                <div className="relative z-10 w-full h-[650px] rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 shadow-inner">
                                    <iframe
                                        src="https://www.scorebat.com/embed/livescore/"
                                        className="w-full h-full border-0"
                                        title="Live Football Scores"
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
                                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
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



                    {/* HIGHLIGHTS SECTION */}
                    {highlights.length > 0 && (
                        <div className="mt-24 space-y-12">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-primary-500/10 border border-yellow-500/20">
                                    <Sparkles className="w-7 h-7 text-yellow-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-yellow-500 uppercase tracking-wider">Best Moments</span>
                                    </div>
                                    <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white">
                                        Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-primary-500">Highlights</span>
                                    </h2>
                                </div>
                            </div>

                            {Object.entries(groupedHighlights).map(([category, items]) => (
                                <div key={category} className="space-y-6">
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
                                                        className="group cursor-pointer bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-2xl transition-all duration-300"
                                                    >
                                                        <div className="aspect-video relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                            <img
                                                                src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.youtubeUrl.split('/').pop()?.split('?')[0]}/mqdefault.jpg`}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
                                                                    <Play size={20} fill="currentColor" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 min-h-[40px] group-hover:text-primary-500 transition-colors">
                                                                {item.title}
                                                            </h4>
                                                            <div className="flex items-center justify-between mt-3">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {category}
                                                                </p>
                                                                <Tv size={12} className="text-gray-300" />
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

                    {/* NEWSLETTER SECTION */}
                    <div className="mt-32 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-primary-600/10 to-red-600/10 blur-[150px] rounded-full" />
                        <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] p-10 md:p-16 overflow-hidden backdrop-blur-xl shadow-2xl">
                            <div className="max-w-3xl mx-auto text-center space-y-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-black uppercase tracking-widest">
                                    <Send size={14} />
                                    Stay Updated
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-primary-500">Live Coverage</span> Inner Circle
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                                        Get instant notifications for live match starts, breaking highlights, and exclusive streaming links delivered straight to your inbox.
                                    </p>
                                </div>

                                {isSubscribed ? (
                                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">You're on the list!</h3>
                                        <p className="text-gray-500">Welcome to the Lumina Blog newsletter.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto transform hover:scale-[1.02] transition-transform duration-300">
                                        <div className="flex-1 relative group">
                                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-500 transition-colors">
                                                <Radio size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                value={newsletterEmail}
                                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                                placeholder="Enter your email address"
                                                className="w-full pl-14 pr-6 py-5 bg-gray-100 dark:bg-white/5 border-2 border-transparent focus:border-red-500/50 rounded-2xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-8 py-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/20 hover:shadow-red-600/40 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="animate-spin" size={20} />
                                            ) : (
                                                <>
                                                    Subscribe Now
                                                    <ChevronRight size={20} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
                                    Protected by secure Zoho Infrastructure
                                </p>
                            </div>

                            {/* Background Deco Widgets */}
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Sparkles size={120} className="text-red-500" />
                            </div>
                            <div className="absolute bottom-0 left-0 p-8 opacity-10 pointer-events-none">
                                <Radio size={120} className="text-primary-500" />
                            </div>
                        </div>
                    </div>


                </div>
            </div>



            <style jsx global>{`
                /* Premium Slider Buttons for Highlights */
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
        </section >
    );
};
