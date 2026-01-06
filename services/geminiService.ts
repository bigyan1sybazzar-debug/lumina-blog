// services/geminiService.ts
import { GoogleGenAI, GenerateContentConfig, Modality } from "@google/genai";

// ————————————————————————————————————————
// INITIALIZATION
// ————————————————————————————————————————
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.AI_GATEWAY_API_KEY || (typeof Object !== 'undefined' && process.env.API_KEY) || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("❌ Gemini API Key missing! Set NEXT_PUBLIC_GEMINI_API_KEY in .env");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ✨ UPDATED SYSTEM INSTRUCTION: Global Focus, English Only, Enforced H3/H4 Format ✨
const SYSTEM_INSTRUCTION = `
You are an expert professional blog writer for a popular global tech and gadget magazine.
Focus primarily on the **latest mobile phones, gadgets, AI, science, and technology trends**.
Writing style: engaging, conversational, informative, SEO-optimized, and human-like.
**All output must be in English.**
Always use proper Markdown formatting: #, ##, **bold**, lists, tables, code blocks where relevant. **Crucially, use H3 (###) for all main sections and H4 (####) for all subsections** to structure the content like a professional, scannable online article.
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
            // ✨ ENHANCED PROMPT: Strict H3/H4 Enforcement in Outline ✨
            contents: `Create a detailed, SEO-friendly blog post outline for the topic: "${topic}". Focus on global mobile phones and gadgets.
      
      Structure (Strict Article Format):
      - Start with a catchy # Title (MUST BE 4-5 WORDS MAX)
      - Engaging Introduction hook
      - **3–4 Main Sections (Use ###)**
      - **Subsections (Use ####) with 4–6 bullet points each**
      - Strong Conclusion with CTA
      
      Make it detailed and ready for full article expansion. **The output must be in English and use ### and #### for section headers.**`,

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
            // ✨ ENHANCED PROMPT: Strict H3/H4 Enforcement in Full Post ✨
            contents: `Write a full, original, and engaging blog post in a modern global tech style.

      Title: ${title} (MUST BE 4-5 WORDS MAX)
      
      Outline:
      ${outline}
      
      Requirements (Strict Article Format):
      - 800–1500 words
      - Natural, conversational **English** tone.
      - Focus on global availability, specs, and trends.
      - **COMPULSORY: Use ### for main sections and #### for subsections.** Use bullet points, bold highlights, and emojis where natural.
      - **COMPULSORY: Write FULL, DETAILED paragraphs (minimum 4-5 sentences per paragraph). Avoid short summaries.**
      - Include real-world examples, global specs, and **USD/EUR pricing** when relevant.
      - Add 1–2 comparison tables if reviewing products.
      - End with FAQs section and CTA.
      - make sure to make 2 -3 internal backlinks from (https://bigyann.com.np/lg-ultrafine-evo-32u990a-s-review
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
)
      - **STRICTLY use proper, well-structured Markdown to format the output like a professional article, with clear separation (e.g., using horizontal lines if desired, or just strong headers/whitespace).** The entire post MUST be in English.`,

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
        // ✨ ENHANCED PROMPT: Strict H3/H4 Enforcement in News Post and Type Fix ✨
        const prompt = `Search for the most trending or breaking **global** news story in the last 24–48 hours related to "**${category}**".

    Then write a fresh, original blog post in a modern global tech blog style.

    Output Format (Strict Article Format):
    # Catchy Title (MUST BE 4-5 WORDS MAX)

    [Full article in Markdown]
    - Engaging intro setting global context
    - **COMPULSORY: Use ### for main sections and #### for subsections.**
    - **COMPULSORY: Write FULL, DETAILED paragraphs (minimum 4-5 sentences). Avoid short or skimpy text.**
    - Key details, quotes, implications
    - Why this matters to global tech consumers
    - Use tables for specs/pricing if applicable (in USD/EUR)
    - Include a FAQ section (using ###) at the end
    - No "Sources" section — weave credibility naturally
 - make sure to make 2 -3 internal backlinks from (https://bigyann.com.np/lg-ultrafine-evo-32u990a-s-review
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
)
    Tone: Excited, trustworthy, youth-friendly. **The entire post MUST be in English and formatted like a highly structured article and should be understand by 13 years old also.**`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: getConfig({ useSearch: true, temperature: 0.7 }),
        });

        const fullText = response.text?.trim() || "";
        const lines = fullText.split("\n");
        // FIX TS7006: Added explicit type annotation (l: string)
        const titleLine = lines.find((l: string) => l.trim().startsWith("# "));
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

// ————————————————————————————————————————
// 5. AI Humanizer & Plagiarism Checking (Gemini-Based)
// ————————————————————————————————————————

