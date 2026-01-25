// services/db.ts
import { notifyIndexNow, notifyBingWebmaster } from './indexingService'; // Ensure this is imported
import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, BlogPostComment, BlogPostReview, Poll, PollOption, LiveLink, Prompt, PromptCategory, PromptSubcategory, Highlight, TrafficSession, TrafficStats } from '../types';
import { MOCK_POSTS, CATEGORIES } from '../constants';
import { slugify } from '../lib/slugify'; // <-- NEW IMPORT

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';
const REVIEWS_COLLECTION = 'reviews';
const POLLS_COLLECTION = 'polls';
const LIVE_LINKS_COLLECTION = 'live_links';
const KEYWORDS_COLLECTION = 'keywords';
const LIVE_MATCHES_COLLECTION = 'live_matches';
const PAGES_COLLECTION = 'pages';
const HIGHLIGHTS_COLLECTION = 'highlights';
const TRAFFIC_COLLECTION = 'traffic';
const SUBSCRIBERS_COLLECTION = 'subscribers';



// Helper: client-side sort (avoids Firestore composite index requirement)
const sortByDateDesc = (a: any, b: any) => {
  const dateA = new Date(a.updatedAt || a.createdAt || a.date).getTime();
  const dateB = new Date(b.updatedAt || b.createdAt || b.date).getTime();
  return dateB - dateA;
};

// Helper: Check if a slug already exists in the database
const checkSlugExists = async (slug: string): Promise<boolean> => {
  const snapshot = await db.collection(POSTS_COLLECTION)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  return !snapshot.empty;
};

// Helper: Check if a poll slug already exists
const checkPollSlugExists = async (slug: string): Promise<boolean> => {
  const snapshot = await db.collection(POLLS_COLLECTION)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  return !snapshot.empty;
};

// --- POSTS ---

export const getPosts = async (limitCount?: number): Promise<BlogPost[]> => {
  try {
    let query = db.collection(POSTS_COLLECTION)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc');

    if (limitCount) {
      query = query.limit(limitCount);
    }

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
  } catch (error: any) {
    // Check for "The query requires an index" error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('requires an index'))) {
      console.warn('Firestore index missing for optimized query. Falling back to client-side sort. Please create the index using the link in the console/Lighthouse report.');

      // Fallback: Fetch without sorting/limiting and sort client-side
      try {
        const snapshot = await db.collection(POSTS_COLLECTION)
          .where('status', '==', 'published')
          .get();

        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BlogPost));

        const sorted = posts.sort(sortByDateDesc);
        return limitCount ? sorted.slice(0, limitCount) : sorted;
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        return [];
      }
    }

    console.error('Error fetching published posts:', error);
    return [];
  }
};

export const getLatestPosts = async (count: number = 10): Promise<BlogPost[]> => {
  return getPosts(count);
};

export const getPendingPosts = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION)
      .where('status', '==', 'pending')
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching pending posts:', error);
    return [];
  }
};

export const getUserPosts = async (userId: string): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION)
      .where('author.id', '==', userId)
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

export const getAllPostsAdmin = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION).get();
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching all posts (admin):', error);
    return [];
  }
};

// --- PAGES ---

export const getPages = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(PAGES_COLLECTION).get();
    const pages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return pages.sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching all pages:', error);
    return [];
  }
};

// Legacy: kept for internal use in admin/preview links
export const getPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const doc = await db.collection(POSTS_COLLECTION).doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as BlogPost;
    }
    return null;
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return null;
  }
};

// Public-facing: supports both /blog/my-slug and /blog/old-id
export const getPostBySlug = async (slugOrId: string): Promise<BlogPost | null> => {
  try {
    // 1. Try by slug field
    const bySlug = await db.collection(POSTS_COLLECTION)
      .where('slug', '==', slugOrId)
      .limit(1)
      .get();

    if (!bySlug.empty) {
      const doc = bySlug.docs[0];
      return { id: doc.id, ...doc.data() } as BlogPost;
    }

    // 2. Fallback to document ID
    const byId = await db.collection(POSTS_COLLECTION).doc(slugOrId).get();
    if (byId.exists) {
      return { id: byId.id, ...byId.data() } as BlogPost;
    }

    return null;
  } catch (error) {
    console.error('Error fetching post by slug/ID:', error);
    return null;
  }
};

/**
 * Creates a new post with a guaranteed unique slug.
 * If the generated slug already exists, a counter is appended (e.g., 'post-title-2').
 */
