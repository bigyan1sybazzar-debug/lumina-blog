'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks, getHighlights, subscribeToNewsletter } from '../services/db';
import { LiveLink, Highlight } from '../types';
import Link from 'next/link';
import { X, Play, Radio, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv, ChevronRight, Activity, ChevronLeft, CheckCircle } from 'lucide-react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

import GoogleAdSense from './GoogleAdSense';

// CricketScoreWidget removed as it is replaced by an iframe source

export const LiveSection: React.FC = () => {
    const [links, setLinks] = useState<LiveLink[]>([]);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [selectedLink, setSelectedLink] = useState<any>(null);
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [showAd, setShowAd] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeScoreTab, setActiveScoreTab] = useState<'football' | 'cricket'>('football');
    const [cricketScores, setCricketScores] = useState<any[]>([]);
    const [loadingCricket, setLoadingCricket] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string>('All');

    useEffect(() => {
        getLiveLinks().then(setLinks);
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
        setPendingLink(link);
        setShowAd(true);
        setIsProcessing(false); // Reset processing state
    };

    const handleAdClose = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        setShowAd(false);
        if (pendingLink) {
            setSelectedLink(pendingLink);
            setPendingLink(null);
        }
        setTimeout(() => setIsProcessing(false), 500);
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
        <section id="live-section" className="py-12 bg-white dark:bg-[#050505] relative overflow-hidden">
            {/* Minimalist Background Deco */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            Live Stream <span className="text-gray-400 font-medium text-lg">Coverage</span>
                        </h2>
                    </div>
                </div>
                <p className="text-lg md:text-xl font-bold italic text-gray-900 dark:text-white flex items-center gap-2 mb-[8px]">
                    ⏳ Please keep patience
                    <span className="text-gray-400 font-medium text-base italic">
                        HD channels may take a moment to load
                    </span>
                </p>

                {/* TAGS FILTER RIBBON */}
                {links.length > 0 && allTags.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-8">
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
                )}

                {/* CONSISTENT 2-COLUMN GRID ON ALL PLATFORMS FOR LIVE STREAMS */}
                {filteredLinks.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                        {filteredLinks.map((link) => (
                            <div
                                key={link.id}
                                onClick={() => handleLinkClick(link)}
                                className="group cursor-pointer flex flex-col sm:flex-row items-center sm:items-center gap-3 md:gap-4 bg-gray-50 dark:bg-white/5 p-3 md:p-6 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/5"
                            >
                                <div className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform shadow-inner">
                                    <Play size={18} fill="currentColor" className="ml-0.5 md:size-[24px]" />
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <h3 className="font-bold text-[10px] md:text-base lg:text-lg text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                                        {link.heading}
                                    </h3>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-1 mt-1">
                                        {link.tags?.map((tag, i) => (
                                            <span key={i} className="text-[7px] md:text-[9px] bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                                {tag}
                                            </span>
                                        ))}
                                        {!link.tags?.length && (
                                            <p className="text-[8px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-1 uppercase tracking-widest">
                                                <Activity size={10} className="text-red-500" />
                                                Live Stream
                                            </p>


                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={14} className="hidden md:block text-gray-300 group-hover:translate-x-1 transition-transform ml-auto" />
                            </div>

                        ))}
                    </div>
                )}

                {/* AdSense: After Live Streams Grid */}
                <div className="max-w-7xl mx-auto px-4 my-12">
                    <GoogleAdSense
                        slot="7838572857"
                        format="auto"
                        responsive={true}
                    />
                </div>

                {/* LIVE SCORES TABS */}
                <p>Please Keep patience, It will take to Load HD channels</p>

                <div className="mt-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-red-500" />
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                Live Match <span className="text-gray-400 font-medium text-lg italic">Scores</span>
                            </h2>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl self-start md:self-auto">
                            <button
                                onClick={() => setActiveScoreTab('football')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeScoreTab === 'football'
                                    ? 'bg-white dark:bg-red-600 text-red-600 dark:text-white shadow-xl shadow-red-500/10 scale-105'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Football
                            </button>
                            <button
                                onClick={() => setActiveScoreTab('cricket')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeScoreTab === 'cricket'
                                    ? 'bg-white dark:bg-red-600 text-red-600 dark:text-white shadow-xl shadow-red-500/10 scale-105'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Cricket
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-4 md:p-8 border border-gray-100 dark:border-white/10 min-h-[400px] overflow-hidden backdrop-blur-sm relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-primary-500/5 pointer-events-none" />

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

                {/* AdSense: After Live Scores Section */}
                <div className="max-w-7xl mx-auto px-4 my-12">
                    <GoogleAdSense
                        slot="7838572857"
                        format="auto"
                        responsive={true}
                    />
                </div>

                {/* HIGHLIGHTS SECTION */}
                {highlights.length > 0 && (
                    <div className="mt-20 space-y-12">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-primary-500" />
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                Match Highlights
                            </h2>
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
                <div className="mt-24 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-primary-600/10 blur-[120px] rounded-full" />
                    <div className="relative bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden backdrop-blur-xl">
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

                {/* AdSense: After Newsletter Section */}
                <div className="max-w-7xl mx-auto px-4 my-12">
                    <GoogleAdSense
                        slot="7838572857"
                        format="auto"
                        responsive={true}
                    />
                </div>
            </div>

            {/* Ad Interstitial Modal */}
            {showAd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#0a0a0a] rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center border border-gray-200 dark:border-white/5">
                        <div className="w-full flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Advertisement</span>
                            <button
                                onClick={handleAdClose}
                                disabled={isProcessing}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Ad Container */}
                        <div className="min-h-[280px] w-full flex items-center justify-center bg-gray-50 dark:bg-black/40 rounded-2xl mb-8 overflow-hidden relative border border-gray-100 dark:border-white/5">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs italic pointer-events-none">
                                Content Loading...
                            </div>
                            <div className="w-full h-full relative z-10">
                                <GoogleAdSense
                                    slot="7838572857"
                                    responsive={true}
                                    format="auto"
                                    style={{ width: '100%', minHeight: '280px' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdClose}
                            disabled={isProcessing}
                            className={`w-full py-4 font-black rounded-xl transition-all ${isProcessing
                                ? 'bg-gray-100 dark:bg-white/5 text-gray-400'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-95'
                                }`}
                        >
                            {isProcessing ? 'SYNCHRONIZING...' : 'START STREAMING'}
                        </button>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {selectedLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0"
                        onClick={() => setSelectedLink(null)}
                    />
                    <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 animate-in zoom-in-95 duration-300 aspect-video">
                        <button
                            onClick={() => setSelectedLink(null)}
                            className="absolute top-6 right-6 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-full h-full">
                            <iframe
                                src={selectedLink.youtubeUrl || selectedLink.iframeUrl}
                                title={selectedLink.heading || selectedLink.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}

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
        </section>
    );
};
