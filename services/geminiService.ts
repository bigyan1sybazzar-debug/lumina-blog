// services/geminiService.ts

import { GoogleGenAI } from "@google/genai";

// === START: Secure API Key Retrieval ===
// The key is read from the process environment variables (set in .env.local)
const API_KEY = process.env.GEMINI_API_KEY;
// === END: Secure API Key Retrieval ===

/**
 * Initializes and returns the Gemini AI client using the environment variable API key.
 * @returns {GoogleGenAI} The initialized AI client.
 * @throws {Error} If the API key is not set or is invalid.
 */
const getClient = () => {
  // Check for the key existence and minimum length (for basic validation)
  if (!API_KEY || API_KEY.length < 30) { 
    throw new Error("API Key not found or is invalid. Please set GEMINI_API_KEY in your .env.local file.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Generates a structured blog post outline using the Gemini API.
 * @param {string} topic The subject of the blog post.
 * @returns {Promise<string>} A Markdown-formatted outline.
 */
export const generateBlogOutline = async (topic: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a structured blog post outline for the topic: "${topic}". 
      Include a catchy title, 3-4 main section headers, and bullet points for key concepts in each section. 
      Format as Markdown.`,
    });
    return response.text || "Failed to generate outline.";
  } catch (error) {
    console.error("Gemini API Error (Outline):", error);
    // You might want to implement exponential backoff here in a production setting.
    return "Error generating content. Please check your API key and network connection.";
  }
};

/**
 * Generates the full blog post content based on a title and outline.
 * @param {string} title The title of the post.
 * @param {string} outline The generated outline for the post structure.
 * @returns {Promise<string>} The full, Markdown-formatted blog post content.
 */
export const generateFullPost = async (title: string, outline: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a full, engaging blog post based on this title: "${title}" and this outline:
      ${outline}
      
      Use a friendly, professional tone. Use Markdown formatting (## for headers, **bold** for emphasis). 
      Make it approximately 500-800 words.`,
    });
    return response.text || "Failed to generate post.";
  } catch (error) {
    console.error("Gemini API Error (Full Post):", error);
    // You might want to implement exponential backoff here in a production setting.
    return "Error generating post.";
  }
};