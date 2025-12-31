'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import PollList from '../components/PollList';
import PollCreationForm from '../components/PollCreationForm';
import { Vote, Zap, ShieldCheck, Sparkles, Plus, Send } from 'lucide-react';
import { db, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 py-20 px-4 font-sans transition-colors duration-500">
            <Head>
                <title>Bigyann Vote | Community Decisions & Trends</title>
                <meta name="description" content="Vote on various categories like elections, movies, and gadgets on Bigyann. Share your opinion and watch real-time results." />
            </Head>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Hero Section Alignment with Home */}
                <header className="text-center mb-24 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-fade-in">
                        <Sparkles size={14} className="fill-orange-500" /> Community Voting platform
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-gray-900 dark:text-white leading-[0.9]">
                        Every Voice <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent italic">Matters.</span>
                    </h1>
                    <p className="max-w-3xl mx-auto text-gray-600 dark:text-gray-400 font-medium text-lg md:text-2xl leading-relaxed mb-12">
                        Join thousands of users in determining the next big trends. From national elections to tech reviews and cinema hype.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => user ? setShowCreateForm(!showCreateForm) : window.location.href = '/login'}
                            className="px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl transition-all hover:shadow-2xl hover:shadow-orange-900/40 transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                        >
                            {showCreateForm ? 'Cancel Creation' : <><Plus size={20} strokeWidth={3} /> Launch a Poll</>}
                        </button>
                        {!user && (
                            <a href="/login" className="px-10 py-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-black text-xs uppercase tracking-[0.2em] rounded-3xl transition-all hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                                <Send size={18} /> Join Now
                            </a>
                        )}
                    </div>
                </header>

                {/* Feature Highlights Grouped like AI Tools */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <Feature
                        icon={<ShieldCheck size={28} />}
                        title="Encrypted & Secure"
                        desc="Every vote is verified and stored with blockchain-grade checksums to ensure total integrity."
                        color="orange"
                    />
                    <Feature
                        icon={<Zap size={28} />}
                        title="Instant Visualization"
                        desc="Watch the data shift in real-time with dynamic progress bars as the community participates."
                        color="blue"
                    />
                    <Feature
                        icon={<Vote size={28} />}
                        title="Fair Participation"
                        desc="Advanced anti-bot measures ensure one authentic person per vote across all categories."
                        color="purple"
                    />
                </div>

                {/* Dynamic Creation Form */}
                {showCreateForm && user && (
                    <div className="mb-24 animate-in fade-in slide-in-from-top-10 duration-500">
                        <PollCreationForm onSuccess={handlePollCreated} />
                    </div>
                )}

                {/* Polls Explorer Section */}
                <section className="relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] font-black uppercase tracking-widest">
                                <Vote size={12} /> Explorer
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Active Polls</h2>
                        </div>
                    </div>

                    <PollList userId={user?.uid} key={refreshKey} />
                </section>
            </div>
        </div>
    );
};

const Feature = ({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: 'orange' | 'blue' | 'purple' }) => {
    const colors = {
        orange: 'from-orange-500 to-red-600',
        blue: 'from-blue-500 to-indigo-600',
        purple: 'from-purple-500 to-pink-600'
    };

    return (
        <div className="p-10 bg-white dark:bg-[#161b22] border border-gray-100 dark:border-gray-800 rounded-[3rem] hover:border-orange-500/30 transition-all group shadow-xl hover:shadow-orange-900/5">
            <div className={`w-16 h-16 bg-gradient-to-tr ${colors[color]} rounded-[1.5rem] flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                {icon}
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{desc}</p>
        </div>
    );
};

export default VotingPage;