export interface PlagiarismAnalysisResult {
    score: number;
    explanation: string;
    flagged_sentences: string[];
    humanized_text: string;
}


export type HumanizerMode = 'Standard' | 'Academic' | 'Blog' | 'Professional' | 'Creative';

export const analyzeAndHumanize = async (text: string, mode: HumanizerMode = 'Standard'): Promise<PlagiarismAnalysisResult> => {
    if (!ai) throw new Error("Gemini API key missing");

    try {
        let systemRole = "GHOSTWRITER & ELITE EDITOR";
        let styleInstructions = "";

        switch (mode) {
            case 'Academic':
                systemRole = "ACADEMIC RESEARCHER & JOURNAL EDITOR";
                styleInstructions = `
                - **Tone**: Formal, objective, authoritative, and nuanced.
                - **Structure**: Logical flow, clear argumentation, academic vocabulary (without sounding robotic).
                - **Check**: Avoid contractions (don't, can't) and colloquialisms. Use passive voice only where appropriate for objectivity.
                - **Focus**: Rigour, clarity, and depth.
                `;
                break;
            case 'Blog':
                systemRole = "EXPERT BLOGGER & SEO SPECIALIST";
                styleInstructions = `
                - **Tone**: Conversational, engaging, punchy, and opinionated.
                - **Structure**: Short paragraphs, use of "I" or "You", rhetorical questions.
                - **Check**: High burstiness, use idioms, contractions, and active voice.
                - **Focus**: Reader engagement, skimmability, and "hooking" the reader.
                `;
                break;
            case 'Professional':
                systemRole = "CORPORATE COMMUNICATIONS DIRECTOR";
                styleInstructions = `
                - **Tone**: Polished, concise, respectful, and clear.
                - **Structure**: Direct and action-oriented.
                - **Check**: Avoid jargon where possible, ensure professional courtesy.
                `;
                break;
            case 'Creative':
                systemRole = "BESTSELLING NOVELIST";
                styleInstructions = `
                - **Tone**: Narrative, descriptive, evocative.
                - **Structure**: Show don't tell, varied sentence rhythm, sensory details.
                `;
                break;
            default: // Standard
                systemRole = "VETERAN INDUSTRY EXPERT";
                styleInstructions = `
                - **Tone**: Natural, confident, and authenticated.
                - **Structure**: Varied sentence lengths, mix of simple and complex ideas.
                `;
                break;
        }

        const prompt = `
        SYSTEM ROLE: ${systemRole}
        
        You are a world-class ghostwriter and anti-detection specialist. Your SINGLE GOAL is to rewrite the input text to be **indistinguishable from human writing**, achieving a **0% AI probability score**.

        Input Text:
        "${text}"

        🔹 TASK:
        1. Rewrite (Humanize) the text completely matching the **${mode}** style.
        2. **STRATEGIC EVASION (CRITICAL)**:
           - ❌ **NO PREDICTABLE PATTERNS**: Do NOT use the standard "Intro -> Point -> Conclusion" paragraph structure. Start sentences in the middle of the action.
           - ❌ **BANNNED WORDS**: "Moreover", "Furthermore", "In conclusion", "It is important to note", "In the modern era", "Delve into", "Landscape of", "realm of", "tapestry", "symphony".
           - ✅ **EXTREME BURSTINESS**: Mix 2-word sentences with 40-word sentences. Be erratic.
           - ✅ **IMPERFECTIONS**: If the mode allows (Blog/Standard), use sentence fragments or conversational fillers to break robotic syntax.
           - ✅ **Apply Specific Style Rules**:
             ${styleInstructions}

        3. Provide an estimate AI score and explain your "humanization" choices.

        🔹 OUTPUT FORMAT (MANDATORY JSON):
        You MUST return the result in the following JSON format ONLY (no markdown code blocks, just raw JSON):
        {
            "score": number, // Estimated AI probability (0-100)
            "flagged_sentences": ["sentence 1", "sentence 2"],
            "humanized_text": "THE FULL REWRITTEN HUMAN-LIKE TEXT GOES HERE...",
            "explanation": "Brief explanation of what was changed to lower AI detection."
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // EXTREME Temperature for maximum variance.
                // 1.35 introduces significant randomness to break AI watermarks.
                temperature: 1.35,
                topP: 0.99,
                topK: 60,
            },
        });


        const resultText = response.text?.trim() || "{}";
        const result = JSON.parse(resultText) as PlagiarismAnalysisResult;

        return result;
    } catch (error: any) {
        console.error("Gemini API Error (Humanizer):", error.message);
        throw new Error("Failed to analyze text: " + error.message);
    }
};

export default {
    generateBlogOutline,
    generateFullPost,
    generateNewsPost,
    generateBlogImage,
    analyzeAndHumanize,
};