import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, Loader2, Sparkles, Send, Zap, ChevronLeft, ChevronRight, Hash, Calendar, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Component Start ---
export const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Placeholder fetchPosts function
  const fetchPosts = async (): Promise<BlogPost[]> => {
    for (let i = 0; i < 4; i++) {
      try {
        const result = await getPosts();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        if (i === 3) {
          console.error('Failed to fetch posts after 4 attempts');
          return [];
        }
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
    return [];
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchPosts();
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosts(sorted);
      setLoading(false);
    };
    load();
  }, []);

  // Memoized list of unique categories for the filter bar
  const categories = useMemo(() => {
    const cats = new Set<string>(posts.map(p => p.category).filter(Boolean) as string[]);
    return ['All', ...Array.from(cats).sort()];
  }, [posts]);

  // Filtered posts based on selected category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'All') {
      return posts;
    }
    return posts.filter(p => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  // Featured posts - Take first 6-8 posts for slider
  const featuredPosts = useMemo(() => posts.slice(0, 8), [posts]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    
    const scrollAmount = sliderRef.current.clientWidth * 0.8; // Scroll 80% of container width
    if (direction === 'left') {
      sliderRef.current.scrollLeft -= scrollAmount;
    } else {
      sliderRef.current.scrollLeft += scrollAmount;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading articles...</p>
        </div>
      </div>
    );
  }

  // Define the WhatsApp URL
  const whatsappUrl = "https://wa.me/9779805671898?text=Hello%20Bigyann!%20I'm%20reaching%20out%20from%20your%20homepage%20on%20the%20blog.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section - Modern Design */}
      <section className="relative overflow-hidden px-4 pt-20 pb-12 md:pt-24 md:pb-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-transparent dark:from-primary-900/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Welcome to the Bigyann
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI{' '}
                <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  Powered
                </span>{' '}
                Reviews & Discussions
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                Dive into AI powered articles on latest tech, design, and technology. Stay updated with the latest trends and best practices.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={() => {
                    document.getElementById('featured-posts')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Explore Articles
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  Contact Me
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {featuredPosts.slice(0, 3).map((post, index) => (
                  <div 
                    key={post.id} 
                    className={`relative rounded-2xl overflow-hidden group ${index === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10"></div>
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                      <span className="inline-block px-3 py-1 mb-2 rounded-full bg-white/20 backdrop-blur text-xs font-medium text-white">
                        {post.category}
                      </span>
                      <h3 className="text-white font-bold text-sm md:text-base line-clamp-2">
                        <Link to={`/categories/${post.slug ?? post.id}`} className="hover:text-primary-200 transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Section */}
      <section className="sticky top-16 md:top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Browse by Topic</h2>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
              aria-label="Toggle filter menu"
            >
              <Hash className="w-5 h-5" />
            </button>
          </div>
          
          {/* Desktop Filter Bar */}
          <div className="hidden md:flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'All' ? <Sparkles className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile Filter Drawer */}
          {isFilterOpen && (
            <div className="md:hidden mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsFilterOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Posts Slider */}
      {featuredPosts.length > 0 && (
        <section id="featured-posts" className="py-12 md:py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Featured Posts
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Editor's Picks
                </h2>
              </div>
              <Link 
                to="/categories" 
                className="hidden md:flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Slider Container */}
            <div className="relative">
              {/* Navigation Arrows */}
              <button
                onClick={() => scrollSlider('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all hover:shadow-lg"
                aria-label="Previous posts"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              
              <button
                onClick={() => scrollSlider('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-12 h-12 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition-all hover:shadow-lg"
                aria-label="Next posts"
              >
                <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Scrollable Slider */}
              <div 
                ref={sliderRef}
                className="flex overflow-x-auto scrollbar-hide gap-4 md:gap-6 pb-4 scroll-smooth"
              >
                {featuredPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="flex-shrink-0 w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)]"
                  >
                    <div className="h-full">
                      <PostCard 
                        post={post}
                        variant="vertical"
                        textSizeClass="text-lg"
                        alignLeft={true}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Swipe Hint */}
              <div className="md:hidden text-center mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ← Swipe to see more posts →
                </p>
              </div>

              {/* Post Counter */}
              <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                Showing {Math.min(featuredPosts.length, 8)} featured posts
              </div>
            </div>

            {/* Mobile View All */}
            <div className="mt-8 md:hidden text-center">
              <Link 
                to="/blog" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                View All Articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts Grid */}
      <section className="py-12 md:py-16 px-4 bg-gray-50/50 dark:bg-gray-900/50">
  <div className="max-w-7xl mx-auto">
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium">
        <BookOpen className="w-4 h-4" />
        Latest Articles
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
        {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          ({filteredPosts.length} posts)
        </span>
      </h2>
    </div>

    {filteredPosts.length > 0 ? (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPosts.slice(0, 16).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              categoryName={post.category}
              variant="vertical"
              textSizeClass="text-base"
              increasedTitle={false}
              alignLeft={true}
            />
          ))}
        </div>

        {/* Show the rest of posts in hidden state initially */}
        {filteredPosts.length > 16 && (
          <div id="more-posts" className="hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
              {filteredPosts.slice(16).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  categoryName={post.category}
                  variant="vertical"
                  textSizeClass="text-base"
                  increasedTitle={false}
                  alignLeft={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Load More Button - Show if there are more than 16 posts */}
        {filteredPosts.length > 16 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => {
                const morePostsSection = document.getElementById('more-posts');
                const loadMoreBtn = document.getElementById('load-more-btn');
                if (morePostsSection) {
                  morePostsSection.classList.remove('hidden');
                  morePostsSection.classList.add('block');
                }
                if (loadMoreBtn) {
                  loadMoreBtn.classList.add('hidden');
                }
              }}
              id="load-more-btn"
              className="px-8 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Load More Articles ({filteredPosts.length - 16} more)
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No articles found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            There are no articles in the <span className="font-semibold">{selectedCategory}</span> category yet.
          </p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
          >
            View All Articles
          </button>
        </div>
      </div>
    )}
  </div>
</section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 p-8 md:p-12">
            <div className="relative z-10">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-white/20 backdrop-blur text-sm font-medium text-white">
                  <Send className="w-4 h-4" />
                  Let's Connect
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Have a project in mind?
                </h3>
                <p className="text-gray-300 mb-8 text-lg">
                  I'm always open to discussing new opportunities, feedback on articles, or collaboration ideas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg shadow-green-500/30"
                  >
                    <Send className="w-5 h-5" />
                    Message on WhatsApp
                  </a>
                  <Link
                    to="/categories"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5" />
                    Browse Articles
                  </Link>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;