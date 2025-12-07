// src/services/geminiChat.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
if (!API_KEY) {
  console.error("Gemini API Key missing!");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// ✅ UPDATED MODEL NAME (December 2025)
const CHAT_MODEL = "gemini-2.5-flash";  // This works today!

const SYSTEM_INSTRUCTION = `
You are a friendly, expert global tech assistant. 
Specialize in smartphones, gadgets, AI, and tech trends.
Answer concisely (1–4 short paragraphs max), use bullet points and emojis when helpful.
Be conversational, fun, and direct. Never write full blog posts unless asked.
Always respond in English.
`;

let chatHistory: any[] = [
  { role: "user", parts: [{ text: "Hello!" }] },
 { role: "model", parts: [{ text: "Hey! How can I help you today?" }] }
];

export const startNewChat = () => {
  chatHistory = [];
};

export const sendChatMessage = async function* (userMessage: string) {
  if (!genAI) throw new Error("Gemini API key missing");

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  });

  chatHistory.push({ role: "user", parts: [{ text: userMessage }] });

  const result = await chat.sendMessageStream(userMessage);
  let fullResponse = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullResponse += text;
      yield text;
    }
  }

  chatHistory.push({ role: "model", parts: [{ text: fullResponse }] });
};