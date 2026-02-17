import { GoogleGenAI, GenerateContentConfig, Modality } from "@google/genai";

// ————————————————————————————————————————
// INITIALIZATION
// ————————————————————————————————————————
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.AI_GATEWAY_API_KEY || (typeof Object !== 'undefined' && process.env.API_KEY) || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("❌ Gemini API Key missing! Set NEXT_PUBLIC_GEMINI_API_KEY in .env");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ————————————————————————————————————————
// TYPES & EXPORTS
// ————————————————————————————————————————
export type HumanizerMode = 'Standard' | 'Academic' | 'Blog' | 'Professional' | 'Creative';

export interface PlagiarismAnalysisResult {
    score: number;
    explanation: string;
    flagged_sentences: string[];
    humanized_text: string;
}

// ✨ UPDATED SYSTEM INSTRUCTION: No Bold, Blue Underlined Links, 13-Year-Old Friendly ✨
const SYSTEM_INSTRUCTION = `
You are an expert professional blog writer for a popular global tech magazine.
Focus on mobile phones, gadgets, AI, science, and tech trends.

STRICT FORMATTING RULES:
1. Language: English only.
2. Headers: Use ### for main sections and #### for subsections.
3. ❌ NO BOLD TEXT: Do not use **bolding** inside any paragraphs or lists. Body text must be plain.
4. ✅ BLUE UNDERLINED LINKS: Use HTML format: <a href="URL" style="color: blue; text-decoration: underline;">Anchor Text</a>.
5. Tone: Conversational, simple (13-year-old level), and 0% AI-detectable.
`;

const INTERNAL_LINKS_LIST = `
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

// ————————————————————————————————————————
// REUSABLE CONFIG BUILDER
// ————————————————————————————————————————
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

// ————————————————————————————————————————
// 1. Generate Blog Outline
// ————————————————————————————————————————
export const generateBlogOutline = async (topic: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create a detailed blog outline for: "${topic}". 
            Rules: # Title (4-5 words max), Main Sections ###, Subsections ####. ❌ NO BOLD TEXT.`,
            config: getConfig({ temperature: 0.8 }),
        });
        return response.text?.trim() || "";
    } catch (error: any) {
        throw new Error("Failed to generate outline: " + error.message);
    }
};

// ————————————————————————————————————————
// 2. Generate Full Post
// ————————————————————————————————————————
export const generateFullPost = async (title: string, outline: string): Promise<string> => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Write a 1200+ word article. Title: ${title} (4-5 words max). Outline: ${outline}.
            RULES:
            - Tone: 13-year-old level.
            - Headers: ### and ####.
            - ❌ NO BOLDING in paragraphs.
            - ✅ BLUE LINKS: Include 3 internal links from this list using <a href="URL" style="color: blue; text-decoration: underline;">Anchor Text</a> format: ${INTERNAL_LINKS_LIST}.
            - Include 8 FAQs using ### at the end.`,
            config: getConfig({ temperature: 0.9 }),
        });
        return response.text?.trim() || "";
    } catch (error: any) {
        throw new Error("Failed to generate full post: " + error.message);
    }
};

// ————————————————————————————————————————
// 3. Generate Trending News Post
// ————————————————————————————————————————
export const generateNewsPost = async (category: string = "tech") => {
    if (!ai) throw new Error("Gemini API key missing");
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Search for trending news in "${category}". Write a detailed blog post.
            Rules: # Title (4-5 words max), ###/#### headers, ❌ NO BOLD. 
            ✅ BLUE LINKS from: ${INTERNAL_LINKS_LIST}. 13-year-old friendly language.`,
            config: getConfig({ useSearch: true, temperature: 0.8 }),
        });

        const fullText = response.text?.trim() || "";
        const lines = fullText.split("\n");
        const titleLine = lines.find((l: string) => l.trim().startsWith("# "));
        let title = titleLine ? titleLine.replace(/^#+\s*/, "").trim() : `Latest Tech News`;
        title = title.split(/\s+/).slice(0, 5).join(" ");

        return { title, content: fullText, sources: null };
    } catch (error: any) {
        throw new Error("News generation failed: " + error.message);
    }
};

// ————————————————————————————————————————
// 4. Generate Blog Image
// ————————————————————————————————————————
export const generateBlogImage = async (prompt: string): Promise<string> => {
    if (!ai) return `https://picsum.photos/seed/${Date.now()}/1600/900`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ parts: [{ text: `Professional cinematic 16:9 tech blog header: ${prompt}. Photorealistic, modern.` }] }],
            config: { responseModalities: [Modality.IMAGE], imageConfig: { aspectRatio: "16:9" } } as GenerateContentConfig,
        });
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return data ? `data:image/png;base64,${data}` : `https://picsum.photos/seed/err/1600/900`;
    } catch {
        return `https://picsum.photos/seed/fallback/1600/900`;
    }
};

// ————————————————————————————————————————
// 5. AI Humanizer
// ————————————————————————————————————————
export const analyzeAndHumanize = async (text: string, mode: HumanizerMode = 'Standard'): Promise<PlagiarismAnalysisResult> => {
    if (!ai) throw new Error("Gemini API key missing");

    let stylePrompt = "";
    switch (mode) {
        case 'Academic': stylePrompt = "Formal, authoritative, no contractions."; break;
        case 'Blog': stylePrompt = "Punchy, use 'I/You', conversational, very bursty."; break;
        case 'Professional': stylePrompt = "Polished, clear, corporate but natural."; break;
        case 'Creative': stylePrompt = "Evocative, narrative, varied rhythm."; break;
        default: stylePrompt = "Natural, confident, industry expert tone."; break;
    }

    const prompt = `Rewrite the following text to achieve 0% AI detection. 
    Mode: ${mode}. Instructions: ${stylePrompt}.
    Rules: ❌ NO BOLDING. Keep HTML links if present. Mix short and long sentences. 
    Ban words: 'Moreover', 'Furthermore', 'Tapestry', 'In conclusion'.
    
    Text to rewrite: "${text}"

    Return ONLY raw JSON:
    {
        "score": number,
        "flagged_sentences": [],
        "humanized_text": "...",
        "explanation": "..."
    }`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 1.4,
                topP: 0.99
            },
        });
        return JSON.parse(response.text?.trim() || "{}") as PlagiarismAnalysisResult;
    } catch (error: any) {
        throw new Error("Failed to humanize text: " + error.message);
    }
};

export default {
    generateBlogOutline,
    generateFullPost,
    generateNewsPost,
    generateBlogImage,
    analyzeAndHumanize,
};