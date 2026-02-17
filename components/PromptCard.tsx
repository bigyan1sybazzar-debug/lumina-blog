'use client';

import React, { useState } from 'react';
import { Prompt } from '../types';
import { Heart, Copy, Check, TrendingUp, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { likePrompt, incrementPromptUsage } from '../services/db';

interface PromptCardProps {
    prompt: Prompt;
    onLikeUpdate?: () => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({ prompt, onLikeUpdate }) => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [isLiked, setIsLiked] = useState(user ? prompt.likes.includes(user.id) : false);
    const [likeCount, setLikeCount] = useState(prompt.likes.length);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion when clicking copy
        try {
            await navigator.clipboard.writeText(prompt.content);
            setCopied(true);

            // Increment usage count
            await incrementPromptUsage(prompt.id);

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion when clicking like
        if (!user) {
            alert('Please login to like prompts');
            return;
        }

        try {
            const liked = await likePrompt(prompt.id, user.id);
            setIsLiked(liked);
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
            onLikeUpdate?.();
        } catch (error) {
            console.error('Failed to like prompt:', error);
        }
    };

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:border-primary-100 dark:hover:border-primary-900/30 cursor-pointer ${isExpanded ? 'ring-2 ring-primary-500' : ''}`}
        >
            {/* Featured Badge */}
            {prompt.isFeatured && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                    ⭐ Featured
                </div>
            )}

            {/* Category & Subcategory */}
            <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full">
                    {prompt.categoryName}
                </span>
                <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
                    {prompt.subcategoryName}
                </span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {prompt.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {prompt.description}
            </p>

            {/* Content Preview */}
            <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 relative overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-none' : 'max-h-32'}`}>
                <p className={`text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {prompt.content}
                </p>
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 dark:from-gray-800/50 to-transparent pointer-events-none" />
                )}
            </div>

            {/* Tags */}
            {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {prompt.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md"
                        >
                            #{tag}
                        </span>
                    ))}
                    {prompt.tags.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 dark:text-gray-500 text-xs">
                            +{prompt.tags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Actions & Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {/* Usage Count */}
                    <div className="flex items-center gap-1">
                        <span>{prompt.usageCount} uses</span>
                    </div>

                    {/* Like Count */}
                    <div className="flex items-center gap-1">
                        <span className={isLiked ? 'text-red-500' : ''}>{likeCount} likes</span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-1">
                        <span>{prompt.author.name}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`p-2 rounded-lg transition-all ${isLiked
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title="Like this prompt"
                    >
                        <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        {copied ? (
                            <>
                                <Check size={16} />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptCard;
