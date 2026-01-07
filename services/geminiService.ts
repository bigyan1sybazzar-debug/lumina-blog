import { GoogleGenAI, GenerateContentConfig, Modality } from "@google/genai";

// ————————————————————————————————————————
// INITIALIZATION
// ————————————————————————————————————————
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.AI_GATEWAY_API_KEY || (typeof Object !== 'undefined' && process.env.API_KEY) || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("❌ Gemini API Key missing! Set NEXT_PUBLIC_GEMINI_API_KEY in .env");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ✨ UPDATED SYSTEM INSTRUCTION: No bold in paragraphs, Blue Underlined Links ✨
const SYSTEM_INSTRUCTION = `
You are an expert professional blog writer for a popular global tech and gadget magazine.
Focus primarily on the **latest mobile phones, gadgets, AI, science, and technology trends**.
Writing style: engaging, conversational, human-like, and easy for a 13-year-old to understand.

**STRICT FORMATTING RULES:**
1. All output must be in English.
2. Use H3 (###) for main sections and H4 (####) for subsections.
3. ❌ **NO BOLD TEXT** inside paragraphs. Use plain text only for the body of paragraphs.
4. ✅ **INTERNAL LINKS**: For links, use the format: <a href="URL" style="color: blue; text-decoration: underline;">Anchor Text</a>.
5. Use bullet points and tables where relevant, but do not use bolding within them.
`;

