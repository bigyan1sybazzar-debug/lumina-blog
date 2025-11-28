// src/pages/Categories.tsx
import React, { useEffect, useState, useRef } from 'react';
import { getCategories, getPosts } from '../services/db';
import { Category, BlogPost } from '../types';
import * as Icons from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrows = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 20);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
  };

  useEffect(() => {
    updateArrows();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateArrows);
      window.addEventListener('resize', updateArrows);
      return () => {
        container.removeEventListener('scroll', updateArrows);
        window.removeEventListener('resize', updateArrows);
      };
    }
  }, [categories]);

  const scrollLeft = () => scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  const scrollRight = () => scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

  // Mobile swipe
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? scrollRight() : scrollLeft();
    touchStartX.current = null;
  };

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      setCategories(data);
      setLoadingCategories(false);
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const posts = await getPosts();
      setAllPosts(posts);
      setDisplayedPosts(posts);
      setLoadingPosts(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setDisplayedPosts(allPosts);
    } else {
      setDisplayedPosts(allPosts.filter(p => p.category === selectedCategory.name));
    }
  }, [selectedCategory, allPosts]);

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.Hash;
    return <Icon size={20} />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Topics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Swipe or click to discover your favorite categories
          </p>
        </div>

        {/* Scrollable Categories with Arrows */}
        <div className="relative mb-16 group">
          {loadingCategories ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" size={40} />
            </div>
          ) : (
            <>
              {/* Desktop Arrows - Big & Beautiful */}
              <button
                onClick={scrollLeft}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-3xl hidden sm:flex ${
                  showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronLeft size={32} className="text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={scrollRight}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-all hover:scale-110 hover:shadow-3xl hidden sm:flex ${
                  showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronRight size={32} className="text-gray-700 dark:text-gray-300" />
              </button>

              {/* Mobile Small Arrows */}
              <button
                onClick={scrollLeft}
                className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg flex items-center justify-center sm:hidden transition-all ${
                  showLeftArrow ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={scrollRight}
                className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-lg flex items-center justify-center sm:hidden transition-all ${
                  showRightArrow ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <ChevronRight size={24} />
              </button>

              {/* Categories */}
              <div
                ref={scrollContainerRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4 select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* All */}
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold whitespace-nowrap flex-shrink-0 transition-all shadow-md hover:shadow-lg ${
                    !selectedCategory
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white scale-105 shadow-xl'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    {getIcon('Globe')}
                  </div>
                  All Categories
                </button>

                {categories.map((cat) => {
                  const active = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold whitespace-nowrap flex-shrink-0 transition-all shadow-md hover:shadow-lg ${
                        active
                          ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white scale-105 shadow-xl'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        {getIcon(cat.icon || 'Hash')}
                      </div>
                      <span>{cat.name}</span>
                      {cat.count !== undefined}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Divider + Title */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedCategory ? selectedCategory.name : 'All Posts'}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-transparent dark:via-gray-700"></div>
          </div>
          {selectedCategory && (
            <p className="text-center mt-4 text-lg text-gray-600 dark:text-gray-400">
              {displayedPosts.length} article{displayedPosts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Posts Grid – 2 columns from 480px */}
        {loadingPosts ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-500 dark:text-gray-400">
            No posts in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} categoryName={selectedCategory?.name} />
            ))}
          </div>
        )}
      </div>

      {/* Hide scrollbar */}
      
    </div>
  );
};

export default Categories;