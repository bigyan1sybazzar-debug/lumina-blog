'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import PollList from '../components/PollList';
import PollCreationForm from '../components/PollCreationForm';
import { Vote, Zap, ShieldCheck, Sparkles, Plus, Send } from 'lucide-react';
import { db, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const VotingPage: React.FC = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handlePollCreated = () => {
        setShowCreateForm(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors duration-500">
            <Head>
                <title>Bigyann Vote | Community Decisions & Trends</title>
                <meta name="description" content="Vote on various categories like elections, movies, and gadgets on Bigyann. Share your opinion and watch real-time results." />
            </Head>

            <Header />

            <main className="flex-grow py-20 px-4">
                <div className="max-w-7xl mx-auto relative z-10 px-6">
                    {/* Hero Section */}
                    {/* ... (rest of the content) */}
                    <header className="text-center py-20 flex flex-col items-center relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none" />

                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-8 shadow-sm">
                            <Sparkles size={14} className="text-primary-600" /> COMMUNITY PULSE
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-gray-900 dark:text-white leading-[0.9]">
                            VOICE YOUR <br />
                            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent italic">
                                VISION.
                            </span>
                        </h1>

                        <div className="flex flex-wrap justify-center gap-6">
                            <button
                                onClick={() => user ? setShowCreateForm(!showCreateForm) : window.location.href = '/login'}
                                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                {showCreateForm ? 'Back to Feed' : 'Launch a Poll'}
                                <Plus size={18} />
                            </button>
                        </div>
                    </header>

                    {/* 1. Polls Explorer Section */}
                    {!showCreateForm && (
                        <section className="relative mb-32 transition-all duration-700">
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                                <div className="group">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                                        <Vote size={12} /> LIVE FEED
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Active Polls</h2>
                                </div>
                            </div>

                            <PollList userId={user?.uid} key={refreshKey} />
                        </section>
                    )}

                    {/* 2. Dynamic Creation Form */}
                    {showCreateForm && user && (
                        <div className="mb-32 animate-in fade-in slide-in-from-bottom-20 duration-700 ease-out-expo">
                            <PollCreationForm onSuccess={handlePollCreated} />
                        </div>
                    )}

                    {/* 3. Feature Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                        <Feature
                            icon={<ShieldCheck size={32} strokeWidth={2.5} />}
                            title="Secure"
                            desc="Integrity for every vote."
                            color="blue"
                        />
                        <Feature
                            icon={<Zap size={32} strokeWidth={2.5} />}
                            title="Realtime"
                            desc="Watch the meta shift."
                            color="indigo"
                        />
                        <Feature
                            icon={<Vote size={32} strokeWidth={2.5} />}
                            title="Verified"
                            desc="Authentic voices only."
                            color="purple"
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

const Feature = ({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: 'blue' | 'indigo' | 'purple' }) => {
    const colors = {
        blue: 'from-blue-500 to-primary-600 shadow-blue-500/20',
        indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-500/20',
        purple: 'from-purple-500 to-pink-600 shadow-purple-500/20'
    };

    return (
        <div className="p-8 bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-3xl hover:shadow-xl transition-all duration-300 group">
            <div className={`w-14 h-14 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-all shadow-lg`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">{desc}</p>
        </div>
    );
};

export default VotingPage;
