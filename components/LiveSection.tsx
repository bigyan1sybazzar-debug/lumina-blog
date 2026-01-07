'use client';

import React, { useState, useEffect } from 'react';
import { getLiveLinks } from '../services/db';
import { LiveLink } from '../types';
import { X, Play, Radio } from 'lucide-react';

import GoogleAdSense from './GoogleAdSense';

export const LiveSection: React.FC = () => {
    const [links, setLinks] = useState<LiveLink[]>([]);
    const [selectedLink, setSelectedLink] = useState<LiveLink | null>(null);
    const [pendingLink, setPendingLink] = useState<LiveLink | null>(null);
    const [showAd, setShowAd] = useState(false);

    useEffect(() => {
        getLiveLinks().then(setLinks);
    }, []);

    const handleLinkClick = (link: LiveLink) => {
        setPendingLink(link);
        setShowAd(true);
    };

    const handleAdClose = () => {
        setShowAd(false);
        if (pendingLink) {
            setSelectedLink(pendingLink);
            setPendingLink(null);
        }
    };

    if (links.length === 0) return null;

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
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advertisement</span>
                            <button
                                onClick={handleAdClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="min-h-[250px] w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-xl mb-6 overflow-hidden">
                            {/* Use the specific AdSense slot if available, or a generic responsive one */}
                            {/* Reusing Home slot for now or generic since explicit video ad slot not provided */}
                            <GoogleAdSense slot="7838572857" responsive={true} format="rectangle" />
                        </div>

                        <button
                            onClick={handleAdClose}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25"
                        >
                            Skip to Video
                        </button>
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
