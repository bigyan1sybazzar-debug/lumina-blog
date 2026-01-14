'use client';

import React, { useState, useEffect } from 'react';
import { Prompt, PromptCategory, PromptSubcategory } from '../types';
import { getPrompts, getPromptCategories, getPromptSubcategories } from '../services/db';
import PromptCard from './PromptCard';
import { Search, Filter } from 'lucide-react';

interface PromptLibraryProps {
    compact?: boolean; // For use in modals
    limit?: number;
    showSearch?: boolean;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({
    compact = false,
    limit,
    showSearch = true
}) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [categories, setCategories] = useState<PromptCategory[]>([]);
    const [subcategories, setSubcategories] = useState<PromptSubcategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadPrompts();
    }, [selectedCategory, selectedSubcategory]);

    const loadData = async () => {
        try {
            const [cats, subcats] = await Promise.all([
                getPromptCategories(),
                getPromptSubcategories()
            ]);
            setCategories(cats);
            setSubcategories(subcats);
            await loadPrompts();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPrompts = async () => {
        try {
            const filters: any = { status: 'approved' };
            if (selectedCategory) filters.categoryId = selectedCategory;
            if (selectedSubcategory) filters.subcategoryId = selectedSubcategory;

            const data = await getPrompts(filters);
            setPrompts(data);
        } catch (error) {
            console.error('Error loading prompts:', error);
        }
    };

    const filteredPrompts = prompts.filter(prompt => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            prompt.title.toLowerCase().includes(query) ||
            prompt.description.toLowerCase().includes(query) ||
            prompt.content.toLowerCase().includes(query) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(query))
        );
    });

    const displayPrompts = limit ? filteredPrompts.slice(0, limit) : filteredPrompts;

    const filteredSubcategories = selectedCategory
        ? subcategories.filter(sub => sub.categoryId === selectedCategory)
        : subcategories;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className={compact ? 'space-y-4' : 'space-y-6'}>
            {/* Header */}
            {!compact && (
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500">
                            Prompts Library
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Browse and copy prompts for AI, writing, marketing, and more
                        </p>
                    </div>
                </div>
            )}

            {/* Search */}
            {showSearch && (
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 text-gray-900 dark:text-white"
                    />
                </div>
            )}

            {/* Category Filters */}
            {categories.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <Filter size={16} />
                        <span>Categories</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                setSelectedCategory('');
                                setSelectedSubcategory('');
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${!selectedCategory
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setSelectedSubcategory('');
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === cat.id
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Subcategory Filters */}
            {selectedCategory && filteredSubcategories.length > 0 && (
                <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Subcategories
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSubcategory('')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!selectedSubcategory
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            All
                        </button>
                        {filteredSubcategories.map(subcat => (
                            <button
                                key={subcat.id}
                                onClick={() => setSelectedSubcategory(subcat.id)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSubcategory === subcat.id
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {subcat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Prompts Grid */}
            {displayPrompts.length > 0 ? (
                <div className={`grid gap-6 ${compact
                    ? 'grid-cols-1'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {displayPrompts.map(prompt => (
                        <PromptCard key={prompt.id} prompt={prompt} onLikeUpdate={loadPrompts} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? 'No prompts found matching your search.' : 'No prompts available yet.'}
                    </p>
                </div>
            )}

            {/* Show More Link */}
            {limit && filteredPrompts.length > limit && (
                <div className="text-center pt-4">
                    <a
                        href="/prompts"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                        View All Prompts ({filteredPrompts.length})
                    </a>
                </div>
            )}
        </div>
    );
};

export default PromptLibrary;
