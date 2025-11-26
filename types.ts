export type UserRole = 'admin' | 'moderator' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    id?: string; // Added ID to track authorship
  };
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  views: number;
  status: 'published' | 'pending' | 'draft';
  likes?: string[]; // Array of user IDs who liked
}

export interface Category {
  id: string;
  name: string;
  count: number;
  description: string;
  icon: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string; // ISO String
}

export interface AnalyticsData {
  name: string;
  views: number;
  visitors: number;
}