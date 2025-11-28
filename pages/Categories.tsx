// src/pages/Categories.tsx
import React, { useEffect, useState } from 'react';
import { getCategories, getPosts } from '../services/db';
import { Category, BlogPost } from '../types';
import * as Icons from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { Loader2 } from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Fetch all published posts once
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await getPosts(); // already returns only published
        setAllPosts(posts);
        setDisplayedPosts(posts); // show all by default
      } catch (err) {
        console.error('Failed to load posts', err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // Filter posts when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setDisplayedPosts(allPosts);
    } else {
      const filtered = allPosts.filter(post =>
        post.category === selectedCategory.name ||
        post.categoryId === selectedCategory.id ||
        post.category === selectedCategory.slug
      );
      setDisplayedPosts(filtered);
    }
  }, [selectedCategory, allPosts]);

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={28} /> : <Icons.Hash size={28} />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Explore Topics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Dive deep into the subjects that matter most to you.
          </p>
        </div>

        {/* All Categories Button */}
        <div className="text-center mb-10">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-8 py-3 rounded-full font-semibold text-lg transition-all ${
              !selectedCategory
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
            }`}
          >
            All Categories
          </button>
        </div>

        {/* Categories Grid */}
        {loadingCategories ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-20">
            {categories.map((category) => {
              const isActive = selectedCategory?.id === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={`group p-8 rounded-2xl border-2 transition-all duration-300 text-center shadow-md hover:shadow-xl ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 scale-105'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:scale-102'
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-md transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white'
                  }`}>
                    {getIcon(category.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {category.name}
                  </h3>
                 
                </button>
              );
            })}
          </div>
        )}

        {/* Divider + Title */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex items-center gap-6">
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedCategory ? `${selectedCategory.name} Posts` : 'All Posts'}
            </h2>
            <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          </div>
          {selectedCategory && (
            <p className="text-center mt-4 text-lg text-gray-600 dark:text-gray-400">
              {displayedPosts.length} article{displayedPosts.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={48} />
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500 dark:text-gray-400">
              No posts in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedPosts.map((post) => (
              <PostCard key={post.id} post={post} categoryName={selectedCategory?.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;