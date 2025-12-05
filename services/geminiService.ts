// services/geminiService.ts
import { GoogleGenAI, GenerateContentConfig, Modality } from "@google/genai";

// ————————————————————————————————————————
// INITIALIZATION
// ————————————————————————————————————————
const API_KEY = typeof import.meta !== 'undefined' 
  ? import.meta.env.VITE_GEMINI_API_KEY 
  : process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ Gemini API Key missing! Set VITE_GEMINI_API_KEY in .env or API_KEY");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ✨ UPDATED SYSTEM INSTRUCTION: Global Focus, English Only, Article Formatting ✨
const SYSTEM_INSTRUCTION = `
You are an expert professional blog writer for a popular global tech and gadget magazine.
Focus primarily on the **latest mobile phones, gadgets, AI, science, and technology trends**.
Writing style: engaging, conversational, informative, SEO-optimized, and human-like.
**All output must be in English.**
Always use proper Markdown formatting: #, ##, **bold**, lists, tables, code blocks where relevant, structured like a professional online article.
`;

// ————————————————————————————————————————
// REUSABLE CONFIG BUILDER
// ————————————————————————————————————————
const getConfig = (options: { useSearch?: boolean; temperature?: number } = {}): GenerateContentConfig => {
  const { useSearch = false, temperature = 0.7 } = options;

  const config: GenerateContentConfig = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature,
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  return config;
};

// ————————————————————————————————————————
// 1. Generate Blog Post Outline
// ————————————————————————————————————————
export const generateBlogOutline = async (topic: string): Promise<string> => {
  if (!ai) throw new Error("Gemini API key missing");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // ✨ UPDATED PROMPT: Global Focus, 4-5 Word Title Max, Article Format ✨
      contents: `Create a detailed, SEO-friendly blog post outline for the topic: "${topic}". Focus on global mobile phones and gadgets.
      
      Structure (Article Format):
      - Start with a catchy # Title (MUST BE 4-5 WORDS MAX)
      - Engaging Introduction hook
      - 3–4 Main Sections (##) with 4–6 bullet points each
      - Strong Conclusion with CTA
      
      Make it detailed and ready for full article expansion. **Ensure the entire output is in English and formatted for an article.**`,

      config: getConfig({ temperature: 0.8 }),
    });

    return response.text?.trim() || "Failed to generate outline.";
  } catch (error: any) {
    console.error("Gemini API Error (Outline):", error.message);
    throw new Error("Failed to generate blog outline: " + error.message);
  }
};

// ————————————————————————————————————————
// 2. Generate Full Blog Post from Title + Outline
// ————————————————————————————————————————
export const generateFullPost = async (title: string, outline: string): Promise<string> => {
  if (!ai) throw new Error("Gemini API key missing");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // ✨ UPDATED PROMPT: Global Focus, English Only, Article Format ✨
      contents: `Write a full, original, and engaging blog post in a modern global tech style.

      Title: ${title} (MUST BE 4-5 WORDS MAX)
      
      Outline:
      ${outline}
      
      Requirements (Article Format):
      - 900–1400 words
      - Natural, conversational **English** tone.
      - Focus on global availability, specs, and trends.
      - Use ## headers, bullet points, bold highlights, emojis where natural.
      - Include real-world examples, global specs, and **USD/EUR pricing** when relevant.
      - Add 1–2 comparison tables if reviewing products.
      - End with FAQs section and CTA.
      - **Strictly use proper Markdown to format the output like a professional article, with clear separation between sections.** The entire post MUST be in English.`,

      config: getConfig({ temperature: 0.7 }),
    });

    return response.text?.trim() || "Failed to generate full post.";
  } catch (error: any) {
    console.error("Gemini API Error (Full Post):", error.message);
    throw new Error("Failed to generate full post: " + error.message);
  }
};

// ————————————————————————————————————————
// 3. Generate Trending News Post (Global Focus)
// ————————————————————————————————————————
export const generateNewsPost = async (category: string = "latest global mobile phones and gadgets") => {
  if (!ai) throw new Error("Gemini API key missing");

  try {
    // ✨ UPDATED PROMPT: Global Focus, English Only, 4-5 Word Title Max, Article Format ✨
    const prompt = `Search for the most trending or breaking **global** news story in the last 24–48 hours related to "**${category}**".

    Then write a fresh, original blog post in a modern global tech blog style.

    Output Format (strict article format):
    # Catchy Title (MUST BE 4-5 WORDS MAX)

    [Full article in Markdown]
    - Engaging intro setting global context
    - Key details, quotes, implications
    - Why this matters to global tech consumers
    - Use tables for specs/pricing if applicable (in USD/EUR)
    - Include a FAQ section at the end
    - No "Sources" section — weave credibility naturally

    Tone: Excited, trustworthy, youth-friendly. **The entire post MUST be in English and formatted like an article.**`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: getConfig({ useSearch: true, temperature: 0.7 }),
    });

    const fullText = response.text?.trim() || "";
    const lines = fullText.split("\n");
    const titleLine = lines.find(l => l.trim().startsWith("# "));
    let title = titleLine ? titleLine.replace(/^#+\s*/, "").trim() : `Latest Global Tech News`;
    
    // Simple truncation to reinforce the title limit
    const titleWords = title.split(/\s+/).slice(0, 5);
    title = titleWords.join(" ");

    // Extract sources from grounding
    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) sources.push(chunk.web.uri);
    });

    return {
      title,
      content: fullText,
      sources: sources.length > 0 ? sources : null,
    };
  } catch (error: any) {
    console.error("Gemini API Error (News Post):", error.message);
    throw new Error("News generation failed: " + error.message);
  }
};

// ————————————————————————————————————————
// 4. Generate Blog Header Image (16:9, Photorealistic)
// ————————————————————————————————————————
export const generateBlogImage = async (prompt: string): Promise<string> => {
  if (!ai) {
    console.warn("API key missing → using placeholder image");
    return `https://picsum.photos/seed/${Date.now()}/1600/900`;
  }

  try {
    // ✨ UPDATED PROMPT: Global Tech Focus, Removed Nepal Elements ✨
    const imagePrompt = `Professional cinematic 16:9 blog header image: ${prompt}. Photorealistic, vibrant, modern tech aesthetic. Focus on global, cutting-edge technology, sleek gadgets, or abstract AI concepts. No text, no people’s faces blurred. High detail, dramatic lighting.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{
        parts: [{ text: imagePrompt }]
      }],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio: "16:9" },
      } as GenerateContentConfig,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        return `data:${mime};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated");
  } catch (error: any) {
    console.warn("AI image failed → fallback to placeholder", error.message);

    const seed = encodeURIComponent(prompt.slice(0, 60));
    return `https://picsum.photos/seed/${seed}/1600/900`;
  }
};

export default {
  generateBlogOutline,
  generateFullPost,
  generateNewsPost,
  generateBlogImage,
};