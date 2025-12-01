import { BlogPost, Category } from './types';

export const MOCK_POSTS: BlogPost[] = [
  {
    id: '1', 
    title: 'The Future of Web Development in 2025',
    excerpt: 'Exploring the latest trends in React, server components, and AI-driven development workflows.',
    content: `
      The landscape of web development is shifting rapidly. As we move further into 2025, several key trends are defining how we build for the web.

      ## The Rise of AI-Assisted Coding
      AI isn't just generating boilerplate anymore; it's architecting entire systems. Developers are becoming conductors of code rather than just writers.

      ## Server Components Everywhere
      With frameworks heavily adopting React Server Components, the line between frontend and backend continues to blur, offering better performance and simpler data fetching stories.

      ## Conclusion
      Stay curious and keep learning. The tools change, but the fundamentals of problem-solving remain the same.
    `,
    coverImage: 'https://picsum.photos/800/400?random=1',
    author: { name: 'Alex Rivera', avatar: 'https://picsum.photos/100/100?random=10' },
    date: 'Oct 24, 2024',
    readTime: '5 min read',
    category: 'Technology',
    tags: ['React', 'AI', 'Future'],
    views: 1250,
    status: 'published',
  },
  {
    id: '2',
    title: 'Mastering Tailwind CSS Grid',
    excerpt: 'A comprehensive guide to building complex layouts using Tailwind CSS grid utilities.',
    content: 'Grid layouts can be intimidating, but Tailwind makes them intuitive...',
    coverImage: 'https://picsum.photos/800/400?random=2',
    author: { name: 'Sarah Chen', avatar: 'https://picsum.photos/100/100?random=11' },
    date: 'Oct 22, 2024',
    readTime: '8 min read',
    category: 'Design',
    tags: ['CSS', 'Tailwind', 'Frontend'],
    views: 980,
    status: 'published',
  },
  {
    id: '3',
    title: 'Sustainable Living in Urban Spaces',
    excerpt: 'Tips and tricks for reducing your carbon footprint while living in a bustling city.',
    content: 'Sustainability starts at home. Even small changes in a city apartment can make a difference...',
    coverImage: 'https://picsum.photos/800/400?random=3',
    author: { name: 'Mike Ross', avatar: 'https://picsum.photos/100/100?random=12' },
    date: 'Oct 20, 2024',
    readTime: '4 min read',
    category: 'Lifestyle',
    tags: ['Eco', 'City', 'Life'],
    views: 2300,
    status: 'published',
  },
  {
    id: '4',
    title: 'Understanding Core Web Vitals',
    excerpt: 'Why performance metrics matter for SEO and user experience, and how to improve them.',
    content: 'Google Core Web Vitals are essential for ranking...',
    coverImage: 'https://picsum.photos/800/400?random=4',
    author: { name: 'Alex Rivera', avatar: 'https://picsum.photos/100/100?random=10' },
    date: 'Oct 18, 2024',
    readTime: '6 min read',
    category: 'Technology',
    tags: ['SEO', 'Performance', 'Web'],
    views: 1500,
    status: 'published',
  }
];

export const CATEGORIES: Category[] = [
  { id: 'tech', name: 'Technology', count: 42, description: 'Latest gadgets, code, and future tech.', icon: 'Cpu' },
  { id: 'design', name: 'Design', count: 18, description: 'UI/UX, graphic design, and aesthetics.', icon: 'Palette' },
  { id: 'lifestyle', name: 'Lifestyle', count: 25, description: 'Travel, food, and daily living.', icon: 'Coffee' },
  { id: 'business', name: 'Business', count: 12, description: 'Startups, finance, and productivity.', icon: 'Briefcase' },
];

export const ANALYTICS_DATA = [
  { name: 'Mon', views: 4000, visitors: 2400 },
  { name: 'Tue', views: 3000, visitors: 1398 },
  { name: 'Wed', views: 2000, visitors: 9800 },
  { name: 'Thu', views: 2780, visitors: 3908 },
  { name: 'Fri', views: 1890, visitors: 4800 },
  { name: 'Sat', views: 2390, visitors: 3800 },
  { name: 'Sun', views: 3490, visitors: 4300 },
];
