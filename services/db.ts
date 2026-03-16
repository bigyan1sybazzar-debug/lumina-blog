// services/db.ts
import { notifyIndexNow, notifyBingWebmaster } from './indexingService'; // Ensure this is imported
import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, BlogPostComment, BlogPostReview, Poll, PollOption, LiveLink, Prompt, PromptCategory, PromptSubcategory, Highlight, TrafficSession, TrafficStats, IPTVChannel, IPTVCategory } from '../types';
import { MOCK_POSTS, CATEGORIES } from '../constants';
import { slugify } from '../lib/slugify'; // <-- NEW IMPORT

const R2_PUBLIC_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN || 'https://pub-b2a714905946497d980c717ac1abfd8f.r2.dev';
const isServer = typeof window === 'undefined';

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';
const REVIEWS_COLLECTION = 'reviews';
const POLLS_COLLECTION = 'polls';
const LIVE_LINKS_COLLECTION = 'live_links';
const LIVE_COMMENTS_COLLECTION = 'live_comments';
const KEYWORDS_COLLECTION = 'keywords';
const LIVE_MATCHES_COLLECTION = 'live_matches';
const PAGES_COLLECTION = 'pages';
const HIGHLIGHTS_COLLECTION = 'highlights';
const TRAFFIC_COLLECTION = 'traffic';
const SUBSCRIBERS_COLLECTION = 'subscribers';
const IPTV_CHANNELS_COLLECTION = 'iptv_channels';
const IPTV_CATEGORIES_COLLECTION = 'iptv_categories';



// Helper: client-side sort (avoids Firestore composite index requirement)
const sortByDateDesc = (a: any, b: any) => {
  const dateA = new Date(a.updatedAt || a.createdAt || a.date).getTime();
  const dateB = new Date(b.updatedAt || b.createdAt || b.date).getTime();
  return dateB - dateA;
};

// --- POSTS (R2 DIRECT) ---

// Helper: Check if a slug already exists in R2 data
const checkSlugExists = async (slug: string): Promise<boolean> => {
  try {
    const posts = await getAllPostsAdmin();
    // Helper to safely check slug existence
    return posts.some(p => p.slug === slug);
  } catch (e) {
    return false;
  }
};

// Helper: Check if a poll slug already exists
export const checkPollSlugExists = async (slug: string): Promise<boolean> => {
  try {
    const polls = await getAllPollsAdmin();
    return polls.some(p => p.slug === slug);
  } catch (e) {
    return false;
  }
};

export const getPosts = async (limitCount?: number, stripContent: boolean = false): Promise<BlogPost[]> => {
  try {
    const posts = await getAllPostsAdmin(); // Fetch from R2 JSON
    const published = posts.filter(p => p.status === 'published');
    // Client-side sort
    const sorted = published.sort(sortByDateDesc);
    const result = limitCount ? sorted.slice(0, limitCount) : sorted;

    if (stripContent) {
      return result.map(p => ({ ...p, content: '' }));
    }
    return result;
  } catch (error) {
    console.error('Error fetching R2 posts:', error);
    return [];
  }
};

export const getLatestPosts = async (count: number = 10, stripContent: boolean = false): Promise<BlogPost[]> => {
  return getPosts(count, stripContent);
};

export const getPendingPosts = async (): Promise<BlogPost[]> => {
  try {
    const posts = await getAllPostsAdmin();
    return posts.filter(p => p.status === 'pending').sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return [];
  }
};

export const getUserPosts = async (userId: string): Promise<BlogPost[]> => {
  try {
    const posts = await getAllPostsAdmin();
    return posts.filter(p => p.author.id === userId).sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

// Fetch ALL posts directly from R2 via our new API (or direct fetch if public)
export const getAllPostsFromFirestore = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
      .sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching posts from Firestore:', error);
    return [];
  }
};

export const getAllPostsAdmin = async (): Promise<BlogPost[]> => {
  try {
    // Use a timestamp to bust browser cache when fetched from client
    const cacheBuster = `?t=${Date.now()}`;
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/posts.json${cacheBuster}` : `/api/r2-proxy?file=posts.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch from R2');
    const posts = await res.json();
    return Array.isArray(posts) ? posts.sort(sortByDateDesc) : [];
  } catch (error) {
    console.warn('Warning: Failed to fetch posts from R2 (offline or unreachable). Falling back to Firestore.', error);
    return getAllPostsFromFirestore();
  }
};

// --- PAGES ---

export const getPages = async (): Promise<BlogPost[]> => {
  // Re-implement if needed, for now return empty or use posts logic if pages are posts
  return [];
};

// Legacy: kept for internal use in admin/preview links
export const getPostById = async (id: string): Promise<BlogPost | null> => {
  const posts = await getAllPostsAdmin();
  return posts.find(p => p.id === id) || null;
};

// Public-facing: supports both /blog/my-slug and /blog/old-id
export const getPostBySlug = async (slugOrId: string): Promise<BlogPost | null> => {
  const posts = await getAllPostsAdmin();
  // Try slug first, then ID
  return posts.find(p => p.slug === slugOrId || p.id === slugOrId) || null;
};

/**
 * Creates a new post directly to R2 via API.
 */
