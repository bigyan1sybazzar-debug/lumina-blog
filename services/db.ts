// services/db.ts

import firebase from 'firebase/compat/app';
import { db } from './firebase';
import { BlogPost, Category, User, Comment, Review } from '../types';
import { MOCK_POSTS, CATEGORIES } from '../constants';

const POSTS_COLLECTION = 'posts';
const USERS_COLLECTION = 'users';
const CATEGORIES_COLLECTION = 'categories';
const COMMENTS_COLLECTION = 'comments';
const REVIEWS_COLLECTION = 'reviews';

// Helper: client-side sort (avoids Firestore composite index requirement)
const sortByDateDesc = (a: any, b: any) => {
  const dateA = new Date(a.updatedAt || a.createdAt || a.date).getTime();
  const dateB = new Date(b.updatedAt || b.createdAt || b.date).getTime();
  return dateB - dateA;
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

export const createPost = async (
  post: Omit<BlogPost, 'id' | 'slug' | 'likes' | 'views' | 'createdAt' | 'updatedAt'> & {
    status: 'published' | 'pending' | 'draft';
  }
) => {
  try {
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100); // limit length

    const newPost = {
      ...post,
      slug,
      likes: [],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(POSTS_COLLECTION).add(newPost);

    // Trigger sitemap regeneration via API if published
    if (post.status === 'published') {
      try {
        await fetch('/api/generate-sitemap', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Sitemap regeneration triggered for new published post');
      } catch (apiError) {
        console.log('Sitemap API call failed (non-critical):', apiError);
        // Still proceed with success - the post was created
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Update an existing post
export const updatePost = async (
  postId: string, 
  postData: Partial<Omit<BlogPost, 'id' | 'slug' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const updateData: Record<string, any> = {
      ...postData,
      updatedAt: new Date().toISOString(),
    };

    // If title changed, regenerate slug
    if (postData.title) {
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100);
      updateData.slug = slug;
    }

    await db.collection(POSTS_COLLECTION).doc(postId).update(updateData);

    // Check if post status changed to published
    const currentPost = await getPostById(postId);
    const isNowPublished = postData.status === 'published' || 
                          (!postData.status && currentPost?.status === 'published');
    
    // Trigger sitemap regeneration via API if post is published
    if (isNowPublished) {
      try {
        await fetch('/api/generate-sitemap', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Sitemap regeneration triggered for updated published post');
      } catch (apiError) {
        console.log('Sitemap API call failed (non-critical):', apiError);
      }
    }

    console.log(`Post ${postId} updated successfully`);
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
  try {
    // First, check if the post exists
    const post = await getPostById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const wasPublished = post.status === 'published';

    // Delete the post
    await db.collection(POSTS_COLLECTION).doc(postId).delete();

    // Delete associated comments
    const commentsSnapshot = await db.collection(COMMENTS_COLLECTION)
      .where('postId', '==', postId)
      .get();
    
    const deleteCommentsPromises = commentsSnapshot.docs.map(doc => 
      doc.ref.delete()
    );

    // Delete associated reviews
    const reviewsSnapshot = await db.collection(REVIEWS_COLLECTION)
      .where('postId', '==', postId)
      .get();
    
    const deleteReviewsPromises = reviewsSnapshot.docs.map(doc => 
      doc.ref.delete()
    );

    await Promise.all([...deleteCommentsPromises, ...deleteReviewsPromises]);

    // Trigger sitemap regeneration via API if the deleted post was published
    if (wasPublished) {
      try {
        await fetch('/api/generate-sitemap', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Sitemap regeneration triggered after deleting published post');
      } catch (apiError) {
        console.log('Sitemap API call failed (non-critical):', apiError);
      }
    }

    console.log(`Post ${postId} and associated data deleted successfully`);
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const updatePostStatus = async (postId: string, status: 'published' | 'pending' | 'draft'): Promise<void> => {
  try {
    await db.collection(POSTS_COLLECTION).doc(postId).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    // Trigger sitemap regeneration via API if status changed to published
    if (status === 'published') {
      try {
        await fetch('/api/generate-sitemap', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Sitemap regeneration triggered after status update to published');
      } catch (apiError) {
        console.log('Sitemap API call failed (non-critical):', apiError);
      }
    }

    console.log(`Post ${postId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating post status:', error);
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

export const updateUserRole = async (userId: string, role: string) => {
  // Validate the role
  const validRoles = ['user', 'moderator', 'admin'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
  }
  
  await db.collection(USERS_COLLECTION).doc(userId).update({ 
    role: role as 'user' | 'moderator' | 'admin' 
  });
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

// --- SITEMAP GENERATION (Auto-updating) ---

export const getPublishedPostSlugs = async (): Promise<{ slug: string; updatedAt: string }[]> => {
  try {
    const snapshot = await db.collection(POSTS_COLLECTION)
      .where('status', '==', 'published')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        slug: data.slug || doc.id,
        updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching slugs for sitemap:', error);
    return [];
  }
};

export const generateAndUploadSitemap = async (): Promise<string | null> => {
  try {
    const baseUrl = window.location.origin;
    const apiUrl = `${baseUrl}/api/generate-sitemap`;
    
    console.log('Calling Vercel function:', apiUrl);
    
    // Call Vercel function
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel function error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    // Download the XML
    const blob = new Blob([result.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Sitemap generated via Vercel function:', result.sitemapUrl);
    return result.sitemapUrl;
    
  } catch (error) {
    console.error('Vercel function failed, falling back to local generation:', error);
    
    // Fallback to local generation
    try {
      const snapshot = await db.collection(POSTS_COLLECTION)
        .where('status', '==', 'published')
        .get();

      const posts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          slug: data.slug || doc.id,
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
        };
      });

      const baseUrl = window.location.origin;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
  ${posts.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>
  </url>`).join('')}
</urlset>`;

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Vercel function unavailable. Sitemap downloaded locally. Upload to /public/sitemap.xml');
      return `${baseUrl}/sitemap.xml`;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return null;
    }
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
    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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