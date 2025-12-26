// src/types.ts

export type UserRole = 'admin' | 'moderator' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface BlogPost {
  id: string;                    // Firestore document ID
  slug: string;                  // REQUIRED (Guaranteed unique by db.ts)

  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt?: string;

  author: {
    id: string;                   // Author user ID (REQUIRED)
    name: string;
    avatar: string;
  };

  date: string;                  // e.g. "November 28, 2025"
  readTime: string;              // e.g. "8 min read"
  category: string;
  tags?: string[];

  views: number;                  // REQUIRED (Defaulted to 0 in db.ts)
  status: 'published' | 'pending' | 'draft';
  likes: string[];               // REQUIRED (Defaulted to [] in db.ts)

  createdAt: string;             // ISO string (REQUIRED)
  updatedAt: string;             // ISO string (REQUIRED)
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
  createdAt: string;             // ISO string
}

export interface Review {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;                // 1–5
  content: string;
  createdAt: string;             // ISO string
}

export interface AnalyticsData {
  name: string;
  views: number;
  visitors: number;
}