export const createPost = async (
  post: Omit<BlogPost, 'id' | 'likes' | 'views' | 'createdAt' | 'updatedAt' | 'slug'> & {
    slug?: string;
    status: 'published' | 'pending' | 'draft';
  }
) => {
  try {
    // Generate slug
    const baseSlug = post.slug ? post.slug : slugify(post.title);
    let slug = baseSlug;
    let counter = 1;

    while (await checkSlugExists(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const newPostData = {
      ...post,
      slug,
      likes: [],
      views: 0
    };

    // Call API to save to R2
    const res = await fetch('/api/posts/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', post: newPostData })
    });

    if (!res.ok) throw new Error('Failed to create post on R2');

    // Trigger Sitemap Update
    if (post.status === 'published') {
      await generateAndUploadSitemap();
    }

    return (await res.json()).post.id;
  } catch (error) {
    console.error('Error creating post (R2):', error);
    throw error;
  }
};

/**
 * Updates an existing post directly in R2 via API.
 */
export const updatePost = async (
  postId: string,
  postData: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // Handle slug update if title changed
    let slug = postData.slug;
    if (!slug && postData.title) {
      slug = slugify(postData.title);
      // Simple check for uniqueness if it changed (optimization omitted for brevity, assumes admin handles conflicts or API auto-resolves)
    }

    const updatePayload = {
      ...postData,
      ...(slug ? { slug } : {})
    };

    const res = await fetch('/api/posts/manage', {
      method: 'POST', // Using POST as general handler, could be PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: postId, post: updatePayload })
    });

    if (!res.ok) throw new Error('Failed to update post on R2');

    if (postData.status === 'published') {
      await generateAndUploadSitemap();
    }

    console.log(`Post ${postId} updated successfully on R2`);
  } catch (error) {
    console.error('Error updating post (R2):', error);
    throw error;
  }
};

/**
 * Deletes a post from R2 via API.
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const res = await fetch('/api/posts/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: postId })
    });

    if (!res.ok) throw new Error('Failed to delete post from R2');

    await generateAndUploadSitemap();
    console.log(`Post ${postId} deleted successfully from R2`);
  } catch (error) {
    console.error('Error deleting post (R2):', error);
    throw error;
  }
};
const getFullUrl = (slug: string) => `https://bigyann.com.np/${slug}`;
const getVotingUrl = (slug: string) => `https://bigyann.com.np/voting/${slug}`;
/**
 * Updates post status and notifies IndexNow if changed to published.
 */
export const updatePostStatus = async (postId: string, status: 'published' | 'pending' | 'draft' | 'hidden') => {
  try {
    const res = await fetch('/api/posts/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: postId, post: { status } })
    });

    if (!res.ok) throw new Error('Failed to update post status on R2');

    if (status === 'published') {
      await generateAndUploadSitemap();
      const post = await getPostBySlug(postId);
      if (post?.slug) {
        await notifyIndexNow([getFullUrl(post.slug)]); // Real-time indexing
        await notifyBingWebmaster([getFullUrl(post.slug)]); // Bing Webmaster notification
      }
    }
  } catch (error) {
    console.error('Error updating post status (R2):', error);
    throw error;
  }
};

export const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
  const ref = db.collection(POSTS_COLLECTION).doc(postId);
  const doc = await ref.get();

  if (!doc.exists) return false;

  const likes: string[] = doc.data()?.likes || [];

  if (likes.includes(userId)) {
    await ref.update({
      likes: firebase.firestore.FieldValue.arrayRemove(userId)
    });
    return false;
  } else {
    await ref.update({
      likes: firebase.firestore.FieldValue.arrayUnion(userId)
    });
    return true;
  }
};

export const incrementViewCount = async (id: string) => {
  try {
    await db.collection(POSTS_COLLECTION).doc(id).update({
      views: firebase.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

// --- CATEGORIES ---

export const getCategories = async (): Promise<Category[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/categories.json?t=${Date.now()}` : `/api/r2-proxy?file=categories.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch categories from R2');
    const categories = await res.json();
    return Array.isArray(categories) && categories.length > 0 ? categories : CATEGORIES;
  } catch (error) {
    console.error('Error fetching categories from R2:', error);
    return CATEGORIES;
  }
};

export const createCategory = async (category: Omit<Category, 'id' | 'count'>) => {
  try {
    const res = await fetch('/api/categories/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', category })
    });
    if (!res.ok) throw new Error('Failed to create category on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error creating category (R2):', error);
    throw error;
  }
};

// Delete a category (with validation)
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const res = await fetch('/api/categories/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: categoryId })
    });
    if (!res.ok) throw new Error('Failed to delete category from R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error deleting category (R2):', error);
    throw error;
  }
};

// --- USERS ---

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: 'user' | 'moderator' | 'admin') => {
  await db.collection(USERS_COLLECTION).doc(userId).update({ role });
};

export const updateUserStatus = async (userId: string, status: 'approved' | 'pending' | 'rejected') => {
  await db.collection(USERS_COLLECTION).doc(userId).update({ status });
};

// --- COMMENTS ---

export const getCommentsByPostId = async (postId: string): Promise<BlogPostComment[]> => {
  try {
    const snapshot = await db.collection(COMMENTS_COLLECTION)
      .where('postId', '==', postId)
      .get();

    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostComment));

    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const getCommentsByUserId = async (userId: string): Promise<BlogPostComment[]> => {
  try {
    const snapshot = await db.collection(COMMENTS_COLLECTION)
      .where('userId', '==', userId)
      .get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostComment));
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return [];
  }
};

export const addComment = async (comment: Omit<BlogPostComment, 'id' | 'createdAt'>) => {
  await db.collection(COMMENTS_COLLECTION).add({
    ...comment,
    createdAt: new Date().toISOString(),
  });
};

// --- REVIEWS (Star Ratings) ---

