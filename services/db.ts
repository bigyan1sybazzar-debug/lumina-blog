import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, Comment, Review } from '../types.js';
import { MOCK_POSTS, CATEGORIES } from '../constants';
// REMOVED: import { slugify } from '../lib/slugify'; - This function was imported but not used, causing a warning.

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';
// ⭐ NEW COLLECTION CONSTANT
const REVIEWS_COLLECTION = 'reviews';

// Helper for client-side sorting to avoid Firestore Index errors
const sortByDateDesc = (a: any, b: any) => {
  const dateA = new Date(a.createdAt || a.date).getTime();
  const dateB = new Date(b.createdAt || b.date).getTime();
  return dateB - dateA;
};

// --- POSTS ---

// Fetch published posts for public view
export const getPosts = async (): Promise<BlogPost[]> => {
  try {
    // REMOVED .orderBy('date', 'desc') to fix Index Error
    // We fetch filtered results and sort in memory
    const querySnapshot = await db.collection(POSTS_COLLECTION)
      .where('status', '==', 'published')
      .get();
      
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
};

// Fetch pending posts (Admin only)
export const getPendingPosts = async (): Promise<BlogPost[]> => {
  try {
    // REMOVED .orderBy('createdAt', 'desc') to fix Index Error
    const querySnapshot = await db.collection(POSTS_COLLECTION)
      .where('status', '==', 'pending')
      .get();
    
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error("Error getting pending posts:", error);
    return [];
  }
};

// Fetch user's own posts
export const getUserPosts = async (userId: string): Promise<BlogPost[]> => {
  try {
    // REMOVED .orderBy('createdAt', 'desc') to fix Index Error
    const querySnapshot = await db.collection(POSTS_COLLECTION)
      .where('author.id', '==', userId)
      .get();
      
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));

    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error("Error getting user posts:", error);
    return [];
  }
};

// Fetch ALL posts (for admin dashboard stats)
export const getAllPostsAdmin = async (): Promise<BlogPost[]> => {
  try {
    const querySnapshot = await db.collection(POSTS_COLLECTION).get();
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as BlogPost));
    
    return posts.sort(sortByDateDesc);
  } catch (error) {
    console.error("Error getting admin posts:", error);
    return [];
  }
};

/**
 * DEPRECATED: Use getPostBySlug instead for public view. 
 * Keeping for internal admin use that may rely on ID.
 */
export const getPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const docSnap = await db.collection(POSTS_COLLECTION).doc(id).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting post by ID:", error);
    return null;
  }
};

// ✅ UPDATED: Fetch post by slug OR ID for compatibility with existing URLs.
export const getPostBySlug = async (slugOrId: string): Promise<BlogPost | null> => {
  try {
    // 1. Try to query the posts collection by 'slug' field
    const querySnapshot = await db.collection(POSTS_COLLECTION)
      .where('slug', '==', slugOrId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      // Found by slug
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as BlogPost;
    }

    // 2. Fallback: If not found by slug, assume the parameter is a Document ID and try to fetch directly
    const docSnap = await db.collection(POSTS_COLLECTION).doc(slugOrId).get();
    
    if (docSnap.exists) {
      // Found by ID
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    }


    return null; // Post not found by either slug or ID
  } catch (error) {
    console.error("Error getting post by SLUG or ID:", error);
    // If there's an error during the direct fetch (e.g., malformed ID), we return null
    return null;
  }
};

// ⭐ FIX: Added missing 'createPost' export
export const createPost = async (
    post: Omit<BlogPost, 'id' | 'likes' | 'views' | 'createdAt' | 'slug'> & { status: 'published' | 'pending' | 'draft' }
) => {
    try {
        // Generate a simple slug from the title. 
        // Note: For a real app, you'd want to check for slug uniqueness.
        const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const newPostData = {
            ...post,
            slug: slug, // Generated from title
            likes: [], // Initialize likes array
            views: 0, // Initialize views count
            createdAt: new Date().toISOString(),
            status: post.status || 'published',
        };

        await db.collection(POSTS_COLLECTION).add(newPostData);
    } catch (error) {
        console.error("Error creating post: ", error);
        throw error;
    }
};

export const updatePostStatus = async (postId: string, status: 'published' | 'pending' | 'draft') => {
  await db.collection(POSTS_COLLECTION).doc(postId).update({ status });
};

