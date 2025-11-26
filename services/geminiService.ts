import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

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
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check your API key.";
  }
};

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
    console.error("Gemini API Error:", error);
    return "Error generating post.";
  }
};
