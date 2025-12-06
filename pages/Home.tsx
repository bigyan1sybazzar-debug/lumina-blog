import React, { useEffect, useState, useMemo } from 'react';
import { getPosts } from '../services/db';
import { BlogPost } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowRight, TrendingUp, Loader2, Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';

const POSTS_PER_CATEGORY = 4;

// Custom Arrows
interface CustomArrowProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  direction: 'prev' | 'next';
  className?: string;
}

const CustomArrow: React.FC<CustomArrowProps> = ({ onClick, direction, className }) => {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 z-10 p-2 h-10 w-10 flex items-center justify-center 
                  rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl border border-gray-200 dark:border-gray-700 
                  hover:bg-primary-500/10 transition-all ${direction === 'prev' ? '-left-4' : '-right-4'} ${className}`}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
    >
      <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    </button>
  );
};

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 4000,
  pauseOnHover: true,
  prevArrow: <CustomArrow direction="prev" />,
  nextArrow: <CustomArrow direction="next" />,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 640, settings: { slidesToShow: 1, arrows: false, dots: true } },
  ],
};

export const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  const postsByCategory = useMemo(() => {
    const map = new Map<string, BlogPost[]>();
    posts.forEach(post => {
      const cat = post.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(post);
    });

    return Array.from(map.entries())
      .map(([category, list]) => ({
        category,
        posts: list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [posts]);

  const sliderPosts = useMemo(() => posts.slice(0, 8), [posts]);

  const truncateTitle = (title: string) => {
    const words = title.split(/\s+/);
    return words.length <= 5 ? title : words.slice(0, 5).join(' ') + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 to-gray-900">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 animate-pulse" />
          <Loader2 className="w-16 h-16 animate-spin text-white absolute inset-0 m-auto" />
        </div>
        <span className="mt-6 block text-sm font-medium text-gray-600 dark:text-gray-400">
          Loading articles...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 to-gray-900">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pt-16 pb-20 md:pt-32 md:pb-40 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary-100/20 dark:to-primary-900/10" />
        <div className="absolute top-10 left-4 w-48 h-48 bg-primary-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-4 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Welcome to Bigyann
            </span>
          </div>

          <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 dark:text-white">
            Your daily tech &{' '}
            <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              science feed
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 max-w-xl mx-auto text-sm text-gray-600 dark:text-gray-400 px-2">
            Explore cutting-edge discoveries, gadgets, AI updates, space science, and everything in between.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="#categories"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Explore Categories
            </a>
            <Link
              to="/categories"
              className="px-8 py-3.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white font-semibold border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition"
            >
              All Topics
            </Link>
          </div>
        </div>
      </section>

      {/* Hot & Fresh Slider */}
      {sliderPosts.length > 0 && (
        <section className="py-12 md:py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white">Hot & Fresh</h2>
            </div>

            <Slider {...sliderSettings}>
              {sliderPosts.map(post => (
                <div key={post.id} className="px-2">
                  <div className="h-full rounded-xl overflow-hidden transition hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10">
                    <PostCard
                      post={{ ...post, title: truncateTitle(post.title) }}
                      variant="vertical"
                      increasedTitle={true}
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      )}

      {/* Browse by Category – Tight Spacing & Left Aligned */}
      <section id="categories" className="py-12 md:py-16 px-4 sm:px-6 bg-gray-50/50 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto">

          {/* Left-aligned Header */}
          <div className="max-w-2xl mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Browse by Category
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Discover the topics that interest you the most
            </p>
          </div>

          {/* Compact spacing between categories */}
          <div className="space-y-10">
            {postsByCategory.map(({ category, posts: catPosts }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {category}
                  </h3>
                  <Link
                    to="/categories"
                    className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:gap-2 transition-all"
                  >
                    View all <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* 2 posts per row on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {catPosts.slice(0, POSTS_PER_CATEGORY).map(post => (
                    <div
                      key={post.id}
                      className="transform transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10 rounded-xl"
                    >
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {postsByCategory.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              No categories available yet.
            </p>
          )}
        </div>
      </section>

      {/* Must Read + Sidebar */}
      <section className="py-16 md:py-20 px-4 sm:px-6 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Must Read */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white">
                  Must Read
                </h2>
              </div>
              <div className="space-y-4">
                {posts.slice(0, 4).map((post, i) => (
                  <div
                    key={post.id}
                    className={`p-2 -m-2 rounded-xl transition hover:bg-white/60 dark:hover:bg-gray-800/40 ${
                      i > 0 ? 'border-t border-gray-200/50 dark:border-gray-700/50 pt-6' : ''
                    }`}
                  >
                    <PostCard post={post} variant="horizontal" />
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              {/* WhatsApp */}
              <div className="p-6 bg-gradient-to-br from-white/80 to-primary-50/30 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50">
                <h3 className="text-lg font-bold mb-3">Get In Touch</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Have questions or feedback? Chat with me directly!
                </p>
                <a
                  href="https://wa.me/9779805671898?text=Hi!%20I%20found%20you%20from%20Bigyann%20Blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-xl transition active:scale-95"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 21.5c-2.5 0-4.8-.9-6.6-2.4l-.4-.3-4.1.9 1-4-.3-.4C3.9 12.8 3 10.5 3 8c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm0-16c-3.9 0-7 3.1-7 7 0 1.5.5 2.9 1.3 4.1l.8 1.2-1.1.7.7-1.1 1.2.8c1.2.8 2.6 1.3 4.1 1.3 3.9 0 7-3.1 7-7s-3.1-7-7-7z"/>
                  </svg>
                  WhatsApp Me
                </a>
              </div>

              {/* Popular Tags */}
              <div>
                <h3 className="text-lg font-bold mb-3">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'AI', 'Design', 'Firebase', 'TypeScript', 'Next.js', 'Tailwind', 'Space'].map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-xs font-medium bg-white/80 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary-100 dark:hover:bg-gray-700 cursor-pointer transition"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-700/50">
                <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{posts.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Articles</div>
                  </div>
                  <div className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">24/7</div>
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

export default Home;