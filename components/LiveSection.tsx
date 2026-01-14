'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks } from '../services/db';
import { LiveLink } from '../types';
import Link from 'next/link';
import { X, Play, Radio, Sparkles, ShoppingBag, Send, Languages, FileText, Terminal, Calculator, RefreshCw, Tv } from 'lucide-react';

import GoogleAdSense from './GoogleAdSense';


export const LiveSection: React.FC = () => {
    const [links, setLinks] = useState<LiveLink[]>([]);
    const [selectedLink, setSelectedLink] = useState<LiveLink | null>(null);
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [showAd, setShowAd] = useState(false);
    const [adClicked, setAdClicked] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Prevent double-clicks

    useEffect(() => {
        getLiveLinks().then(setLinks);
    }, []);



    const handleLinkClick = (link: LiveLink) => {
        setPendingLink(link);
        setShowAd(true);
        setAdClicked(false);
        setIsProcessing(false); // Reset processing state
    };

    const handleAdClose = () => {
        if (isProcessing) return; // Prevent closing if already processing

        if (!adClicked) {
            setAdClicked(true);
            // Simulate ad click by opening in new tab
            window.open('https://bigyann.com.np', '_blank');
            return;
        }

        setIsProcessing(true); // Prevent double-clicks
        setShowAd(false);

        if (pendingLink) {
            setSelectedLink(pendingLink);
            setPendingLink(null);
        }

        // Reset processing state after a short delay
        setTimeout(() => setIsProcessing(false), 500);
    };

    if (links.length === 0) return null;

    const tools = [
        { name: 'AI Humanizer', href: '/ai-humanizer', icon: Sparkles, color: 'from-purple-500 to-blue-600' },
        { name: 'Buy/Sell Phones', href: '/tools/phone-marketplace', icon: ShoppingBag, color: 'from-green-500 to-teal-600' },
        { name: 'Old Phone Price', href: '/price/my-phone-price', icon: Send, color: 'from-primary-400 to-purple-500' },
        { name: 'AI Translator', href: '/tools/ai-translator', icon: Languages, color: 'from-indigo-500 to-blue-600' },
        { name: 'Resume Checker', href: '/tools/resume-checker', icon: FileText, color: 'from-purple-500 to-pink-600' },
        { name: 'Prompts Library', href: '/prompts', icon: Terminal, color: 'from-pink-500 to-orange-400' },
        { name: 'EMI Calculator', href: '/tools/emi-calculator', icon: Calculator, color: 'from-blue-400 to-cyan-500', external: true },
        { name: 'Exchange Offer', href: '/tools/exchange-offer', icon: RefreshCw, color: 'from-green-400 to-teal-500' },
        { name: 'Live Sports', href: '/tools/live-tv', icon: Tv, color: 'from-red-500 to-orange-600' },
    ];

    return (
        <section id="live-section" className="py-12 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500">
                        Live Coverage & Updates
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {links.map((link) => (
                        <div
                            key={link.id}
                            onClick={() => handleLinkClick(link)}
                            className="group cursor-pointer relative bg-white dark:bg-gray-900 rounded-2xl p-1 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-red-100 dark:hover:border-red-900/30"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity" />

                            <div className="p-5 flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform">
                                    <Play size={20} fill="currentColor" className="ml-0.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                                        {link.heading}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                        <Radio size={12} className="text-red-500" />
                                        LIVE STREAM
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ad Interstitial Modal */}
            {showAd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center max-h-[90vh] overflow-y-auto">
                        <div className="w-full flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advertisement</span>
                            <button
                                onClick={handleAdClose}
                                disabled={isProcessing}
                                className={`transition-colors ${isProcessing
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                                title={adClicked ? 'Close' : 'Open Ad'}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Ad Container */}
                        <div className="min-h-[280px] w-full flex items-center justify-center bg-gray-50/30 dark:bg-gray-800/30 rounded-xl mb-6 overflow-hidden relative">
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm pointer-events-none">
                                Loading advertisement...
                            </div>
                            <div className="w-full h-full relative z-10">
                                <GoogleAdSense
                                    slot="7838572857"
                                    responsive={true}
                                    format="auto"
                                    minHeight="280px"
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAdClose}
                            disabled={isProcessing}
                            className={`w-full py-3 font-bold rounded-xl transition-all shadow-lg ${isProcessing
                                ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 text-white hover:shadow-primary-500/25'
                                }`}
                        >
                            {isProcessing ? 'Loading...' : adClicked ? 'Skip to Content' : 'Click to Skip Ad'}
                        </button>

                        {/* Divider */}
                        <div className="relative my-6 w-full">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                                    Our Tools
                                </span>
                            </div>
                        </div>

                        {/* Tools Grid Section */}
                        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                            {tools.map((tool) => {
                                const Icon = tool.icon;
                                const content = (
                                    <>
                                        <div className={`w-8 h-8 mb-2 rounded-full bg-gradient-to-tr ${tool.color} 
                                                        flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white text-center line-clamp-1">{tool.name}</span>
                                    </>
                                );

                                if (tool.external) {
                                    return (
                                        <a
                                            key={tool.name}
                                            href="https://bigyann.com.np/tools/emi-calculator" // Hardcoded for safety essentially, or use tool.href if absolute
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl 
                                                     hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 
                                                     transition-all group"
                                        >
                                            {content}
                                        </a>
                                    );
                                }

                                return (
                                    <Link
                                        key={tool.name}
                                        href={tool.href}
                                        className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl 
                                                 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 
                                                 transition-all group"
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {selectedLink && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="absolute inset-0"
                        onClick={() => setSelectedLink(null)}
                    />
                    <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 aspect-video">
                        <button
                            onClick={() => setSelectedLink(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-full h-full">
                            <iframe
                                src={selectedLink.iframeUrl}
                                title={selectedLink.heading}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
