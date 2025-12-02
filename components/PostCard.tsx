import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';

const { Link } = ReactRouterDOM;

interface PostCardProps {
  post: BlogPost;
  categoryName?: string;
  variant?: 'vertical' | 'horizontal';
}

export const PostCard: React.FC<PostCardProps> = ({ post, categoryName, variant = 'vertical' }) => {
  const postUrl = `/blog/${post.slug ?? post.id}`;

  // Responsive title trim - adjusted for mobile
  const trimTitle = (title: string) => {
    const words = title.split(' ');
    if (window.innerWidth >= 1024) return words.length > 12 ? words.slice(0, 12).join(' ') + '...' : title;
    if (window.innerWidth >= 768) return words.length > 8 ? words.slice(0, 8).join(' ') + '...' : title;
    return words.length > 6 ? words.slice(0, 6).join(' ') + '...' : title;
  };

  const [trimmedTitle, setTrimmedTitle] = React.useState(trimTitle(post.title));

  React.useEffect(() => {
    const handleResize = () => setTrimmedTitle(trimTitle(post.title));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [post.title]);

  if (variant === 'horizontal') {
    return (
      <Link 
        to={postUrl} 
        className="group flex flex-col md:flex-row gap-4 md:gap-6 items-start"
      >
        <div className="w-full md:w-2/5 aspect-video md:aspect-square rounded-xl overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 py-1">
          <div className="flex items-center space-x-2 text-sm md:text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide mb-2">
            <span>{categoryName || post.category || 'Uncategorized'}</span>
            <span>•</span>
            <span className="text-gray-500 dark:text-gray-500 font-normal">{post.readTime}</span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 transition-colors">
            {trimmedTitle}
          </h3>

          <p className="text-base md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center text-base md:text-sm font-medium text-gray-900 dark:text-gray-100">
            Read more <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    );
  }

  // Vertical variant - updated for 2 items per row on mobile
  return (
    <article className="group flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
      <Link to={postUrl} className="relative aspect-[16/10] md:aspect-[16/11] overflow-hidden">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
          {categoryName || post.category || 'Uncategorized'}
        </div>
      </Link>

      <div className="flex-1 p-5 md:p-6 flex flex-col">
        <div className="flex items-center text-sm md:text-xs text-gray-500 dark:text-gray-400 mb-3 space-x-3">
          <span>{post.date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            {post.readTime}
          </div>
        </div>

        <Link to={postUrl} className="block mb-3 flex-grow">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {trimmedTitle}
          </h3>
          <p className="mt-2 text-base md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {post.excerpt}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 md:w-8 md:h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
            />
            <span className="text-base md:text-sm font-medium text-gray-900 dark:text-gray-200">
              {post.author.name}
            </span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
};