export const getReviewsByPostId = async (postId: string): Promise<BlogPostReview[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION)
      .where('postId', '==', postId)
      .get();

    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostReview));

    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const getReviewsByUserId = async (userId: string): Promise<BlogPostReview[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION)
      .where('userId', '==', userId)
      .get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostReview));
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

export const addReview = async (review: Omit<BlogPostReview, 'id' | 'createdAt'>) => {
  try {
    await db.collection(REVIEWS_COLLECTION).add({
      ...review,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding review:', error);
    throw error;
  }
};

// --- ADMIN: COMMENTS & REVIEWS MANAGEMENT ---

export const getAllComments = async (): Promise<BlogPostComment[]> => {
  try {
    const snapshot = await db.collection(COMMENTS_COLLECTION).get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostComment));

    // Fetch post titles for each comment
    const commentsWithTitles = await Promise.all(
      comments.map(async (comment) => {
        const post = await getPostById(comment.postId);
        return {
          ...comment,
          postTitle: post?.title || 'Unknown Post'
        };
      })
    );

    return commentsWithTitles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all comments:', error);
    return [];
  }
};

export const getAllReviews = async (): Promise<BlogPostReview[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION).get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPostReview));

    // Fetch post titles for each review
    const reviewsWithTitles = await Promise.all(
      reviews.map(async (review) => {
        const post = await getPostById(review.postId);
        return {
          ...review,
          postTitle: post?.title || 'Unknown Post'
        };
      })
    );

    return reviewsWithTitles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    await db.collection(COMMENTS_COLLECTION).doc(commentId).delete();
    console.log(`Comment ${commentId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    await db.collection(REVIEWS_COLLECTION).doc(reviewId).delete();
    console.log(`Review ${reviewId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export const replyToComment = async (
  commentId: string,
  adminName: string,
  replyContent: string
): Promise<void> => {
  try {
    await db.collection(COMMENTS_COLLECTION).doc(commentId).update({
      adminReply: {
        content: replyContent,
        adminName: adminName,
        repliedAt: new Date().toISOString(),
      }
    });
    console.log(`Reply added to comment ${commentId}`);
  } catch (error) {
    console.error('Error replying to comment:', error);
    throw error;
  }
};

export const replyToReview = async (
  reviewId: string,
  adminName: string,
  replyContent: string
): Promise<void> => {
  try {
    await db.collection(REVIEWS_COLLECTION).doc(reviewId).update({
      adminReply: {
        content: replyContent,
        adminName: adminName,
        repliedAt: new Date().toISOString(),
      }
    });
    console.log(`Reply added to review ${reviewId}`);
  } catch (error) {
    console.error('Error replying to review:', error);
    throw error;
  }
};


// --- SITEMAP ---

// --- SYNC WITH R2 (SITEMAP + JSON DATA) ---

export const generateAndUploadSitemap = async (): Promise<string | null> => {
  const SYNC_SECRET = 'bigyann-2025-super-secret-987654321'; // Must match .env

  try {
    // We now call the full sync endpoint which handles sitemap AND data JSONs
    const response = await fetch('/api/sync-r2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SYNC_SECRET}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('R2 Sync API error:', response.status, err);
      return null;
    }

    const data = await response.json();
    console.log(`R2 Sync Complete! Stats: Posts=${data.stats?.posts}, Polls=${data.stats?.polls}`);
    return data.publicUrl || 'https://bigyann.com.np/sitemap.xml';

  } catch (err) {
    console.error('Network error during R2 sync:', err);
    return null;
  }
};

// --- SEED ---

export const seedDatabase = async () => {
  const snapshot = await db.collection(POSTS_COLLECTION).get();
  if (!snapshot.empty) {
    console.log('DB already seeded.');
    return;
  }

  const promises = MOCK_POSTS.map(post => {
    // Use slugify for consistent seeding
    const slug = slugify(post.title);
    return db.collection(POSTS_COLLECTION).add({
      ...post,
      slug,
      status: 'published',
      likes: [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  if ((await db.collection(CATEGORIES_COLLECTION).get()).empty) {
    CATEGORIES.forEach(cat => db.collection(CATEGORIES_COLLECTION).add(cat));
  }

  await Promise.all(promises);
  await generateAndUploadSitemap();
  console.log('Database seeded + sitemap generated');
};

// --- TRAFFIC TRACKING ---

export const recordPageView = async (data: {
  slug: string;
  title: string;
  postId?: string;
  userId?: string;
  device?: string;
  isWatching?: boolean;
}): Promise<string> => {
  try {
    const now = new Date();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const session: any = {
      slug: data.slug,
      title: data.title,
      postId: data.postId || null, // Use null instead of undefined for Firestore
      userId: data.userId || null,
      device: data.device || 'desktop',
      startTime: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      duration: 0,
      isActive: true,
      isWatching: data.isWatching || false,
      date: now.toISOString().split('T')[0]
    };

    // Remove undefined fields just in case
    Object.keys(session).forEach(key => session[key] === undefined && delete session[key]);

    await db.collection(TRAFFIC_COLLECTION).doc(sessionId).set(session);

    // Also increment global post views if it's a post
    if (data.postId) {
      await incrementViewCount(data.postId);
    }

    return sessionId;
  } catch (error) {
    console.error('Error recording page view:', error);
    return '';
  }
};

export const updatePageHeartbeat = async (sessionId: string, duration: number, isActive: boolean = true, isWatching?: boolean) => {
  try {
    const updateData: any = {
      lastHeartbeat: new Date().toISOString(),
      duration: duration,
      isActive: isActive
    };
    if (isWatching !== undefined) updateData.isWatching = isWatching;

    await db.collection(TRAFFIC_COLLECTION).doc(sessionId).update(updateData);
  } catch (error) {
    console.error('Error updating heartbeat:', error);
  }
};

export const getRealtimeTraffic = async (): Promise<{ activeUsers: number; activePages: any[] }> => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const snapshot = await db.collection(TRAFFIC_COLLECTION)
      .where('lastHeartbeat', '>', oneMinuteAgo)
      .get();

    const sessions = snapshot.docs
      .map(doc => doc.data() as TrafficSession)
      .filter(s => s.isActive);
    const pageCounts: Record<string, { title: string, count: number, watchingCount: number }> = {};

    sessions.forEach(s => {
      if (!pageCounts[s.slug]) {
        pageCounts[s.slug] = { title: s.title, count: 0, watchingCount: 0 };
      }
      pageCounts[s.slug].count += 1;
      if (s.isWatching) {
        pageCounts[s.slug].watchingCount += 1;
      }
    });

    return {
      activeUsers: sessions.length,
      activePages: Object.entries(pageCounts).map(([slug, data]) => ({
        slug,
        title: data.title,
        count: data.count,
        watchingCount: data.watchingCount
      })).sort((a, b) => b.count - a.count)
    };
  } catch (error) {
    console.error('Error fetching realtime traffic:', error);
    return { activeUsers: 0, activePages: [] };
  }
};

export const getTrafficStats = async (period: 'daily' | 'weekly' | 'monthly'): Promise<TrafficStats> => {
  try {
    const now = new Date();
    let startDate = new Date();

    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const snapshot = await db.collection(TRAFFIC_COLLECTION)
      .where('startTime', '>=', startDate.toISOString())
      .get();

    const sessions = snapshot.docs.map(doc => doc.data() as TrafficSession);

    const stats: TrafficStats = {
      totalViews: sessions.length,
      totalDuration: sessions.reduce((acc, s) => acc + s.duration, 0),
      averageTime: 0,
      topPages: [],
      realTimeActive: 0,
      activePages: []
    };

    stats.averageTime = stats.totalViews > 0 ? stats.totalDuration / stats.totalViews : 0;

    const pageAgg: Record<string, { title: string, views: number, duration: number }> = {};
    sessions.forEach(s => {
      if (!pageAgg[s.slug]) {
        pageAgg[s.slug] = { title: s.title, views: 0, duration: 0 };
      }
      pageAgg[s.slug].views += 1;
      pageAgg[s.slug].duration += s.duration;
    });

    stats.topPages = Object.entries(pageAgg).map(([slug, data]) => ({
      slug,
      title: data.title,
      views: data.views,
      duration: data.duration
    })).sort((a, b) => b.views - a.views).slice(0, 10);

    // Realtime part (last 5 mins for dashboard summary)
    const realtime = await getRealtimeTraffic();
    stats.realTimeActive = realtime.activeUsers;
    stats.activePages = realtime.activePages;

    return stats;
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return {
      totalViews: 0,
      totalDuration: 0,
      averageTime: 0,
      topPages: [],
      realTimeActive: 0,
      activePages: []
    };
  }
};


// --- POLLS ---

export const getPolls = async (category?: string, status: Poll['status'] = 'approved', isFeatured?: boolean): Promise<Poll[]> => {
  try {
    const polls = await getAllPollsAdmin();
    let filtered = polls;

    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (isFeatured !== undefined) {
      filtered = filtered.filter(p => p.isFeatured === isFeatured);
    }

    return filtered.sort((a, b) => {
      if (isFeatured) {
        const orderA = a.featuredOrder ?? 999;
        const orderB = b.featuredOrder ?? 999;
        if (orderA !== orderB) return orderA - orderB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error fetching polls (R2):', error);
    return [];
  }
};

export const getAllPollsAdmin = async (): Promise<Poll[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/polls.json?t=${Date.now()}` : `/api/r2-proxy?file=polls.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch polls from R2');
    const polls = await res.json();
    return Array.isArray(polls) ? polls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  } catch (error) {
    console.error('Error fetching all polls (R2):', error);
    return [];
  }
};

export const getPollById = async (id: string): Promise<Poll | null> => {
  try {
    const polls = await getAllPollsAdmin();
    return polls.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error fetching poll by ID (R2):', error);
    return null;
  }
};

export const getPollBySlug = async (slugOrId: string): Promise<Poll | null> => {
  try {
    const polls = await getAllPollsAdmin();
    return polls.find(p => p.slug === slugOrId || p.id === slugOrId) || null;
  } catch (error) {
    console.error('Error fetching poll by slug/ID (R2):', error);
    return null;
  }
};

export const voteInPoll = async (pollId: string, optionId: string, userId: string): Promise<boolean> => {
  try {
    const pollRef = db.collection(POLLS_COLLECTION).doc(pollId);
    const doc = await pollRef.get();

    if (!doc.exists) return false;

    const poll = doc.data() as Poll;
    const votedUserIds = poll.votedUserIds || [];

    if (votedUserIds.includes(userId)) {
      console.warn('User already voted in this poll');
      return false;
    }

    const updatedOptions = poll.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    await pollRef.update({
      options: updatedOptions,
      votedUserIds: firebase.firestore.FieldValue.arrayUnion(userId),
      totalVotes: firebase.firestore.FieldValue.increment(1)
    });

    // ALSO SYNC TO R2 in REAL-TIME (so results show up globally)
    try {
      await fetch('/api/polls/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', id: pollId, optionId })
      });
    } catch (e) {
      console.warn('Silent failure: Could not sync vote to R2, standard sync will catch it later.', e);
    }

    return true;
  } catch (error) {
    console.error('Error voting in poll:', error);
    return false;
  }
};

// --- LIVE LINKS (Admin managed) ---

export const getLiveLinks = async (): Promise<LiveLink[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/live-data.json?t=${Date.now()}` : `/api/r2-proxy?file=live-data.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch live links from R2');
    const links = await res.json();
    return Array.isArray(links) ? links.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];
  } catch (error) {
    console.error('Error fetching live links (R2):', error);
    return [];
  }
};

export const addLiveLink = async (link: Omit<LiveLink, 'id'>) => {
  try {
    const res = await fetch('/api/live-links/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', link })
    });
    if (!res.ok) throw new Error('Failed to add live link to R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error adding live link (R2):', error);
    throw error;
  }
};

