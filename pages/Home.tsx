import React, { useEffect, useState } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTS_PER_PAGE = 8;

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 animate-pulse"></div>
          <Loader2 className="w-16 h-16 animate-spin text-white absolute inset-0 m-auto" />
        </div>
        <span className="mt-6 text-sm font-medium text-gray-600 dark:text-gray-400">Loading articles...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section - Mobile Optimized */}
      <section id="posts" className="py-10 sm:py-12 md:py-20 bg-transparent px-4 sm:px-6">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
      <div>
        {/* ENHANCEMENT 1: Gradient Title */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
          Latest Articles
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Fresh content every week</p>
      </div>
      <Link
        to="/all-posts"
        // ENHANCEMENT 2: Smoother Link Transition & Semibold
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:gap-3 transition-all duration-200 ease-in-out"
      >
        View all <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Link>
    </div>

    {posts.length > 0 ? (
      <>
        {/* Grid: 2 columns on mobile, 3 on md+, 4 on lg+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {currentPosts.map((post) => (
            <div 
              key={post.id} 
              // ENHANCEMENT 3: Enhanced Hover Effect (Scale + Shadow)
              className="h-full transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary-500/10 active:scale-[0.98] rounded-xl"
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>

        {/* Pagination - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="mt-10 sm:mt-12 flex flex-wrap justify-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-7 sm:min-w-8 px-2 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12 sm:py-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet. Check back soon!</p>
      </div>
    )}
  </div>
</section>

      {/* Trending Section - Mobile Friendly */}
      <section className="py-10 sm:py-12 md:py-20 bg-gradient-to-b from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/50 border-t border-gray-200/50 dark:border-gray-800/50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">
            {/* Trending Posts */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {trendingPosts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className={`transform transition-transform hover:scale-[1.005] ${
                      index > 0 ? 'pt-3 sm:pt-4 border-t border-gray-200/50 dark:border-gray-800/50' : ''
                    }`}
                  >
                    <PostCard post={post} variant="horizontal" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Mobile optimized */}
            <aside className="lg:col-span-4 space-y-4 sm:space-y-6 mt-8 lg:mt-0">
              {/* Newsletter/WhatsApp */}
              <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-white/80 to-primary-50/50 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50">
                <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-900 dark:text-white">Get In Touch</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Have questions or feedback? Chat with me directly!
                </p>
                <a
                  href="https://wa.me/9779805671898?text=Hi%21%20I%20found%20you%20from%20Bigyann%20Blog%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 sm:px-5 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 21.5c-2.5 0-4.8-.9-6.6-2.4l-.4-.3-4.1.9 1-4-.3-.4C3.9 12.8 3 10.5 3 8c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm0-16c-3.9 0-7 3.1-7 7 0 1.5.5 2.9 1.3 4.1l.8 1.2-1.1.7.7-1.1 1.2.8c1.2.8 2.6 1.3 4.1 1.3 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/>
                  </svg>
                  WhatsApp Me
                </a>
              </div>
              
              {/* Popular Tags */}
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-gray-900 dark:text-white">Popular Tags</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {['React', 'AI', 'Design', 'Firebase', 'TypeScript', 'Next.js', 'Tailwind', 'Space'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-gray-700 transition cursor-pointer border border-gray-200 dark:border-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50">
                <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-900 dark:text-white">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">{posts.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Articles</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Updates</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};
