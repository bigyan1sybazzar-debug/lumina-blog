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
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${category === cat.id
                            ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/20'
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-500/30 hover:text-primary-500'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-primary-500 gap-4">
                    <Loader2 size={40} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">Synchronizing Polls...</span>
                </div>
            ) : polls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] text-gray-400 opacity-50 italic">
                    <Inbox size={48} className="mb-4 text-primary-500/50" />
                    <p className="text-xs font-bold uppercase tracking-wider">No polls found in this category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                    {polls.map((poll) => (
                        <PollCard key={poll.id} poll={poll} userId={userId} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default PollList;
