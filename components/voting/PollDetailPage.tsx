'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { getPollBySlug, voteInPoll } from '../../services/db';
import { Poll } from '../../types';
import { auth } from '../../services/firebase';
import { ChevronLeft, Loader2, Users, TrendingUp, CheckCircle2, Share2, Calendar, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Header } from '../Header';
import { Footer } from '../Footer';

const PollDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [voting, setVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isCopied) {
            const t = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(t);
        }
    }, [isCopied]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!slug) return;

        const fetchPoll = async () => {
            setLoading(true);
            const data = await getPollBySlug(slug as string);
            if (data) {
                // Check if poll is approved or if user is admin
                const isAdmin = user?.email === 'bijaybiggs1@gmail.com'; // Admin check
                if (data.status !== 'approved' && !isAdmin) {
                    router.push('/voting');
                    return;
                }

                setPoll(data);
                if (user && data.votedUserIds?.includes(user.uid)) {
                    setHasVoted(true);
                }
            }
            setLoading(false);
        };

        fetchPoll();
    }, [slug, user, router]);

    const handleVote = async () => {
        if (!user || !selectedOption || hasVoted || voting || !poll) return;

        setVoting(true);
        const success = await voteInPoll(poll.id, selectedOption, user.uid);
        if (success) {
            setHasVoted(true);
            // Refresh poll data
            const updated = await getPollBySlug(slug as string);
            if (updated) setPoll(updated);
        }
        setVoting(false);
    };

    const calculatePercentage = (votes: number) => {
        if (!poll || poll.totalVotes === 0) return 0;
        return Math.round((votes / poll.totalVotes) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <h1 className="text-2xl font-bold mb-4">Poll Not Found</h1>
                <Link href="/voting" className="text-primary-500 hover:underline">Back to All Polls</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Note: In App Router, metadata is handled in the page.tsx file, 
                but keeping Head here temporarily as a fallback until the wrapper is ready.
                Actually, Head is ignored in app router, so I'll remove it. */}

            <Header />

            <main className="flex-grow pb-20">
                {/* Hero Section - Article Style aligned with Homepage */}
                <div className="h-[50vh] w-full relative overflow-hidden">
                    {poll.questionImage ? (
                        <img src={poll.questionImage} alt={poll.question} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-900 via-indigo-900 to-gray-950" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />

                    <div className="absolute bottom-0 w-full p-6 md:p-12 pb-16">
                        <div className="max-w-4xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium mb-8 relative z-10 shadow-sm border border-primary-500/10 dark:border-primary-400/10">
                                <Sparkles size={16} className="text-primary-600 dark:text-primary-400" /> {poll.category}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-[1.1] relative z-10 drop-shadow-md">
                                {poll.question}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-gray-300 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span className="font-medium">{poll.totalVotes.toLocaleString()} Votes</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-400">
                                    <TrendingUp size={16} />
                                    <span className="font-medium tracking-wide uppercase text-xs">Live Poll</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    <span>{new Date(poll.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 mt-12">
                    {/* Navigation */}
                    <Link
                        href="/voting"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8 group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Voting Feed
                    </Link>

                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-xl shadow-primary-500/5">
                        {poll.description && (
                            <div className="lead text-xl italic text-gray-600 dark:text-gray-300 border-l-4 border-primary-500 pl-6 mb-12 font-serif">
                                {poll.description}
                            </div>
                        )}

                        {/* Voting Area */}
                        <div className="space-y-4 mb-12">
                            {poll.options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => !hasVoted && setSelectedOption(option.id)}
                                    className={`relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group/opt ${hasVoted
                                        ? 'border-gray-100 dark:border-gray-700 cursor-default shadow-sm'
                                        : selectedOption === option.id
                                            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-primary-500/30'
                                        }`}
                                >
                                    {/* Progress Bar Background */}
                                    {hasVoted && (
                                        <div
                                            className="absolute inset-y-0 left-0 bg-primary-500/10 dark:bg-primary-500/20 transition-all duration-1000 ease-out z-0"
                                            style={{ width: `${calculatePercentage(option.votes)}%` }}
                                        />
                                    )}

                                    <div className="relative p-5 md:p-6 flex items-center gap-5 md:gap-8 z-10">
                                        {option.image && (
                                            <div className="w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0 group-hover/opt:scale-[1.02] transition-transform">
                                                <img src={option.image} alt={option.text} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            {!hasVoted && (
                                                <div className={`w-5 h-5 rounded-full border-2 mb-3 transition-all flex items-center justify-center ${selectedOption === option.id ? 'border-primary-600 bg-primary-600 shadow-md shadow-primary-500/30' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {selectedOption === option.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                            )}
                                            <span className={`text-lg md:text-xl font-bold tracking-tight ${hasVoted ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 group-hover/opt:text-primary-600'}`}>
                                                {option.text}
                                            </span>
                                            {hasVoted && (
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                                    {option.votes.toLocaleString()} Votes
                                                </span>
                                            )}
                                        </div>

                                        {hasVoted && (
                                            <div className="flex-shrink-0 ml-4">
                                                <span className="text-3xl md:text-5xl font-bold text-primary-600 dark:text-primary-400 opacity-90 tabular-nums">
                                                    {calculatePercentage(option.votes)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-col items-center pt-8 border-t border-gray-100 dark:border-gray-700">
                            {!hasVoted ? (
                                <div className="w-full max-w-md flex flex-col items-center gap-4">
                                    {!user && (
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">Please sign in to take part in this poll.</p>
                                    )}
                                    <button
                                        onClick={handleVote}
                                        disabled={!selectedOption || voting || !user}
                                        className={`w-full h-14 rounded-xl font-bold text-base transition-all ${!selectedOption || voting || !user
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            : 'bg-primary-600 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {voting ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : 'Cast Your Vote'}
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full flex items-center justify-center gap-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-inner">
                                    <CheckCircle2 size={28} className="stroke-[2.5px]" />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold leading-none">Your Voice is Recorded</span>
                                        <span className="text-sm font-medium opacity-80 mt-1">Thank you for participating in the community debate.</span>
                                    </div>
                                </div>
                            )}

                            {/* Utility Actions */}
                            <div className="mt-8 flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        setIsCopied(true);
                                    }}
                                    className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-all text-sm font-semibold"
                                >
                                    <Share2 size={16} />
                                    Share Poll
                                    {isCopied && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap animate-bounce">
                                            Copied!
                                        </div>
                                    )}
                                </button>
                                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                                <div className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase tracking-widest">
                                    Live
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PollDetailPage;
