import React, { useEffect, useState } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTS_PER_PAGE = 6;

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();

        // NO ENRICHMENT NEEDED!
        // Your posts already have: category: "Technology" (string)
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
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-primary-600" />
        <span>Loading posts...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section className="relative bg-white dark:bg-gray-900 pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="inline-flex items-center px-4 py-1.5 mb-6 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-full border border-primary-100 dark:border-primary-800">
              Welcome to the future of blogging
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
              Insights for the <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-primary-500 to-indigo-600 bg-clip-text text-transparent">Modern Creator</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
              Explore cutting-edge articles on tech, design, and the future.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <a href="#posts" className="px-8 py-4 rounded-full bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg">
                Start Reading
              </a>
              <Link to="/categories" className="px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Explore Topics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section id="posts" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Latest Posts</h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Fresh content weekly.</p>
            </div>
            <Link to="/categories" className="text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-2">
              All categories <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-16 flex justify-center gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
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
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-xl text-gray-500 dark:text-gray-400">No posts yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-10">
                <TrendingUp className="w-8 h-8 text-primary-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
              </div>
              <div className="space-y-8">
                {trendingPosts.map((post) => (
                  <PostCard key={post.id} post={post} variant="horizontal" />
                ))}
              </div>
            </div>

            <aside className="lg:col-span-4 space-y-10">
              {/* Newsletter */}
              <div className="p-8 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-primary-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold mb-3">Stay in the loop</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Weekly insights. No spam. Just value.
                </p>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-5 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <button className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition">
                    Subscribe
                  </button>
                </form>
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-xl font-bold mb-5">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'AI', 'Design', 'Firebase', 'TypeScript', 'Next.js'].map((tag) => (
                    <span key={tag} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-gray-700 transition cursor-pointer">
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