export const updateLiveLink = async (id: string, data: Partial<Omit<LiveLink, 'id' | 'createdAt'>>) => {
  try {
    const res = await fetch('/api/live-links/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, link: data })
    });
    if (!res.ok) throw new Error('Failed to update live link on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error updating live link (R2):', error);
    throw error;
  }
};

export const voteLiveLinkPoll = async (linkId: string, team: 'A' | 'B', userId: string) => {
  try {
    const res = await fetch('/api/live-links/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', id: linkId, team, userId })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to vote');
    }
    return await res.json();
  } catch (error) {
    console.error('Error voting in live poll:', error);
    throw error;
  }
};

export const deleteLiveLink = async (id: string) => {
  try {
    const res = await fetch('/api/live-links/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    if (!res.ok) throw new Error('Failed to delete live link from R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error deleting live link (R2):', error);
    throw error;
  }
};

export const setLiveLinkDefault = async (id: string, isDefault: boolean) => {
  try {
    const res = await fetch('/api/live-links/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setDefault', id, isDefault })
    });
    if (!res.ok) throw new Error('Failed to set default live link on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error setting live link default (R2):', error);
    throw error;
  }
};



export const createPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'totalVotes' | 'votedUserIds' | 'slug' | 'status'>) => {
  try {
    const baseSlug = slugify(poll.question);
    const res = await fetch('/api/polls/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', poll: { ...poll, slug: baseSlug, status: 'pending' } })
    });
    if (!res.ok) throw new Error('Failed to create poll on R2');
    await generateAndUploadSitemap();
    const data = await res.json();
    return data.poll.id;
  } catch (error) {
    console.error('Error creating poll (R2):', error);
    throw error;
  }
};