const INTERNAL_LINKS = `
https://bigyann.com.np/lg-ultrafine-evo-32u990a-s-review
https://bigyann.com.np/ipad-pro-m4-price-in-nepal
https://bigyann.com.np/trifold-durability-questioned
https://bigyann.com.np/poco-x7-pro-price-in-nepal
https://bigyann.com.np/ios-26-nepal-release-date
https://bigyann.com.np/galaxy-tab-s11-nepal-whats-next
https://bigyann.com.np/ps5-nepal-price-what-to-know
https://bigyann.com.np/vivo-x300-pro-nepal-price
https://bigyann.com.np/oneplus-pad-go-2-whats-next
https://bigyann.com.np/apples-foldable-iphone-future
https://bigyann.com.np/s26-ultra-strategic-launch-shift
https://bigyann.com.np/xiaomi-pad-8-simple-global-power
https://bigyann.com.np/second-hand-iphone-in-nepal
https://bigyann.com.np/yono-tv-npl-live-streaming
https://bigyann.com.np/samsung-s24-ultra-price-in-nepal-things-you-should-know-before-purchasing
https://bigyann.com.np/yono-tv-npl-live-stream
https://bigyann.com.np/future-mobile-tech-whats-next
https://bigyann.com.np/samsung-galaxy-s23-vs-s23-ultra
https://bigyann.com.np/price-of-samsung-m17-5g-in-nepal
https://bigyann.com.np/openai-acquires-neptune-ai-a-strategic-move-to-turbocharge-frontier-ai-research
https://bigyann.com.np/ncell-number-owner-name-find-your-s
https://bigyann.com.np/global-ai-race-ignites-chip
https://bigyann.com.np/asteroid-unlocks-life-s-sweet-secret
https://bigyann.com.np/nepal-s-tech-innovators-take-on-asia-a-leap-towards-global-recognition-at-apicta-awards-2025
https://bigyann.com.np/peering-deeper-into-the-cosmos-new-optics-breakthrough-supercharges-gravitational-wave-astronomy
https://bigyann.com.np/nepals-biometric-tech-explained
https://bigyann.com.np/oneplus-12-nepal-price-revealed
https://bigyann.com.np/cosmic-web-giant-spin-revealed
https://bigyann.com.np/iphone-15-pro-max-price-in-nepal-can-we-afford-it
https://bigyann.com.np/quantum-leap-at-room-temperature-scientists-unlock-a-new-era-for-tech
https://bigyann.com.np/samsung-a55-price-in-nepal
https://bigyann.com.np/nepal-s-digital-crossroads-a-wake-up-call-for-ai-security-and-infrastructure
https://bigyann.com.np/samsung-galaxy-a24-price-in-nepal
https://bigyann.com.np/redmi-note-14-pro-price-in-nepal-unveiling-the-anticipated-costs-ultimate-value
https://bigyann.com.np/gemini-levels-up-unpacking-the-latest-breakthroughs
https://bigyann.com.np/npl-live-watch-every-updates
https://bigyann.com.np/redmi-note-14-pro-price-in-canada
https://bigyann.com.np/find-affordable-washing-machine-prices-in-nepal-2024
https://bigyann.com.np/oneplus-15r-gen-5-arrives
https://bigyann.com.np/how-to-monetize-facebook-in-nepal
https://bigyann.com.np/eu-probes-meta-s-ai-dominance
https://bigyann.com.np/yosintv-live-watch-online-streams
https://bigyann.com.np/dream11-s-global-app-pivot
https://bigyann.com.np/demystifying-data-science-in-nepal
https://bigyann.com.np/the-unseen-thirst-why-ai-s-future-is-fueling-a-nuclear-renaissance
https://bigyann.com.np/samsung-galaxy-z-trifold
https://bigyann.com.np/samsung-a35-nepal-price
https://bigyann.com.np/the-ultimate-nepali-tech-dream-iphone-17-pro-max-price-predictions
https://bigyann.com.np/motorola-edge-70-first-look
https://bigyann.com.np/nepal-s-digital-leap-new-policies-unveiled
https://bigyann.com.np/nepal-s-tech-innovators-take-center-stage-three-nepali-companies-vying-for-apicta-awards-2025-glory-
https://bigyann.com.np/foldable-future-samsung-s-trifold-arrives
https://bigyann.com.np/unpacking-npls-in-nepal
https://bigyann.com.np/xiaomi-15-ultra-nepal-price-outlook
https://bigyann.com.np/how-to-buy-chatgpt-plus-in-nepal
https://bigyann.com.np/smartphone-prices-about-to-rise
https://bigyann.com.np/nepal-shines-on-the-global-tech-stage-three-nepali-innovators-head-to-apicta-awards-2025
https://bigyann.com.np/3i-atlas-unveiling-the-universe-s-secrets
https://bigyann.com.np/openai-bolsters-ai-research-arsenal-with-strategic-neptune-ai-acquisition-what-it-means-for-the-futu
https://bigyann.com.np/instagram-control-deactivate-delete-disappear
https://bigyann.com.np/google-s-gemini-ai-images-saree-go-viral-in-nepal
https://bigyann.com.np/china-s-first-reusable-rocket-explodes-a-fiery-lesson-in-the-new-space-race
https://bigyann.com.np/how-to-make-ai-monkey-videos
https://bigyann.com.np/bridging-the-ai-divide-new-research-reveals-generational-and-geographic-gaps-in-adoption-and-well-be
https://bigyann.com.np/the-looming-shadow-how-satellite-megaconstellations-threaten-our-view-of-the-cosmos
https://bigyann.com.np/nepal-s-5g-era-dawns-kathmandu-pokhara-first
https://bigyann.com.np/vivo-v40-pro-nepal-price-specs
https://bigyann.com.np/samsung-tri-fold-unfolding-the-future
https://bigyann.com.np/does-amazon-ship-to-nepal
https://bigyann.com.np/quantum-leap-for-laptops
https://bigyann.com.np/galaxy-tab-a11-nepal-price
https://bigyann.com.np/m5-mac-mini-value-king
`;

const getConfig = (options: { useSearch?: boolean; temperature?: number } = {}): GenerateContentConfig => {
    const { useSearch = false, temperature = 0.8 } = options;
    const config: GenerateContentConfig = {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature,
    };
    if (useSearch) {
        config.tools = [{ googleSearch: {} }];
    }
    return config;
};

