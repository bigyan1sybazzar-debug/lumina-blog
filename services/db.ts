import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, Comment } from '../types';
import { MOCK_POSTS, CATEGORIES } from '../constants';

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';

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

export const getPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const docSnap = await db.collection(POSTS_COLLECTION).doc(id).get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as BlogPost;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting post:", error);
    return null;
  }
};

export const createPost = async (post: Omit<BlogPost, 'id' | 'views' | 'likes'>) => {
  try {
    const newPostData = {
      ...post,
      views: 0,
      likes: [],
      createdAt: new Date().toISOString()
    };
    const docRef = await db.collection(POSTS_COLLECTION).add(newPostData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding post: ", error);
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

// --- UTILS ---

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
    return postsCollection.add({
      ...postData,
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