export const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
  const postRef = db.collection(POSTS_COLLECTION).doc(postId);
  const doc = await postRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    const likes: string[] = data?.likes || [];
    
    if (likes.includes(userId)) {
      // Unlike
      await postRef.update({
        likes: firebase.firestore.FieldValue.arrayRemove(userId)
      });
      return false; // Liked status: false
    } else {
      // Like
      await postRef.update({
        likes: firebase.firestore.FieldValue.arrayUnion(userId)
      });
      return true; // Liked status: true
    }
  }
  return false;
};

export const incrementViewCount = async (id: string) => {
  try {
    await db.collection(POSTS_COLLECTION).doc(id).update({
      views: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error("Error incrementing views:", error);
  }
};

// --- CATEGORIES ---

export const getCategories = async (): Promise<Category[]> => {
  try {
    const snapshot = await db.collection(CATEGORIES_COLLECTION).get();
    if (snapshot.empty) {
      // Fallback to constants if DB empty
      return CATEGORIES; 
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    return CATEGORIES;
  }
};

export const createCategory = async (category: Omit<Category, 'id' | 'count'>) => {
  await db.collection(CATEGORIES_COLLECTION).add({
    ...category,
    count: 0
  });
};

// --- USERS ---

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await db.collection(USERS_COLLECTION).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  await db.collection(USERS_COLLECTION).doc(userId).update({ role });
};

// --- COMMENTS ---

export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  try {
    // REMOVED .orderBy('createdAt', 'desc') to fix Index Error
    const snapshot = await db.collection(COMMENTS_COLLECTION)
      .where('postId', '==', postId)
      .get();
      
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting comments", error);
    return [];
  }
};

export const addComment = async (comment: Omit<Comment, 'id'>) => {
  await db.collection(COMMENTS_COLLECTION).add(comment);
};

// --- REVIEWS (NEW) ---

/**
 * Fetches all reviews for a specific blog post ID, sorted by creation date.
 */
export const getReviewsByPostId = async (postId: string): Promise<Review[]> => {
  try {
    const snapshot = await db.collection(REVIEWS_COLLECTION)
      .where('postId', '==', postId)
      .get();
      
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
    
    // Sort reviews by date, newest first (client-side sorting)
    return reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting reviews", error);
    return [];
  }
};

/**
 * Adds a new review to the database.
 */
export const addReview = async (review: Omit<Review, 'id'>) => {
  try {
    await db.collection(REVIEWS_COLLECTION).add({
      ...review,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding review: ", error);
    throw error;
  }
};

// --- UTILS ---

// ✅ UPDATED: Seed data now includes a basic slug for consistency
export const seedDatabase = async () => {
  const postsCollection = db.collection(POSTS_COLLECTION);
  const snapshot = await postsCollection.get();
  
  if (!snapshot.empty) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  const promises = MOCK_POSTS.map(post => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...postData } = post;
    // Simple mock slug generation for seeding
    const mockSlug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return postsCollection.add({
      ...postData,
      slug: mockSlug, // <-- Added slug here
      status: 'published',
      likes: [],
      createdAt: new Date().toISOString()
    });
  });

  // Seed categories too
  const catSnapshot = await db.collection(CATEGORIES_COLLECTION).get();
  if (catSnapshot.empty) {
    CATEGORIES.forEach(cat => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...catData } = cat;
      db.collection(CATEGORIES_COLLECTION).add(catData);
    });
  }

  await Promise.all(promises);
};

// services/db.ts

/**
 * Fetches only the ID, slug, and date for sitemap generation.
 */
// services/db.ts

// ... (your existing functions like getPosts, getPendingPosts, etc.)

// --- SITEMAP UTILS (NEW) ---

/**
 * Fetches only the ID, slug, and date for sitemap generation.
 */
export const getPublishedPostSlugs = async (): Promise<{ slug: string; updatedAt?: any }[]> => {
    try {
      // We only query for published posts
      // NOTE: We rely on the existing 'db' instance imported in db.ts from ./firebase
      const querySnapshot = await db.collection(POSTS_COLLECTION)
        .where('status', '==', 'published') 
        .get();
        
      // The filtering of fields happens here, using the fetched data
      return querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              slug: data.slug || doc.id,
              updatedAt: data.updatedAt || data.createdAt
          };
      }).filter(link => link !== null);
    } catch (error) {
      console.error("Error getting post slugs for sitemap:", error);
      return [];
    }
  };