// 1. Generate Blog Post Outline
export const generateBlogOutline = async (topic: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a detailed outline for: "${topic}". 
            - Title: # 4-5 words max.
            - Sections: Use ### and ####. 
            - NO BOLD in paragraphs.`,
            config: getConfig({ temperature: 0.8 }),
        });
        return response.text?.trim() || "";
    } catch (error: any) {
        throw new Error("Outline generation failed: " + error.message);
    }
};

// 2. Generate Full Blog Post
export const generateFullPost = async (title: string, outline: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a full 1200+ word blog post.
      Title: ${title} (4-5 words max).
      Outline: ${outline}
      
      RULES:
      - ❌ **ABSOLUTELY NO BOLD TEXT** inside any paragraphs.
      - ❌ **NO ROBOTIC PHRASES** (e.g., "In conclusion", "Moreover").
      - ✅ **BLUE UNDERLINED LINKS**: Insert 3 links from this list using <a href="URL" style="color: blue; text-decoration: underline;">Anchor Text</a>:
      ${INTERNAL_LINKS}
      - Write for a 13-year-old audience. 
      - Include 8 FAQs at the end using ###. 
      - Goal: 0% AI detection through high burstiness and human-like flow.`,
            config: getConfig({ temperature: 0.9 }),
        });
        return response.text?.trim() || "";
    } catch (error: any) {
        throw new Error("Post generation failed: " + error.message);
    }
};

// 3. Generate Trending News Post
export const generateNewsPost = async (category: string = "tech") => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find breaking news in "${category}". Write a full article.
            - Title: # 4-5 words max.
            - Use ### and ####. 
            - ❌ **NO BOLD** in paragraphs.
            - ✅ **BLUE UNDERLINED LINKS**: Insert 2 relevant links:
            ${INTERNAL_LINKS}
            - Include 8 FAQs.`,
            config: getConfig({ useSearch: true, temperature: 0.8 }),
        });
        const fullText = response.text?.trim() || "";
        return { title: "Latest News", content: fullText, sources: null };
    } catch (error: any) {
        throw new Error("News failed: " + error.message);
    }
};

// 4. Generate Blog Header Image
export const generateBlogImage = async (prompt: string): Promise<string> => {
    if (!ai) return `https://picsum.photos/seed/${Date.now()}/1600/900`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ parts: [{ text: `Cinematic tech 16:9 header: ${prompt}. Photorealistic.` }] }],
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: { aspectRatio: "16:9" },
            } as GenerateContentConfig,
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data ? `data:image/png;base64,${data}` : `https://picsum.photos/seed/err/1600/900`;
    } catch {
        return `https://picsum.photos/seed/fallback/1600/900`;
    }
};

// 5. AI Humanizer (0% AI Target)
export interface PlagiarismAnalysisResult {
    score: number;
    explanation: string;
    flagged_sentences: string[];
    humanized_text: string;
}

export const analyzeAndHumanize = async (text: string, mode: string = 'Blog'): Promise<PlagiarismAnalysisResult> => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const prompt = `
        TASK: Rewrite this text to bypass all AI detectors (Target: 0% AI score).
        Input: "${text}"
        
        HUMANIZATION STRATEGY:
        1. **Vary sentence length** drastically (4 words followed by 30 words).
        2. **Use human imperfections**: Sentence fragments, conversational transitions.
        3. **Strictly remove all bold text** from the output.
        4. **Remove forbidden AI words**: "unlock", "delve", "tapestry", "moreover".
        5. **Link Style**: Ensure links remain <a href="..." style="color: blue; text-decoration: underline;">Text</a>.

        RETURN JSON:
        {
            "score": 0,
            "flagged_sentences": [],
            "humanized_text": "REWRITTEN TEXT HERE",
            "explanation": "Removed robotic patterns and bolding."
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 1.4, // High temperature for maximum human-like variance
            },
        });
        return JSON.parse(response.text?.trim() || "{}") as PlagiarismAnalysisResult;
    } catch (error: any) {
        throw new Error("Humanizer failed.");
    }
};

export default {
    generateBlogOutline,
    generateFullPost,
    generateNewsPost,
    generateBlogImage,
    analyzeAndHumanize,
};