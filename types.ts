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
  id: string;                    // Firestore document ID (required internally)
  slug?: string;                 // ← NEW: Optional for backward compatibility
                                 //     New posts will have this, old ones fall back to id

  title: string;
  excerpt: string;
  content: string;
  coverImage: string;

  author: {
    id?: string;                 // Author user ID (optional if old post)
    name: string;
    avatar: string;
  };

  date: string;                  // e.g. "November 28, 2025"
  readTime: string;              // e.g. "8 min read"
  category: string;
  tags?: string[];

  views?: number;                // Made optional to match real usage
  status: 'published' | 'pending' | 'draft';
  likes?: string[];              // Array of user IDs who liked

  createdAt?: string;            // ISO string (optional)
  updatedAt?: string;            // ISO string (optional)
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
  createdAt: string;             // ISO string
}

export interface Review {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;                // 1–5
  content: string;
  createdAt: string;             // ISO string
}

export interface AnalyticsData {
  name: string;
  views: number;
  visitors: number;
}

// Helper function – improved version (collapses multiple dashes)
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')      // Remove special characters
    .replace(/[\s_]+/g, '-')       // Replace spaces & underscores with single dash
    .replace(/-+/g, '-')           // Collapse multiple dashes
    .replace(/^-+|-+$/g, '');      // Trim dashes from start/end
};