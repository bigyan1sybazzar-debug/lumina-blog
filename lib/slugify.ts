// lib/slugify.ts

/**
 * Converts a string into a URL-friendly slug (e.g., "NPL Live Match" -> "npl-live-match").
 */
export const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Removes all non-word characters (emojis, punctuation, etc.)
      .replace(/[\s_-]+/g, '-')  // Replaces all spaces/underscores with a single hyphen
      .replace(/^-+|-+$/g, '');  // Removes leading or trailing hyphens
  };