export const createPost = async (
  post: Omit<BlogPost, 'id' | 'likes' | 'views' | 'createdAt' | 'updatedAt' | 'slug'> & {
    slug?: string;
    status: 'published' | 'pending' | 'draft';
  }
) => {
  try {
    // Use provided slug or generate from title
    const baseSlug = post.slug ? post.slug : slugify(post.title);
    let slug = baseSlug;
    let counter = 1;

    while (await checkSlugExists(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const newPost = {
      ...post,
      slug,
      likes: [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(POSTS_COLLECTION).add(newPost);

    // Auto-update sitemap and notify search engines if published
    if (post.status === 'published') {
      await generateAndUploadSitemap();
      await notifyIndexNow([getFullUrl(slug)]); // Notification for new content
      await notifyBingWebmaster([getFullUrl(slug)]); // Bing Webmaster notification
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

/**
 * Updates an existing post and regenerates slug if title changes.
 */
export const updatePost = async (
  postId: string,
  postData: Partial<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: Record<string, any> = {
      ...postData,
      updatedAt: new Date().toISOString(),
    };

    if (postData.slug || postData.title) {
      // Prioritize explicit slug, fallback to title if slug missing but title changed
      const baseSlug = postData.slug ? postData.slug : slugify(postData.title!);
      let slug = baseSlug;
      let counter = 1;

      while (await checkSlugExists(slug)) {
        const existingPost = await getPostBySlug(slug);
        if (existingPost && existingPost.id === postId) {
          break;
        }
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      updateData.slug = slug;
    }

    await db.collection(POSTS_COLLECTION).doc(postId).update(updateData);

    const status = postData.status as 'published' | 'pending' | 'draft' | undefined;
    // If the post is published, notify search engines of the change
    if (status === 'published') {
      await generateAndUploadSitemap();
      const currentPost = await getPostById(postId);
      if (currentPost?.slug) {
        await notifyIndexNow([getFullUrl(currentPost.slug)]); // Notification for modified content
        await notifyBingWebmaster([getFullUrl(currentPost.slug)]); // Bing Webmaster notification
      }
    }

    console.log(`Post ${postId} updated successfully`);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

/**
 * Deletes a post and notifies search engines to remove the URL.
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const post = await getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await db.collection(POSTS_COLLECTION).doc(postId).delete();

    // ... (rest of your deletion logic for comments/reviews remains the same)
    const commentsSnapshot = await db.collection(COMMENTS_COLLECTION).where('postId', '==', postId).get();
    const deleteCommentsPromises = commentsSnapshot.docs.map(doc => doc.ref.delete());
    const reviewsSnapshot = await db.collection(REVIEWS_COLLECTION).where('postId', '==', postId).get();
    const deleteReviewsPromises = reviewsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all([...deleteCommentsPromises, ...deleteReviewsPromises]);

    if (post.status === 'published') {
      await generateAndUploadSitemap();
      await notifyIndexNow([getFullUrl(post.slug)]); // Notification for deleted content
      await notifyBingWebmaster([getFullUrl(post.slug)]); // Bing Webmaster notification
    }

    console.log(`Post ${postId} and associated data deleted successfully`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};
const getFullUrl = (slug: string) => `https://bigyann.com.np/${slug}`;
const getVotingUrl = (slug: string) => `https://bigyann.com.np/voting/${slug}`;
/**
 * Updates post status and notifies IndexNow if changed to published.
 */
export const updatePostStatus = async (postId: string, status: 'published' | 'pending' | 'draft' | 'hidden') => {
  await db.collection(POSTS_COLLECTION).doc(postId).update({
    status,
    updatedAt: new Date().toISOString(),
  });

  if (status === 'published') {
    await generateAndUploadSitemap();
    const post = await getPostById(postId);
    if (post?.slug) {
      await notifyIndexNow([getFullUrl(post.slug)]); // Real-time indexing
      await notifyBingWebmaster([getFullUrl(post.slug)]); // Bing Webmaster notification
    }
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
    const snapshot = await db.collection(CATEGORIES_COLLECTION).get();
    if (snapshot.empty) return CATEGORIES;
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return CATEGORIES;
  }
};

export const createCategory = async (category: Omit<Category, 'id' | 'count'>) => {
  await db.collection(CATEGORIES_COLLECTION).add({ ...category, count: 0 });
};

// Delete a category (with validation)
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    // Get the category name first
    const categoryDoc = await db.collection(CATEGORIES_COLLECTION).doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error('Category not found');
    }

    const categoryData = categoryDoc.data() as Category;

    // Check if any posts use this category (by category name)
    const postsSnapshot = await db.collection(POSTS_COLLECTION)
      .where('category', '==', categoryData.name)
      .get();

    if (!postsSnapshot.empty) {
      throw new Error('Cannot delete category: Some posts are still using it. Please reassign posts first.');
    }

    await db.collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
    console.log(`Category ${categoryId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting category:', error);
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

export const generateAndUploadSitemap = async (): Promise<string | null> => {
  const SITEMAP_SECRET = 'bigyann-2025-super-secret-987654321'; // ← MUST match Vercel env

  try {
    const response = await fetch('/api/sitemap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SITEMAP_SECRET}`,
      },
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Sitemap API error:', response.status, err);
      // NOTE: Alerts removed for cleaner server/service code.
      // alert('Sitemap failed: ' + (err || response.statusText));
      return null;
    }

    const data = await response.json();
    // NOTE: Alerts removed for cleaner server/service code.
    // alert(`Sitemap Updated!\n${data.posts || 'All'} posts indexednnLive URL:n${data.url || 'https://ulganzkpfwuuglxj.public.blob.vercel-storage.com/sitemap.xml'}`);
    console.log(`Sitemap Updated! Indexed ${data.posts || 'All'} posts. URL: ${data.url}`);
    return data.url;

  } catch (err) {
    console.error('Network error:', err);
    // NOTE: Alerts removed for cleaner server/service code.
    // alert('Check internet or Vercel deployment');
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

export const updatePageHeartbeat = async (sessionId: string, duration: number, isActive: boolean = true) => {
  try {
    await db.collection(TRAFFIC_COLLECTION).doc(sessionId).update({
      lastHeartbeat: new Date().toISOString(),
      duration: duration,
      isActive: isActive
    });
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

    const sessions = snapshot.docs.map(doc => doc.data() as TrafficSession);
    const pageCounts: Record<string, { title: string, count: number }> = {};

    sessions.forEach(s => {
      if (!pageCounts[s.slug]) {
        pageCounts[s.slug] = { title: s.title, count: 0 };
      }
      pageCounts[s.slug].count += 1;
    });

    return {
      activeUsers: sessions.length,
      activePages: Object.entries(pageCounts).map(([slug, data]) => ({
        slug,
        title: data.title,
        count: data.count
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
    let query: firebase.firestore.Query = db.collection(POLLS_COLLECTION);

    // Admin can see everything, but for UI we might want to filter
    if (status) {
      query = query.where('status', '==', status);
    }

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    if (isFeatured !== undefined) {
      query = query.where('isFeatured', '==', isFeatured);
    }

    // Apply sorting in Firestore where possible (requires index)
    // Falling back to manual sort for complex filters if index isn't present
    // But for performance, it's better to limit the results
    query = query.limit(40);

    const snapshot = await query.get();
    const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));

    // Sort logic
    return polls.sort((a, b) => {
      if (isFeatured) {
        const orderA = a.featuredOrder ?? 999;
        const orderB = b.featuredOrder ?? 999;
        if (orderA !== orderB) return orderA - orderB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
};

export const getAllPollsAdmin = async (): Promise<Poll[]> => {
  try {
    const snapshot = await db.collection(POLLS_COLLECTION).get();
    const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
    return polls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching all polls (admin):', error);
    return [];
  }
};

export const getPollById = async (id: string): Promise<Poll | null> => {
  try {
    const doc = await db.collection(POLLS_COLLECTION).doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Poll;
    }
    return null;
  } catch (error) {
    console.error('Error fetching poll by ID:', error);
    return null;
  }
};

export const getPollBySlug = async (slugOrId: string): Promise<Poll | null> => {
  try {
    // 1. Try by slug
    const bySlug = await db.collection(POLLS_COLLECTION)
      .where('slug', '==', slugOrId)
      .limit(1)
      .get();

    if (!bySlug.empty) {
      const doc = bySlug.docs[0];
      return { id: doc.id, ...doc.data() } as Poll;
    }

    // 2. Fallback to document ID
    const byId = await db.collection(POLLS_COLLECTION).doc(slugOrId).get();
    if (byId.exists) {
      return { id: byId.id, ...byId.data() } as Poll;
    }

    return null;
  } catch (error) {
    console.error('Error fetching poll by slug/ID:', error);
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

    return true;
  } catch (error) {
    console.error('Error voting in poll:', error);
    return false;
  }
};

// --- LIVE LINKS (Admin managed) ---

export const getLiveLinks = async (): Promise<LiveLink[]> => {
  try {
    const snapshot = await db.collection(LIVE_LINKS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LiveLink));
  } catch (error) {
    console.error('Error fetching live links:', error);
    return [];
  }
};

export const addLiveLink = async (link: Omit<LiveLink, 'id'>) => {
  try {
    await db.collection(LIVE_LINKS_COLLECTION).add({
      ...link,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding live link:', error);
    throw error;
  }
};

export const updateLiveLink = async (id: string, data: Partial<Omit<LiveLink, 'id' | 'createdAt'>>) => {
  try {
    await db.collection(LIVE_LINKS_COLLECTION).doc(id).update({
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating live link:', error);
    throw error;
  }
};

export const deleteLiveLink = async (id: string) => {
  try {
    await db.collection(LIVE_LINKS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting live link:', error);
    throw error;
  }
};



export const createPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'totalVotes' | 'votedUserIds' | 'slug' | 'status'>) => {
  try {
    const baseSlug = slugify(poll.question);
    let slug = baseSlug;
    let counter = 1;

    while (await checkPollSlugExists(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const newPoll = {
      ...poll,
      slug,
      status: 'pending',
      totalVotes: 0,
      votedUserIds: [],
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection(POLLS_COLLECTION).add(newPoll);
    return docRef.id;
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

export const updatePollStatus = async (pollId: string, status: Poll['status']): Promise<void> => {
  try {
    await db.collection(POLLS_COLLECTION).doc(pollId).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    if (status === 'approved') {
      await generateAndUploadSitemap();
      const poll = await getPollById(pollId);
      if (poll?.slug) {
        await notifyIndexNow([getVotingUrl(poll.slug)]); // Real-time indexing
        await notifyBingWebmaster([getVotingUrl(poll.slug)]); // Bing Webmaster notification
      }
    }
  } catch (error) {
    console.error('Error updating poll status:', error);
    throw error;
  }
};

export const updatePoll = async (pollId: string, data: Partial<Omit<Poll, 'id'>>): Promise<void> => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await db.collection(POLLS_COLLECTION).doc(pollId).update(updateData);

    const poll = await getPollById(pollId);
    if (poll?.status === 'approved' && (data.question || data.slug)) {
      await generateAndUploadSitemap();
      if (poll.slug) {
        await notifyIndexNow([getVotingUrl(poll.slug)]);
        await notifyBingWebmaster([getVotingUrl(poll.slug)]);
      }
    }
  } catch (error) {
    console.error('Error updating poll:', error);
    throw error;
  }
};

export const deletePoll = async (pollId: string): Promise<void> => {
  try {
    await db.collection(POLLS_COLLECTION).doc(pollId).delete();
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

// --- KEYWORDS ---

export const getKeywords = async (): Promise<{ id: string; name: string; count: number }[]> => {
  try {
    const snapshot = await db.collection(KEYWORDS_COLLECTION).orderBy('name').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string; count: number }));
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return [];
  }
};

export const createKeyword = async (name: string) => {
  try {
    const normalizedName = name.trim().toLowerCase();
    // Check if exists
    const snapshot = await db.collection(KEYWORDS_COLLECTION).where('name', '==', normalizedName).limit(1).get();
    if (!snapshot.empty) return; // Already exists

    await db.collection(KEYWORDS_COLLECTION).add({
      name: normalizedName,
      count: 0,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating keyword:', error);
    throw error;
  }
};

export const deleteKeyword = async (id: string) => {
  try {
    await db.collection(KEYWORDS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting keyword:', error);
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
    const snapshot = await db.collection(HIGHLIGHTS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Highlight));
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return [];
  }
};

export const addHighlight = async (highlight: Omit<Highlight, 'id' | 'createdAt'>) => {
  try {
    const docRef = await db.collection(HIGHLIGHTS_COLLECTION).add({
      ...highlight,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding highlight:', error);
    throw error;
  }
};

export const deleteHighlight = async (id: string) => {
  try {
    await db.collection(HIGHLIGHTS_COLLECTION).doc(id).delete();
  } catch (error) {
    console.error('Error deleting highlight:', error);
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
