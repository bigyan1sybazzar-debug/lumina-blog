import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';

const { Link } = ReactRouterDOM;

interface PostCardProps {
  post: BlogPost;
  categoryName?: string;
  variant?: 'vertical' | 'horizontal';
  increasedTitle?: boolean;
  textSizeClass?: string; // Crucial prop for responsive font sizing
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, 
    categoryName, 
    variant = 'vertical',
    // Setting a sensible default that prioritizes small font on mobile (text-sm)
    textSizeClass = 'text-sm sm:text-lg', 
    increasedTitle 
}) => {
  // Safe URL: uses slug if exists, falls back to id (never breaks)
  const postUrl = `/blog/${post.slug ?? post.id}`;

  // The title is now assumed to be pre-truncated by the parent component (Home.tsx)
  const displayTitle = post.title;

  if (variant === 'horizontal') {
    return (
      <Link to={postUrl} className="group flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-1/3 aspect-video rounded-xl overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 py-1">
          {/* FIXED: Ensure date/read time is small (text-xs) */}
          <div className="flex items-center space-x-2 text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide mb-2">
            <span>{categoryName || post.category || 'Uncategorized'}</span>
            <span>•</span>
            <span className="text-gray-500 dark:text-gray-500 font-normal">{post.readTime}</span>
          </div>

          {/* APPLIED textSizeClass for responsive font size on title */}
          <h3 className={`font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors ${textSizeClass}`}>
            {displayTitle}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
            Read more <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    );
  }

  // Vertical variant (used in Slider and Categories)
  return (
    <article className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
      <Link to={postUrl} className="relative aspect-[16/10] overflow-hidden">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
          {categoryName || post.category || 'Uncategorized'}
        </div>
      </Link>

      <div className="flex-1 p-6 flex flex-col">
        {/* FIXED: Dates/Times/Category text set to text-xs */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            {post.readTime}
          </div>
        </div>

        <Link to={postUrl} className="block mb-3">
          {/* APPLIED textSizeClass for responsive font size on title */}
          <h3 className={`font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${textSizeClass}`}>
            {displayTitle}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
            />
            {/* FIXED: Author name text set to text-sm */}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {post.author.name}
            </span>
        </div>
        </div>
      </div>
    </article>
  );
};