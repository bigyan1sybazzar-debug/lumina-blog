// services/db.ts
import { notifyIndexNow, notifyBingWebmaster } from './indexingService'; // Ensure this is imported
import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, Comment, Review, Poll, PollOption } from '../types';
import { MOCK_POSTS, CATEGORIES } from '../constants';
import { slugify } from '../lib/slugify'; // <-- NEW IMPORT

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';
const REVIEWS_COLLECTION = 'reviews';
const POLLS_COLLECTION = 'polls';


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

// --- POSTS ---

export const getPosts = async (): Promise<BlogPost[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION)
      .where('status', '==', 'published')
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
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

// --- COMMENTS ---

export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  try {
    const snapshot = await db.collection(COMMENTS_COLLECTION)
      .where('postId', '==', postId)
      .get();

    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));

    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const addComment = async (comment: Omit<Comment, 'id' | 'createdAt'>) => {
  await db.collection(COMMENTS_COLLECTION).add({
    ...comment,
    createdAt: new Date().toISOString(),
  });
};

// --- REVIEWS (Star Ratings) ---

export const getReviewsByPostId = async (postId: string): Promise<Review[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION)
      .where('postId', '==', postId)
      .get();

    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));

    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const addReview = async (review: Omit<Review, 'id' | 'createdAt'>) => {
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

export const getAllComments = async (): Promise<Comment[]> => {
  try {
    const snapshot = await db.collection(COMMENTS_COLLECTION).get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));

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

export const getAllReviews = async (): Promise<Review[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION).get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));

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

// --- POLLS ---

export const getPolls = async (category?: string): Promise<Poll[]> => {
  try {
    let query: firebase.firestore.Query = db.collection(POLLS_COLLECTION);
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }
    const snapshot = await query.get();
    const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Poll));
    return polls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
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
      totalVotes: firebase.firestore.FieldValue.increment(1),
      votedUserIds: firebase.firestore.FieldValue.arrayUnion(userId)
    });

    return true;
  } catch (error) {
    console.error('Error voting in poll:', error);
    return false;
  }
};

export const createPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'totalVotes' | 'votedUserIds'>) => {
  try {
    const newPoll = {
      ...poll,
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