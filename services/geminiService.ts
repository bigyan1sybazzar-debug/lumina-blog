// services/geminiService.ts

// 🚨 FIX 1: Change the import statement to the supported package
import { GoogleGenerativeAI } from "@google/generative-ai"; 

// Read API key correctly in Vite (must start with VITE_)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

let genAI: GoogleGenerativeAI | null = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.error("❌ VITE_GEMINI_API_KEY is missing. Please add it to .env.local");
}

const getModel = () => {
  if (!genAI) {
    throw new Error("API Key is missing or invalid. Check your .env.local file and restart the server.");
  }
  
  // 🚨 FIX 2: Use the current recommended stable model name
  const MODEL_NAME = "gemini-2.5-flash"; 

  return genAI.getGenerativeModel({ model: MODEL_NAME });
};

/**
 * Generate a blog post outline using Gemini
 */
export const generateBlogOutline = async (topic: string): Promise<string> => {
  try {
    const model = getModel();

    const prompt = `Create a detailed and engaging blog post outline for the topic: "${topic}"

Requirements:
- Give a catchy, SEO-friendly title
- Include a short introduction
- Create 5–7 main sections with H2 headers (##)
- Add 3–5 bullet points under each section
- End with a conclusion section

Return the result in clean Markdown format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error (Outline):", error);
    return `Error: ${error.message || "Failed to generate outline. Check console for details."}`;
  }
};

/**
 * Generate full blog post from title + outline
 */
export const generateFullPost = async (title: string, outline: string): Promise<string> => {
  try {
    const model = getModel();

    const prompt = `Write a complete, high-quality blog post based on this title and outline:

Title: ${title}

Outline:
${outline}

Instructions:
- Write in a friendly, professional, and engaging tone
- Target 800–1200 words
- Use proper Markdown formatting (##, ###, **bold**, *italic*, lists, etc.)
- Make it natural and readable
- Add a strong introduction and conclusion
- Include transitions between sections

Return only the final blog post in Markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error (Full Post):", error);
    return `Error: ${error.message || "Failed to generate full post. Check console for details."}`;
  }
};
