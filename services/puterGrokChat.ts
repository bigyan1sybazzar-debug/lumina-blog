// src/services/puterGrokChat.ts

// Updated global declaration to reflect potential Promise<Object> return and to use Signal
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: {
          model?: string;
          stream?: boolean;
          temperature?: number;
          maxTokens?: number;
          signal?: AbortSignal; // Added for forward compatibility and internal usage
        }) => Promise<string | { message: { content: string } }>;
      };
    };
  }
}

if (!window.puter) {
  console.warn('Puter.js not loaded—add <script src="https://js.puter.com/v2/"></script> to index.html');
}

// Concise system instruction
const SYSTEM_INSTRUCTION = `You are a friendly, expert global tech assistant. Specialize in smartphones, gadgets, AI, and tech trends. Answer concisely (1–4 short paragraphs max), use bullet points and emojis when helpful. Be conversational, fun, and direct. Never write full blog posts unless explicitly asked. Always respond in English.`;

// History as array for building prompts
let chatHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
  { role: 'system', content: SYSTEM_INSTRUCTION }
];

export const startNewChat = () => {
  chatHistory = [{ role: 'system', content: SYSTEM_INSTRUCTION }];
};

/**
 * Sends a message to the Puter Grok chat API and yields the response in chunks 
 * by simulating streaming (since the underlying Puter API call is synchronous).
 * * @param userMessage The message content from the user.
 * @param signal Optional AbortSignal to stop the fake streaming process.
 */
export const sendChatMessage = async function* (userMessage: string, signal?: AbortSignal) {
  // Corrected the 'throw new new Error' syntax error
  if (!window.puter?.ai) throw new Error("Puter.js not loaded—wait for script!");

  // Add user message to history
  chatHistory.push({ role: 'user', content: userMessage });

  // Limit history to prevent token overflow (last 10 messages + system)
  if (chatHistory.length > 11) {
    chatHistory = [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...chatHistory.slice(-10)];
  }

  // Build string prompt from history
  const historyPrompt = chatHistory
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n');

  const fullPrompt = `${historyPrompt}\n\nASSISTANT:`; // Ends with prompt for response

  let fullResponse = '';
  try {
    // Call Puter API (still using stream: false)
    const result = await window.puter.ai.chat(fullPrompt, {
      model: 'x-ai/grok-4.1-fast', // Grok model
      stream: false, // Full response (as per existing implementation)
      temperature: 0.8,
      maxTokens: 1024,
      signal: signal 
    });

    console.log('Full Puter response:', result);

    // Handle both response formats (string or object)
    fullResponse = typeof result === 'string' ? result : result?.message?.content || '';

    if (!fullResponse) {
      throw new Error(`Empty response from Puter. Check console for full result. Common: model limits or long prompt.`);
    }

    // "Fake" streaming: Yield word-by-word, checking the signal in the loop
    // Splits by whitespace but keeps the whitespace for accurate content rendering
    const chunks = fullResponse.split(/(\s+)/); 
    for (const chunk of chunks) {
      if (signal?.aborted) {
        // Stop yielding chunks if the request was aborted (Stop button clicked)
        break; 
      }
      yield chunk; // Yield the word or the space
    }

  } catch (error: any) {
    // Handle the AbortError from the component gracefully
    if (signal?.aborted) {
        console.log('Chat stream aborted by user (fake streaming stop).');
        return; 
    }
    
    console.error('Puter error:', error);
    throw new Error(`Chat failed: ${error.message}. Try a shorter message or model 'gpt-4o-mini'.`);
  }

  // Add assistant response to history only if not aborted
  if (!signal?.aborted) {
    chatHistory.push({ role: 'assistant', content: fullResponse });
  }
};

// Export for use
export default { startNewChat, sendChatMessage };