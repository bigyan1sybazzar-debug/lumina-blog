'use client';

import React, { useState } from 'react';
import { Poll, PollOption } from '../types';
import { voteInPoll } from '../services/db';
import { CheckCircle2, Circle, TrendingUp, Users, Loader2 } from 'lucide-react';

interface PollCardProps {
    poll: Poll;
    userId?: string;
}

const PollCard: React.FC<PollCardProps> = ({ poll, userId }) => {
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
        if (localPoll.totalVotes === 0) return 0;
        return Math.round((votes / localPoll.totalVotes) * 100);
    };

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-orange-500/30 flex flex-col group">
            {/* Question Image */}
            {localPoll.questionImage && (
                <div className="w-full h-48 relative overflow-hidden">
                    <img
                        src={localPoll.questionImage}
                        alt={localPoll.question}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent" />
                </div>
            )}

            <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                        {localPoll.category}
                    </span>
                </div>

                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight leading-tight">
                    {localPoll.question}
                </h3>

                {localPoll.description && (
                    <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
                        {localPoll.description}
                    </p>
                )}

                <div className={`grid gap-4 mb-8 ${localPoll.options.some(o => o.image) ? 'grid-cols-1' : 'grid-cols-1'}`}>
                    {localPoll.options.map((option) => (
                        <div
                            key={option.id}
                            onClick={() => !hasVoted && setSelectedOption(option.id)}
                            className={`relative overflow-hidden rounded-[1.5rem] border-2 transition-all cursor-pointer ${hasVoted
                                ? 'border-gray-800/50 cursor-default'
                                : selectedOption === option.id
                                    ? 'border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-900/10'
                                    : 'border-gray-800/50 hover:border-gray-700 bg-black/20'
                                }`}
                        >
                            {/* Progress Bar Background */}
                            {hasVoted && (
                                <div
                                    className="absolute inset-0 bg-orange-500/10 transition-all duration-1000 ease-out"
                                    style={{ width: `${calculatePercentage(option.votes)}%` }}
                                />
                            )}

                            <div className="relative p-5 flex items-center gap-4 z-10">
                                {/* Option Image if available */}
                                {option.image && (
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-800 shadow-md">
                                        <img src={option.image} alt={option.text} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {!hasVoted && (
                                            selectedOption === option.id
                                                ? <CheckCircle2 size={24} className="text-orange-500 flex-shrink-0" />
                                                : <Circle size={24} className="text-gray-800 flex-shrink-0" />
                                        )}
                                        <span className={`font-bold text-lg md:text-xl ${hasVoted ? 'text-white' : 'text-gray-300'}`}>
                                            {option.text}
                                        </span>
                                    </div>

                                    {hasVoted && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-orange-400 text-2xl font-black italic">
                                                {calculatePercentage(option.votes)}%
                                            </span>
                                            <span className="text-gray-600 text-[10px] font-black uppercase tracking-tighter">
                                                {option.votes} Votes
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-800/50">
                    <div className="flex items-center gap-6 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            {localPoll.totalVotes} Total Votes
                        </span>
                    </div>

                    {!hasVoted ? (
                        <button
                            onClick={handleVote}
                            disabled={!selectedOption || loading}
                            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 ${!selectedOption || loading
                                ? 'bg-gray-800/50 text-gray-700 cursor-not-allowed border border-gray-800'
                                : 'bg-orange-600 text-white hover:bg-orange-500 shadow-2xl shadow-orange-900/30'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Verifying...
                                </div>
                            ) : 'Cast Your Vote'}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Vote Secured
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PollCard;