export const updatePollStatus = async (pollId: string, status: Poll['status']): Promise<void> => {
  try {
    const res = await fetch('/api/polls/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', id: pollId, status })
    });
    if (!res.ok) throw new Error('Failed to update poll status on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error updating poll status (R2):', error);
    throw error;
  }
};

export const updatePoll = async (pollId: string, data: Partial<Omit<Poll, 'id'>>): Promise<void> => {
  try {
    const res = await fetch('/api/polls/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: pollId, poll: data })
    });
    if (!res.ok) throw new Error('Failed to update poll on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error updating poll (R2):', error);
    throw error;
  }
};

export const deletePoll = async (pollId: string): Promise<void> => {
  try {
    const res = await fetch('/api/polls/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: pollId })
    });
    if (!res.ok) throw new Error('Failed to delete poll from R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error deleting poll (R2):', error);
    throw error;
  }
};

// --- LIVE COMMENTS (DISCUSSIONS) ---

export const subscribeToLiveComments = (channelId: string, callback: (comments: any[]) => void) => {
  return db.collection(LIVE_COMMENTS_COLLECTION)
    .where('channelId', '==', channelId)
    .onSnapshot((snapshot) => {
      const comments = snapshot.docs.map(doc => {
        const data = doc.data();
        let timestamp = new Date();
        if (data.timestamp) {
          timestamp = (data.timestamp as firebase.firestore.Timestamp).toDate();
        }
        return {
          id: doc.id,
          ...data,
          timestamp
        };
      }).sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
      callback(comments);
    }, (error) => {
      console.error('Error subscribing to live comments:', error);
    });
};

export const getLiveComments = async (channelId: string): Promise<any[]> => {
  try {
    const snapshot = await db.collection(LIVE_COMMENTS_COLLECTION)
      .where('channelId', '==', channelId)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as firebase.firestore.Timestamp).toDate()
    }));
  } catch (error) {
    console.error('Error fetching live comments:', error);
    // Fallback if index is missing
    try {
      const snapshot = await db.collection(LIVE_COMMENTS_COLLECTION)
        .where('channelId', '==', channelId)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data().timestamp as firebase.firestore.Timestamp).toDate()
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (err) {
      console.error('Fallback fetch failed:', err);
      return [];
    }
  }
};

