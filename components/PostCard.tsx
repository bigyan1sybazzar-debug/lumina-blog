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
  textSizeClass = 'text-base',
  increasedTitle,
  alignLeft = false
}) => {
  const postUrl = `${post.slug ?? post.id}`;
  const displayTitle = post.title;

  // Alignment Control
  const alignmentClass = alignLeft ? 'text-left' : 'text-center';

  // Default image for safety
  const coverImage = post.coverImage || '/placeholder-image.jpg';

  if (variant === 'horizontal') {
    return (
      <Link
        to={postUrl}
        className="group flex flex-col md:flex-row gap-6 p-4 bg-white dark:bg-gray-800 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500"
      >
        <div className="md:w-2/5 aspect-video rounded-xl overflow-hidden shadow-md">
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className={`flex-1 py-1 ${alignmentClass}`}>
          {/* Category Badge */}
          <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold">
            {categoryName || post.category || 'Uncategorized'}
          </div>

          {/* Title */}
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors ${increasedTitle ? 'text-xl' : 'text-lg'}`}
          >
            {displayTitle}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {post.author.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Vertical variant (Default)
  return (
    <article className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500">
      <Link to={postUrl} className="relative aspect-[16/9] overflow-hidden">
        <img
          src={coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {/* Category Tag */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-100 shadow-md">
          {categoryName || post.category || 'Uncategorized'}
        </div>
      </Link>

      <div className="flex-1 p-5 flex flex-col">
        {/* Date & Read Time */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </div>
        </div>

        {/* Title */}
        <Link to={postUrl} className="block mb-3">
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors mb-2 ${textSizeClass}`}
          >
            {displayTitle}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-grow">
          {post.excerpt}
        </p>

        {/* Author & Read More */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-700"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {post.author.name}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
};