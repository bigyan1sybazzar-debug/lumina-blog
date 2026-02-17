export type UserRole = 'admin' | 'editor' | 'moderator' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  coverImage?: string;
  status: 'approved' | 'pending' | 'rejected';
  friendIds?: string[];
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  chatId: string;
  participants: string[];
  type?: 'text' | 'image' | 'audio';
  mediaUrl?: string; // URL from Vercel Blob
  mimeType?: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  senderName: string;
  senderAvatar: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface BlogPost {
  id: string;                  // Firestore document ID
  slug: string;                  // REQUIRED (Guaranteed unique by db.ts)

  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt?: string;

  author: {
    id: string;                  // Author user ID (REQUIRED)
    name: string;
    avatar: string;
  };

  date: string;                  // e.g. "November 28, 2025"
  readTime: string;              // e.g. "8 min read"
  category: string;
  tags?: string[];

  views: number;                  // REQUIRED (Defaulted to 0 in db.ts)
  status: 'published' | 'pending' | 'draft' | 'hidden';
  likes: string[];               // REQUIRED (Defaulted to [] in db.ts)

  seo?: SEOData;                 // New SEO fields

  createdAt: string;             // ISO string (REQUIRED)
  updatedAt: string;             // ISO string (REQUIRED)
}

export interface Category {
  id: string;
  name: string;
  count: number;
  description: string;
  icon: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogPostComment {
  id: string;
  postId: string;
  postTitle?: string;            // For admin view
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;             // ISO string
  adminReply?: {
    content: string;
    adminName: string;
    repliedAt: string;
  };
}

export interface BlogPostReview {
  id: string;
  postId: string;
  postTitle?: string;            // For admin view
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;                // 1–5
  content: string;
  createdAt: string;             // ISO string
  adminReply?: {
    content: string;
    adminName: string;
    repliedAt: string;
  };
}

export interface AnalyticsData {
  name: string;
  views: number;
  visitors: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  timestamp?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  image?: string;
}

export interface Poll {
  id: string;
  slug: string;
  question: string;
  description?: string;
  questionImage?: string;
  category: 'election' | 'movies' | 'gadgets' | 'other';
  options: PollOption[];
  totalVotes: number;
  allowMultiple?: boolean;
  expiresAt?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  votedUserIds?: string[]; // To prevent duplicate voting
  status: 'pending' | 'approved' | 'rejected';
  isFeatured?: boolean;
  featuredOrder?: number;
}

export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  offer?: any;
  answer?: any;
  timestamp: string;
}

export interface PhoneListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  brand: string;
  model: string;
  storage: string;
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished';
  price: number;
  currency: string;
  images: string[]; // URLs from Vercel Blob
  location: string;
  contactInfo: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  timestamp: string;
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  model: string; // Specific model or "Any"
  budgetRange: string;
  condition: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface LiveLink {
  id: string;
  heading: string;
  iframeUrl: string;
  createdAt: string;
  updatedAt?: string;
  status: 'active' | 'inactive';
  tags?: string[];
  isDefault?: boolean;
  isTrending?: boolean;
  trendingOrder?: number;
  poll?: {
    teamA: string;
    teamB: string;
    votesA: number;
    votesB: number;
    votedUserIds?: string[];
  };
}

export interface Keyword {
  id: string;
  name: string;
  count: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  focusKeywords?: string[];
}

export interface LiveMatch {
  id: string;
  title: string;
  team1?: string;
  team2?: string;
  matchUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string; // Emoji or icon name
  description: string;
  order: number;
  createdAt: string;
}

export interface PromptSubcategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;

  author: {
    id: string;
    name: string;
    avatar: string;
  };

  tags: string[];
  usageCount: number;
  likes: string[]; // User IDs who liked

  status: 'pending' | 'approved' | 'rejected';
  isFeatured: boolean;

  createdAt: string;
  updatedAt: string;
}
export interface Highlight {
  id: string;
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  category: string;
  createdAt: string;
}

export interface TrafficSession {
  id: string;
  slug: string;
  title: string;
  postId?: string;
  userId?: string;
  device?: string;
  startTime: string; // ISO string
  lastHeartbeat: string; // ISO string
  duration: number; // in seconds
  isActive: boolean;
  date: string; // YYYY-MM-DD for easy filtering
}

export interface TrafficStats {
  totalViews: number;
  totalDuration: number;
  averageTime: number;
  topPages: {
    slug: string;
    title: string;
    views: number;
    duration: number;
  }[];
  realTimeActive: number;
  activePages: {
    slug: string;
    title: string;
    count: number;
  }[];
}

export interface Subscriber {
  id: string;
  email: string;
  subscribedAt: string; // ISO string
  status: 'active' | 'unsubscribed';
}

export interface IPTVChannel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  status: 'active' | 'inactive';
  isTrending?: boolean;
  isDefault?: boolean;
  trendingOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPTVCategory {
  id: string;
  name: string;
  slug: string;
}