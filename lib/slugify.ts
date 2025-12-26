// lib/slugify.ts

/**
 * Converts a string (like a post title) into a URL-safe, hyphen-separated slug.
 * * @param text The input string, typically the title of the blog post.
 * @returns A clean, lowercase, hyphen-separated string, limited to 100 characters.
 */
export const slugify = (text: string): string => {
    return text
      .toLowerCase()
      // 1. Replace non-alphanumeric characters (except spaces/hyphens) with a hyphen
      .replace(/[^a-z0-9\s-]/g, '')
      // 2. Replace multiple spaces/hyphens with a single hyphen
      .replace(/[\s-]+/g, '-')
      // 3. Trim leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // 4. Limit the length
      .substring(0, 100); 
  };