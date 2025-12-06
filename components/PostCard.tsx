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
  textSizeClass?: string; 
  alignLeft?: boolean; 
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, 
    categoryName, 
    variant = 'vertical',
    // Using a smaller default size for better consistency when a specific class isn't passed
    textSizeClass = 'text-base', 
    increasedTitle,
    alignLeft = false 
}) => {
  const postUrl = `/blog/${post.slug ?? post.id}`;
  const displayTitle = post.title;

  // --- Alignment Control ---
  // Ensure text is left-aligned and that the flex container for text also aligns items to the start.
  const alignmentClass = alignLeft ? 'text-left' : 'text-center'; 
  const contentFlexAlignment = alignLeft ? 'items-start' : 'items-center';

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
        {/* HORIZONTAL VARIANT: All text content is wrapped in alignmentClass */}
        <div className={`flex-1 py-1 ${alignmentClass}`}>
          
          {/* Date/Read Time/Category: Consistent smaller font (text-xs) */}
          <div className="flex items-center space-x-2 text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide mb-2">
            <span>{categoryName || post.category || 'Uncategorized'}</span>
            <span>•</span>
            <span className="text-gray-500 dark:text-gray-500 font-normal">{post.readTime}</span>
          </div>

          {/* Title: Consistent font size (textSizeClass) */}
          <h3 className={`font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors ${textSizeClass}`}>
            {displayTitle}
          </h3>

          {/* Excerpt: Consistent font size (text-sm) */}
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          
          {/* Read More link */}
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

      {/* VERTICAL VARIANT: Apply text-left and items-start to the main flex container */}
      <div className={`flex-1 p-6 flex flex-col ${alignmentClass} ${contentFlexAlignment}`}>
        
        {/* Date and time to read: Consistent smaller font (text-xs), aligned left */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            {post.readTime}
          </div>
        </div>

        <Link to={postUrl} className="block mb-3">
          {/* Title: Consistent font size (textSizeClass) */}
          <h3 className={`font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${textSizeClass}`}>
            {displayTitle}
          </h3>
        </Link>

        {/* Excerpt is now missing in the vertical card. Adding it back here: */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {post.excerpt}
        </p>

        {/* Author details: Left aligned (flex items-center) */}
        <div className="flex items-center justify-between mt-auto w-full"> {/* Added w-full to ensure it spans full width */}
          <div className="flex items-center space-x-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
            />
            {/* Author name: Consistent font size (text-sm) */}
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
              {post.author.name}
            </span>
        </div>
        </div>
      </div>
    </article>
  );
};