import React, { useEffect, useState } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateBlogOutline, generateFullPost } from '../services/geminiService'; // (Implicitly called elsewhere)
const POSTS_PER_PAGE = 6;

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  const trendingPosts = posts.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <span className="ml-3 text-lg font-medium">Loading posts...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section - Mobile Optimized */}
      <section className="relative bg-white dark:bg-gray-900 pt-20 pb-20 md:pt-28 md:pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="inline-flex items-center px-4 py-2 mb-6 text-xs sm:text-sm font-semibold tracking-wider uppercase text-primary-700 dark:text-primary-300 bg-primary-100/70 dark:bg-primary-900/40 rounded-full border border-primary-200 dark:border-primary-800">
            Welcome to Bigyann
            </span>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Your daily tech and  <br className="block sm:hidden" />
              <span className="bg-gradient-to-r from-primary-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              science feed.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed px-4">
            Explore discoveries, gadgets, AI updates, space science, and more.            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4">
              <a
                href="#posts"
                className="px-8 py-4 rounded-full bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 active:scale-95 transition-all shadow-xl"
              >
                Start Reading
              </a>
              <Link
                to="/categories"
                className="px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
              >
                Explore Topics
              </Link>
            </div>
          </div>
        </div>
      </section>

     {/* Latest Posts - 2 columns from mobile (~375px+) */}
<section id="posts" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
  <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Latest Posts</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Fresh content every week.</p>
      </div>
   
    </div>

    {posts.length > 0 ? (
      <>
        {/* This is the magic line */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-7 lg:gap-8">
          {currentPosts.map((post) => (
            <div key={post.id} className="h-full">
              <PostCard post={post} />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-12 px-4 py-3 rounded-xl font-semibold transition-all ${
                  currentPage === page
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-xl text-gray-500 dark:text-gray-400">No posts yet. Check back soon!</p>
      </div>
    )}
  </div>
</section>

      {/* Trending Section - Mobile Friendly */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            {/* Trending Posts */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-8 h-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
              </div>
              <div className="space-y-6">
                {trendingPosts.map((post, index) => (
                  <div key={post.id} className={index > 0 ? 'pt-6 border-t border-gray-200 dark:border-gray-800' : ''}>
                    <PostCard post={post} variant="horizontal" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-10">
              {/* Newsletter */}
              <div className="p-6 sm:p-8 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-primary-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Weekly insights. Zero spam. Pure value.
                </p>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-4 focus:ring-primary-500/30 outline-none text-base"
                  />
                  <button className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 active:scale-95 transition text-base">
                    Subscribe Now
                  </button>
                </form>
              </div>
        
              {/* Popular Tags */}
              <div>
                <h3 className="text-xl font-bold mb-5">Popular Tags</h3>
                <div className="flex flex-wrap gap-3">
                  {['React', 'AI', 'Design', 'Firebase', 'TypeScript', 'Next.js', 'Tailwind'].map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};