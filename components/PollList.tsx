'use client';

import React, { useState, useEffect } from 'react';
import { Poll } from '../types';
import { getPolls } from '../services/db';
import PollCard from './PollCard';
import { Vote, Filter, Loader2, Inbox } from 'lucide-react';

interface PollListProps {
    userId?: string;
    initialCategory?: string;
}

const PollList: React.FC<PollListProps> = ({ userId, initialCategory = 'all' }) => {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [category, setCategory] = useState<string>(initialCategory);
    const [loading, setLoading] = useState<boolean>(true);

    const categories = [
        { id: 'all', label: 'All Polls' },
        { id: 'election', label: 'Elections' },
        { id: 'movies', label: 'Movies' },
        { id: 'gadgets', label: 'Gadgets' },
        { id: 'other', label: 'Others' }
    ];

    useEffect(() => {
        const fetchPolls = async () => {
            setLoading(true);
            const data = await getPolls(category === 'all' ? undefined : category);
            setPolls(data);
            setLoading(false);
        };
        fetchPolls();
    }, [category]);

    return (
        <div className="space-y-8">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center justify-center gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${category === cat.id
                                ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/20'
                                : 'bg-[#161b22] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-orange-500 gap-4">
                    <Loader2 size={40} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Polls...</span>
                </div>
            ) : polls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-[#161b22] border border-gray-800 rounded-[2.5rem] text-gray-600 opacity-30 italic">
                    <Inbox size={48} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">No polls found in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {polls.map((poll) => (
                        <PollCard key={poll.id} poll={poll} userId={userId} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PollList;
