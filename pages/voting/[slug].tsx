'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getPollBySlug, voteInPoll } from '../../services/db';
import { Poll } from '../../types';
import { auth } from '../../services/firebase';
import { ChevronLeft, Loader2, Users, TrendingUp, CheckCircle2, Share2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

const PollDetailPage = () => {
    const router = useRouter();
    const { slug } = router.query;
    const [poll, setPoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [voting, setVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

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
    }, [slug, user]);

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
            <Head>
                <title>{`${poll.question} - Vote Now | Bigyann`}</title>
                <meta name="description" content={poll.description ? poll.description.substring(0, 160) : `Cast your vote on: ${poll.question}. See live results and community opinions on Bigyann Vote.`} />
                <meta property="og:title" content={`${poll.question} - Live Poll`} />
                <meta property="og:description" content={poll.description || `What's your opinion on ${poll.question}? Join the discussion and see real-time community results on Bigyann.`} />
                {poll.questionImage && (
                    <>
                        <meta property="og:image" content={poll.questionImage} />
                        <meta name="twitter:image" content={poll.questionImage} />
                    </>
                )}
                <meta property="og:url" content={`https://bigyann.com.np/voting/${poll.slug || poll.id}`} />
                <meta property="og:site_name" content="Bigyann Vote" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={poll.question} />
                <meta name="twitter:description" content={poll.description || `Cast your vote and see live results.`} />
                <link rel="canonical" href={`https://bigyann.com.np/voting/${poll.slug || poll.id}`} />
                <meta name="keywords" content={`poll, voting, ${poll.category}, ${poll.question.split(' ').join(', ')}, bigyann`} />
            </Head>

            <Header />

            <main className="flex-grow pt-24 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Navigation */}
                    <Link
                        href="/voting"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-500 transition-colors mb-8 group"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Feed
                    </Link>

                    {/* Main Content Card */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl shadow-primary-500/5">
                        {/* ... (rest of the card content) */}
                        {/* Header Image */}
                        {poll.questionImage && (
                            <div className="w-full h-64 md:h-96 relative overflow-hidden">
                                <img src={poll.questionImage} alt={poll.question} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500 text-white text-[10px] font-black uppercase tracking-widest mb-4">
                                        {poll.category}
                                    </span>
                                    <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-none">
                                        {poll.question}
                                    </h1>
                                </div>
                            </div>
                        )}

                        <div className="p-8 md:p-12">
                            {!poll.questionImage && (
                                <div className="mb-8">
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                        {poll.category}
                                    </span>
                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                        {poll.question}
                                    </h1>
                                </div>
                            )}

                            {poll.description && (
                                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-10 max-w-3xl">
                                    {poll.description}
                                </p>
                            )}

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                    <Users size={20} className="text-primary-500 mb-2" />
                                    <span className="text-xl font-black text-gray-900 dark:text-white">{poll.totalVotes}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Total Votes</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                    <TrendingUp size={20} className="text-green-500 mb-2" />
                                    <span className="text-xl font-black text-gray-900 dark:text-white">Live</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                    <Calendar size={20} className="text-blue-500 mb-2" />
                                    <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-full">
                                        {new Date(poll.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Launched</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                                    <Share2 size={20} className="text-purple-500 mb-2" />
                                    <span className="text-xl font-black text-gray-900 dark:text-white">Copy</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Link</span>
                                </div>
                            </div>

                            {/* Voting Area - 2 Column Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                                {poll.options.map((option) => (
                                    <div
                                        key={option.id}
                                        onClick={() => !hasVoted && setSelectedOption(option.id)}
                                        className={`relative flex flex-col overflow-hidden rounded-[2rem] border-2 transition-all cursor-pointer group/opt min-h-[140px] ${hasVoted
                                            ? 'border-gray-100 dark:border-gray-700 cursor-default'
                                            : selectedOption === option.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-lg shadow-primary-500/10'
                                                : 'border-gray-100 dark:border-gray-700 hover:border-primary-500/30 hover:shadow-md'
                                            }`}
                                    >
                                        {/* Progress Bar Background */}
                                        {hasVoted && (
                                            <div
                                                className="absolute inset-0 bg-primary-500/5 transition-all duration-1000 ease-out z-0"
                                                style={{ width: `${calculatePercentage(option.votes)}%` }}
                                            />
                                        )}

                                        <div className="relative p-6 flex flex-1 items-center gap-6 z-10">
                                            {option.image && (
                                                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0 group-hover/opt:scale-105 transition-transform">
                                                    <img src={option.image} alt={option.text} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 flex flex-col justify-center min-w-0">
                                                {!hasVoted && (
                                                    <div className={`w-5 h-5 rounded-full border-2 mb-3 transition-all flex-shrink-0 ${selectedOption === option.id ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                        {selectedOption === option.id && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-0.5" />}
                                                    </div>
                                                )}
                                                <span className={`text-xl md:text-2xl font-black tracking-tight leading-tight truncate ${hasVoted ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {option.text}
                                                </span>
                                                {hasVoted && (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                        {option.votes} Votes
                                                    </span>
                                                )}
                                            </div>

                                            {hasVoted && (
                                                <div className="flex-shrink-0 ml-2">
                                                    <span className="text-3xl md:text-5xl font-black text-primary-600 dark:text-primary-400 italic">
                                                        {calculatePercentage(option.votes)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Area */}
                            <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-gray-100 dark:border-gray-700 gap-8">
                                {!hasVoted ? (
                                    <div className="w-full flex flex-col items-center gap-4">
                                        {!user && (
                                            <p className="text-sm font-bold text-gray-400 italic">Please sign in to cast your vote.</p>
                                        )}
                                        <button
                                            onClick={handleVote}
                                            disabled={!selectedOption || voting || !user}
                                            className={`w-full md:w-96 h-20 rounded-[1.5rem] font-black text-lg uppercase tracking-widest transition-all ${!selectedOption || voting || !user
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                : 'bg-primary-600 text-white shadow-xl shadow-primary-500/30 hover:bg-primary-700 hover:-translate-y-1'
                                                }`}
                                        >
                                            {voting ? <Loader2 className="animate-spin mx-auto w-8 h-8" /> : 'Cast Your Vote'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-full flex items-center justify-center gap-4 bg-green-500/10 text-green-600 p-6 rounded-[2rem] border border-green-500/20">
                                        <CheckCircle2 size={32} strokeWidth={3} />
                                        <div className="flex flex-col text-center md:text-left">
                                            <span className="text-lg font-black uppercase tracking-widest leading-none">Voice Recorded</span>
                                            <span className="text-sm font-bold opacity-70 mt-1">Your opinion has been registered on the blockchain.</span>
                                        </div>
                                    </div>
                                )}
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