export const addLiveComment = async (comment: {
  channelId: string;
  text: string;
  userId?: string;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  parentId?: string;
}) => {
  try {
    const docRef = await db.collection(LIVE_COMMENTS_COLLECTION).add({
      ...comment,
      likes: [],
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding live comment:', error);
    throw error;
  }
};

export const likeLiveComment = async (commentId: string, userId: string) => {
  try {
    const docRef = db.collection(LIVE_COMMENTS_COLLECTION).doc(commentId);
    const doc = await docRef.get();
    if (!doc.exists) return;

    const data = doc.data();
    const likes = data?.likes || [];

    if (likes.includes(userId)) {
      await docRef.update({
        likes: firebase.firestore.FieldValue.arrayRemove(userId)
      });
    } else {
      await docRef.update({
        likes: firebase.firestore.FieldValue.arrayUnion(userId)
      });
    }
  } catch (error) {
    console.error('Error liking live comment:', error);
    throw error;
  }
};

export const clearLiveComments = async (channelId: string) => {
  try {
    const snapshot = await db.collection(LIVE_COMMENTS_COLLECTION)
      .where('channelId', '==', channelId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error clearing live comments:', error);
    throw error;
  }
};

// --- KEYWORDS ---

export const getKeywords = async (): Promise<{ id: string; name: string; count: number }[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/keywords.json?t=${Date.now()}` : `/api/r2-proxy?file=keywords.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch keywords from R2');
    const keywords = await res.json();
    return Array.isArray(keywords) ? keywords.sort((a, b) => a.name.localeCompare(b.name)) : [];
  } catch (error) {
    console.error('Error fetching keywords (R2):', error);
    return [];
  }
};

export const createKeyword = async (name: string) => {
  try {
    const res = await fetch('/api/keywords/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name })
    });
    if (!res.ok) throw new Error('Failed to create keyword on R2');
  } catch (error) {
    console.error('Error creating keyword (R2):', error);
    throw error;
  }
};

export const deleteKeyword = async (id: string) => {
  try {
    const res = await fetch('/api/keywords/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    if (!res.ok) throw new Error('Failed to delete keyword from R2');
  } catch (error) {
    console.error('Error deleting keyword (R2):', error);
    throw error;
  }
};

// --- LIVE MATCHES ---

export const getLiveMatches = async (): Promise<any[]> => {
  try {
    const snapshot = await db.collection(LIVE_MATCHES_COLLECTION).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

export const createLiveMatch = async (match: any) => {
  try {
    await db.collection(LIVE_MATCHES_COLLECTION).add({
      ...match,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating live match:', error);
    throw error;
  }
};

export const updateLiveMatchStatus = async (id: string, isActive: boolean) => {
  try {
    await db.collection(LIVE_MATCHES_COLLECTION).doc(id).update({ isActive });
  } catch (error) {
    console.error('Error updating live match status:', error);
    throw error;
  }
};

export const deleteLiveMatch = async (id: string) => {
  try {
    await db.collection(LIVE_MATCHES_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting live match:', error);
    throw error;
  }
};

// --- PROMPTS LIBRARY ---

const PROMPT_CATEGORIES_COLLECTION = 'prompt_categories';
const PROMPT_SUBCATEGORIES_COLLECTION = 'prompt_subcategories';
const PROMPTS_COLLECTION = 'prompts';

// --- PROMPT CATEGORIES ---

export const getPromptCategories = async (): Promise<PromptCategory[]> => {
  try {
    const snapshot = await db.collection(PROMPT_CATEGORIES_COLLECTION)
      .orderBy('order', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptCategory));
  } catch (error) {
    console.error('Error fetching prompt categories:', error);
    return [];
  }
};

export const addPromptCategory = async (category: Omit<PromptCategory, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await db.collection(PROMPT_CATEGORIES_COLLECTION).add({
      ...category,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding prompt category:', error);
    throw error;
  }
};

export const updatePromptCategory = async (id: string, updates: Partial<PromptCategory>): Promise<void> => {
  try {
    await db.collection(PROMPT_CATEGORIES_COLLECTION).doc(id).update(updates);
  } catch (error) {
    console.error('Error updating prompt category:', error);
    throw error;
  }
};

export const deletePromptCategory = async (id: string): Promise<void> => {
  try {
    // Check if any subcategories use this category
    const subcatsSnapshot = await db.collection(PROMPT_SUBCATEGORIES_COLLECTION)
      .where('categoryId', '==', id)
      .get();

    if (!subcatsSnapshot.empty) {
      throw new Error('Cannot delete category: Subcategories exist. Please delete them first.');
    }

    // Check if any prompts use this category
    const promptsSnapshot = await db.collection(PROMPTS_COLLECTION)
      .where('categoryId', '==', id)
      .get();

    if (!promptsSnapshot.empty) {
      throw new Error('Cannot delete category: Prompts exist. Please reassign them first.');
    }

    await db.collection(PROMPT_CATEGORIES_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting prompt category:', error);
    throw error;
  }
};

// --- PROMPT SUBCATEGORIES ---

export const getPromptSubcategories = async (categoryId?: string): Promise<PromptSubcategory[]> => {
  try {
    let query: firebase.firestore.Query = db.collection(PROMPT_SUBCATEGORIES_COLLECTION);

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    const snapshot = await query.orderBy('order', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSubcategory));
  } catch (error) {
    console.error('Error fetching prompt subcategories:', error);
    return [];
  }
};

export const addPromptSubcategory = async (subcategory: Omit<PromptSubcategory, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await db.collection(PROMPT_SUBCATEGORIES_COLLECTION).add({
      ...subcategory,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding prompt subcategory:', error);
    throw error;
  }
};

export const updatePromptSubcategory = async (id: string, updates: Partial<PromptSubcategory>): Promise<void> => {
  try {
    await db.collection(PROMPT_SUBCATEGORIES_COLLECTION).doc(id).update(updates);
  } catch (error) {
    console.error('Error updating prompt subcategory:', error);
    throw error;
  }
};

export const deletePromptSubcategory = async (id: string): Promise<void> => {
  try {
    // Check if any prompts use this subcategory
    const promptsSnapshot = await db.collection(PROMPTS_COLLECTION)
      .where('subcategoryId', '==', id)
      .get();

    if (!promptsSnapshot.empty) {
      throw new Error('Cannot delete subcategory: Prompts exist. Please reassign them first.');
    }

    await db.collection(PROMPT_SUBCATEGORIES_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting prompt subcategory:', error);
    throw error;
  }
};

// --- PROMPTS ---

export const getPrompts = async (filters?: {
  categoryId?: string;
  subcategoryId?: string;
  status?: string;
  isFeatured?: boolean;
}): Promise<Prompt[]> => {
  try {
    let query: firebase.firestore.Query = db.collection(PROMPTS_COLLECTION);

    if (filters?.categoryId) {
      query = query.where('categoryId', '==', filters.categoryId);
    }

    if (filters?.subcategoryId) {
      query = query.where('subcategoryId', '==', filters.subcategoryId);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.isFeatured !== undefined) {
      query = query.where('isFeatured', '==', filters.isFeatured);
    }

    const snapshot = await query.get();
    const prompts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));

    // Sort by creation date (newest first)
    return prompts.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }
};

export const getPromptById = async (id: string): Promise<Prompt | null> => {
  try {
    const doc = await db.collection(PROMPTS_COLLECTION).doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Prompt;
    }
    return null;
  } catch (error) {
    console.error('Error fetching prompt by ID:', error);
    return null;
  }
};

export const addPrompt = async (prompt: Omit<Prompt, 'id' | 'usageCount' | 'likes' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await db.collection(PROMPTS_COLLECTION).add({
      ...prompt,
      usageCount: 0,
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding prompt:', error);
    throw error;
  }
};

export const updatePrompt = async (id: string, updates: Partial<Prompt>): Promise<void> => {
  try {
    await db.collection(PROMPTS_COLLECTION).doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    throw error;
  }
};

export const deletePrompt = async (id: string): Promise<void> => {
  try {
    await db.collection(PROMPTS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    throw error;
  }
};

export const approvePrompt = async (id: string): Promise<void> => {
  try {
    await db.collection(PROMPTS_COLLECTION).doc(id).update({
      status: 'approved',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error approving prompt:', error);
    throw error;
  }
};

export const rejectPrompt = async (id: string): Promise<void> => {
  try {
    await db.collection(PROMPTS_COLLECTION).doc(id).update({
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error rejecting prompt:', error);
    throw error;
  }
};

export const likePrompt = async (promptId: string, userId: string): Promise<boolean> => {
  try {
    const ref = db.collection(PROMPTS_COLLECTION).doc(promptId);
    const doc = await ref.get();

    if (!doc.exists) return false;

    const likes: string[] = doc.data()?.likes || [];

    if (likes.includes(userId)) {
      await ref.update({
        likes: firebase.firestore.FieldValue.arrayRemove(userId)
      });
      return false;
    } else {
      await ref.update({
        likes: firebase.firestore.FieldValue.arrayUnion(userId)
      });
      return true;
    }
  } catch (error) {
    console.error('Error liking prompt:', error);
    throw error;
  }
};

export const incrementPromptUsage = async (promptId: string): Promise<void> => {
  try {
    await db.collection(PROMPTS_COLLECTION).doc(promptId).update({
      usageCount: firebase.firestore.FieldValue.increment(1),
    });
  } catch (error) {
    console.error('Error incrementing prompt usage:', error);
    throw error;
  }
};

// --- HIGHLIGHTS ---

export const getHighlights = async (): Promise<Highlight[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/highlights.json?t=${Date.now()}` : `/api/r2-proxy?file=highlights.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch highlights from R2');
    const highlights = await res.json();
    return Array.isArray(highlights) ? highlights.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];
  } catch (error) {
    console.error('Error fetching highlights (R2):', error);
    return [];
  }
};

export const addHighlight = async (highlight: Omit<Highlight, 'id' | 'createdAt'>) => {
  try {
    const res = await fetch('/api/highlights/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', highlight })
    });
    if (!res.ok) throw new Error('Failed to add highlight to R2');
    await generateAndUploadSitemap();
    const data = await res.json();
    return data.highlight.id;
  } catch (error) {
    console.error('Error adding highlight (R2):', error);
    throw error;
  }
};

export const deleteHighlight = async (id: string) => {
  try {
    const res = await fetch('/api/highlights/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    if (!res.ok) throw new Error('Failed to delete highlight from R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error deleting highlight (R2):', error);
    throw error;
  }
};

// --- SUBSCRIPTIONS ---
export const subscribeToNewsletter = async (email: string) => {
  try {
    const subscriberRef = db.collection(SUBSCRIBERS_COLLECTION).doc(email.toLowerCase());
    const doc = await subscriberRef.get();

    if (doc.exists) {
      if (doc.data()?.status === 'unsubscribed') {
        await subscriberRef.update({
          status: 'active',
          subscribedAt: new Date().toISOString()
        });
        // Send re-subscription email
        try {
          await fetch('/api/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase() })
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }
      return;
    }

    await subscriberRef.set({
      email: email.toLowerCase(),
      subscribedAt: new Date().toISOString(),
      status: 'active'
    });

    // Send confirmation email
    try {
      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't throw - subscription was successful even if email fails
    }
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};

export const getSubscribers = async (): Promise<any[]> => {
  try {
    const snapshot = await db.collection(SUBSCRIBERS_COLLECTION)
      .orderBy('subscribedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
};

export const unsubscribeFromNewsletter = async (id: string) => {
  try {
    await db.collection(SUBSCRIBERS_COLLECTION).doc(id).update({
      status: 'unsubscribed'
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    throw error;
  }
};

export const getSmtpSettings = async () => {
  try {
    const doc = await db.collection('config').doc('smtp').get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    return null;
  }
};

export const updateSmtpSettings = async (settings: any) => {
  try {
    await db.collection('config').doc('smtp').set({
      ...settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating SMTP settings:', error);
    throw error;
  }
};

export const getIPTVConfig = async () => {
  try {
    const doc = await db.collection('config').doc('iptv').get();
    return doc.exists ? doc.data() : {
      m3uUrl: '',
      guestLimitMinutes: 5,
      enableSportsLimit: false,
      adUrl: ''
    };
  } catch (error) {
    console.error('Error fetching IPTV config:', error);
    return { m3uUrl: '', guestLimitMinutes: 5, enableSportsLimit: false, adUrl: '' };
  }
};

export const updateIPTVConfig = async (settings: { m3uUrl: string; guestLimitMinutes: number; enableSportsLimit: boolean; adUrl?: string }) => {
  try {
    await db.collection('config').doc('iptv').set({
      ...settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating IPTV config:', error);
    throw error;
  }
};

// --- IPTV CHANNELS ---

export const getIPTVChannels = async (onlyActive = true): Promise<IPTVChannel[]> => {
  try {
    const url = isServer ? `${R2_PUBLIC_DOMAIN}/iptv-data.json?t=${Date.now()}` : `/api/r2-proxy?file=iptv-data.json&t=${Date.now()}`;
    const res = await fetch(url, isServer ? { next: { revalidate: 60 } } : {});
    if (!res.ok) throw new Error('Failed to fetch IPTV channels from R2');
    const channels = await res.json();
    if (!Array.isArray(channels)) return [];
    return onlyActive ? channels.filter(c => c.status === 'active') : channels;
  } catch (error) {
    console.error('Error fetching IPTV channels (R2):', error);
    return [];
  }
};

export const getTrendingIPTVChannels = async (): Promise<IPTVChannel[]> => {
  try {
    const channels = await getIPTVChannels(true);
    return channels.filter(c => c.isTrending || c.isDefault);
  } catch (error) {
    console.error('Error fetching trending IPTV channels (R2):', error);
    return [];
  }
};

export const addIPTVChannel = async (channel: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const res = await fetch('/api/iptv/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', channel })
    });
    if (!res.ok) throw new Error('Failed to add IPTV channel to R2');
    await generateAndUploadSitemap();
    const data = await res.json();
    return data.channel.id;
  } catch (error) {
    console.error('Error adding IPTV channel (R2):', error);
    throw error;
  }
};

export const batchAddIPTVChannels = async (channels: Omit<IPTVChannel, 'id' | 'createdAt' | 'updatedAt'>[]) => {
  const BATCH_SIZE = 500;
  const chunks = [];
  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    chunks.push(channels.slice(i, i + BATCH_SIZE));
  }

  for (const chunk of chunks) {
    const batch = db.batch();
    const now = new Date().toISOString();
    chunk.forEach(channel => {
      const ref = db.collection(IPTV_CHANNELS_COLLECTION).doc();
      batch.set(ref, {
        ...channel,
        createdAt: now,
        updatedAt: now
      });
    });
    await batch.commit();
  }
};

export const updateIPTVChannel = async (id: string, updates: Partial<IPTVChannel>) => {
  try {
    const res = await fetch('/api/iptv/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id, channel: updates })
    });
    if (!res.ok) throw new Error('Failed to update IPTV channel on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error updating IPTV channel (R2):', error);
    throw error;
  }
};

export async function upsertIPTVChannel(channel: any, updates: Partial<IPTVChannel>) {
  try {
    const res = await fetch('/api/iptv/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', channel: { ...channel, ...updates } })
    });
    if (!res.ok) throw new Error('Failed to upsert IPTV channel on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error upserting IPTV channel (R2):', error);
    throw error;
  }
}

export const setDefaultIPTVChannel = async (channel: any) => {
  try {
    const res = await fetch('/api/iptv/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setDefault', id: channel.id })
    });
    if (!res.ok) throw new Error('Failed to set default IPTV channel on R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error setting default IPTV channel (R2):', error);
    throw error;
  }
};

export const deleteIPTVChannel = async (id: string) => {
  try {
    const res = await fetch('/api/iptv/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    if (!res.ok) throw new Error('Failed to delete IPTV channel from R2');
    await generateAndUploadSitemap();
  } catch (error) {
    console.error('Error deleting IPTV channel (R2):', error);
    throw error;
  }
};

// --- IPTV CATEGORIES ---

export const getIPTVCategories = async (): Promise<IPTVCategory[]> => {
  try {
    const channels = await getIPTVChannels(true);
    const categories = Array.from(new Set(channels.map(c => c.category)));
    return categories.map(name => ({ id: name, name, slug: slugify(name) }));
  } catch (error) {
    console.error('Error fetching IPTV categories (derived):', error);
    return [];
  }
};

export const addIPTVCategory = async (name: string) => {
  try {
    const slug = slugify(name);
    const docRef = await db.collection(IPTV_CATEGORIES_COLLECTION).add({
      name,
      slug
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding IPTV category:', error);
    throw error;
  }
};

export const deleteIPTVCategory = async (id: string) => {
  try {
    await db.collection(IPTV_CATEGORIES_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting IPTV category:', error);
    throw error;
  }
};
