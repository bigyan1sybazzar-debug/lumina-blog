import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';

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
  const postUrl = `/${post.slug ?? post.id}`;
  const displayTitle = post.title;

  // Alignment Control
  const alignmentClass = alignLeft ? 'text-left' : 'text-center';

  // Robust fallback logic
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return url.startsWith('/');
    }
  };

  const coverImage = (post.coverImage && post.coverImage.trim() !== '' && isValidUrl(post.coverImage))
    ? post.coverImage.trim()
    : 'https://placehold.co/600x400/png?text=No+Image';

  if (variant === 'horizontal') {
    return (
      <Link
        href={postUrl}
        className="group flex flex-col md:flex-row gap-6 p-4 bg-white dark:bg-gray-800 rounded-2xl hover:shadow-xl transition duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500"
      >
        <div className="relative md:w-2/5 aspect-video rounded-xl overflow-hidden shadow-md">
          <Image
            src={coverImage}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 40vw"
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
              <Image
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`}
                alt={post.author.name}
                width={32}
                height={32}
                unoptimized
                className="rounded-full border-2 border-white dark:border-gray-700"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`;
                }}
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
    <article className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-500">
      <Link href={postUrl} className="relative aspect-[16/9] overflow-hidden block">
        <Image
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {/* Category Tag */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-100 shadow-md">
          {categoryName || post.category || 'Uncategorized'}
        </div>
      </Link>

      <div className="flex-1 p-3 min-[480px]:p-5 flex flex-col">
        {/* Date - Show first on mobile, hide on desktop */}
        <div className="min-[480px]:hidden text-xs text-gray-500 dark:text-gray-400 mb-1.5 text-left">
          <span>{post.date}</span>
        </div>

        {/* Date & Read Time - Desktop only (original position) */}
        <div className="hidden min-[480px]:flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </div>
        </div>

        {/* Title */}
        <Link href={postUrl} className="block mb-2 min-[480px]:mb-3">
          <h3
            className={`font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors mb-1 min-[480px]:mb-2 ${textSizeClass}`}
          >
            {displayTitle}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2 min-[480px]:mb-4 flex-grow">
          {post.excerpt}
        </p>

        {/* Time to Read - Mobile only (after excerpt) */}
        <div className="min-[480px]:hidden flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Clock className="w-3 h-3" />
          {post.readTime}
        </div>

        {/* Author & Read More */}
        <div className="flex items-center justify-between pt-2 min-[480px]:pt-4 mt-auto border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Image
              src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`}
              alt={post.author.name}
              width={32}
              height={32}
              unoptimized
              className="rounded-full border-2 border-white dark:border-gray-700"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=random`;
              }}
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