'use client';

import React, { useState } from 'react';
import { Poll, PollOption } from '../types';
import { voteInPoll } from '../services/db';
import { CheckCircle2, Circle, TrendingUp, Users, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PollCardProps {
    poll: Poll;
    userId?: string;
    variant?: 'full' | 'minimal';
}

const PollCard: React.FC<PollCardProps> = ({ poll, userId, variant = 'full' }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState<boolean>(poll.votedUserIds?.includes(userId || '') || false);
    const [loading, setLoading] = useState<boolean>(false);
    const [localPoll, setLocalPoll] = useState<Poll>(poll);

    const handleVote = async () => {
        if (!userId || !selectedOption || hasVoted || loading) return;

        setLoading(true);
        const success = await voteInPoll(poll.id, selectedOption, userId);
        if (success) {
            setHasVoted(true);
            const updatedOptions = localPoll.options.map(opt => {
                if (opt.id === selectedOption) {
                    return { ...opt, votes: opt.votes + 1 };
                }
                return opt;
            });
            setLocalPoll({
                ...localPoll,
                options: updatedOptions,
                totalVotes: localPoll.totalVotes + 1,
                votedUserIds: [...(localPoll.votedUserIds || []), userId]
            });
        }
        setLoading(false);
    };

    const calculatePercentage = (votes: number) => {
        if (poll.totalVotes === 0) return 0;
        return Math.round((votes / poll.totalVotes) * 100);
    };

    if (variant === 'minimal') {
        const pollUrl = `/voting/${poll.slug || poll.id}`;

        // Find leading option
        const leadingOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
        const leadingPercentage = poll.totalVotes > 0 ? Math.round((leadingOption.votes / poll.totalVotes) * 100) : 0;

        // Truncate description to ~20 words
        const truncatedDescription = poll.description
            ? poll.description.split(' ').slice(0, 20).join(' ') + (poll.description.split(' ').length > 20 ? '...' : '')
            : '';

        return (
            <Link
                href={pollUrl}
                className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500"
            >
                <div className="relative aspect-[16/9] overflow-hidden block">
                    {poll.questionImage ? (
                        <Image
                            src={poll.questionImage}
                            alt={poll.question}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 flex items-center justify-center">
                            <TrendingUp size={40} className="text-primary-500/20" />
                        </div>
                    )}
                    {/* Category Tag */}
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-100 shadow-md">
                        {poll.category}
                    </div>
                </div>

                <div className="flex-1 p-3 sm:p-5 flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors line-clamp-2 text-sm sm:text-lg mb-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
                        {poll.question}
                    </h3>

                    {truncatedDescription && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                            {truncatedDescription}
                        </p>
                    )}

                    {/* Leading Result Indicator */}
                    <div className="mt-auto">
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-100 dark:border-gray-700/50">
                            <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Leader</span>
                                <span className="text-primary-600 dark:text-primary-400 font-bold text-xs sm:text-sm whitespace-nowrap">{leadingPercentage}%</span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate flex-1 min-w-0">{leadingOption.text}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0"></div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                                <Users size={12} className="sm:w-3.5 sm:h-3.5" /> {poll.totalVotes}
                            </span>
                            <div className="flex items-center gap-1 text-primary-500 group-hover:gap-2 transition-all whitespace-nowrap">
                                <span className="font-bold">Vote</span>
                                <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={`/voting/${poll.slug || poll.id}`}
            className="bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative h-full"
        >
            {/* Question Image */}
            {poll.questionImage && (
                <div className="w-full h-48 relative overflow-hidden">
                    <Image
                        src={poll.questionImage}
                        alt={poll.question}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
            )}

            <div className="p-6 flex flex-col flex-grow relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
                        {poll.category}
                    </span>
                    <TrendingUp size={14} className="text-primary-500/50" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {poll.question}
                </h3>

                <div className="flex-grow space-y-2 mb-6">
                    {poll.options.slice(0, 3).map((option) => (
                        <div
                            key={option.id}
                            className="relative overflow-hidden rounded-xl border border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 p-3 flex items-center justify-between gap-3"
                        >
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                                {option.text}
                            </span>
                            <div className="w-4 min-w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />
                        </div>
                    ))}
                    {poll.options.length > 3 && (
                        <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-wider items-center flex justify-center gap-1.5">+ {poll.options.length - 3} more options</p>
                    )}
                </div>

                <div className="mt-auto pt-5 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-2 text-gray-400">
                            <Users size={12} /> {poll.totalVotes.toLocaleString()} Votes
                        </span>
                        <span className="text-primary-600 group-hover:translate-x-1 transition-transform">
                            Vote Now &rarr;
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default PollCard;
