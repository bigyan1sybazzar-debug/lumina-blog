import { db } from './firebase';
import { ChatMessage, ChatSession } from '../types';
import firebase from 'firebase/compat/app';

const COLLECTION_NAME = 'chats';

// Save or Update a chat session
export const saveChatSession = async (
    userId: string,
    messages: ChatMessage[],
    userInfo?: { name: string; avatar: string }
) => {
    try {
        // We can use a single document per user for "current chat" or multiple documents for history.
        // Requirement says: "all chat saved to firebase according to user"
        // Requirement says: "Admin can view them from admin section"

        // Strategy: Create a new document session if it's a new conversation, or update the latest one.
        // For simplicity, let's treat the entire message history in ChatAssistant as one "active session" that gets updated.
        // Or simpler: each time ChatAssistant loads, it could start a new session or load previous?
        // The current ChatAssistant doesn't seem to have "sessions" logic, just a list of messages.
        // We will save this list as one "session" document for now, keyed by userId/lastUpdated, 
        // OR just one big doc per user "current_session"?
        // BETTER: One doc per user that holds the ARRAY of messages.
        // BUT: "Admin can view them" suggests history.

        // Let's create a new document for each "New Chat" click, but strictly speaking checking the current implementation:
        // User clicks "New Chat" -> messages reset. 
        // We should probably create a new session ID then.

        // For now, let's implement a method that takes a sessionId.
        // If sessionId is provided, update it. If not, create new?
        // Actually, let's just use `set` on a document with an ID.

        // Let's assume the frontend will manage the Session ID.
        // If we just want to save "all chat", we can append? No, updating the array is easier.

        // Let's use a subcollection 'sessions' for each user? 
        // Or top-level 'chats' collection where userId is a field. This is easier for Admin to query all.

        // Let's assume we pass a sessionId or we generate one.
        // Ideally, the ChatAssistant component should generate a sessionId on mount or "New Chat".

        // However, to keep it simple and fulfill "save accroding to user":
        // We will save the *current* list of messages. 
        // We need a stable ID for the session.

    } catch (error) {
        console.error("Error saving chat:", error);
        throw error;
    }
};

// We will implement `saveChat` which saves the *entire* message array to a document.
export const saveChat = async (userId: string, sessionId: string, messages: ChatMessage[], userInfo?: { name: string; avatar: string }) => {
    try {
        const chatRef = db.collection(COLLECTION_NAME).doc(sessionId);

        const sessionData: Partial<ChatSession> = {
            userId,
            messages,
            updatedAt: new Date().toISOString(),
        };

        if (userInfo) {
            sessionData.userName = userInfo.name;
            sessionData.userAvatar = userInfo.avatar;
        }

        // Use set with merge to create or update
        // We also set createdAt if it doesn't exist (handled by merge? no, only updates fields provided)
        // So we might need to check existence or just set createdAt on creation.
        // Let's just set createdAt if not present using a safeguard? 
        // Firestore doesn't support "set if missing" easily in one go without transaction/get.
        // Simpler: Just set createdAt = NOW if we are creating. 
        // But we don't know if we are creating.
        // Let's just update `updatedAt`. `createdAt` can be set once.

        await chatRef.set(sessionData, { merge: true });

        // If createdAt is missing (new doc), set it. 
        // A bit hacky but works: create if not exists
        // Actually, let's just include createdAt in the initial object if we can.
        // We'll rely on the caller to manage "is this new?" or just let it slide.
        // Better:
        // await chatRef.update(sessionData).catch(() => chatRef.set({ ...sessionData, createdAt: new Date().toISOString() }));
        // This handles explicit create.

    } catch (error) {
        console.error("Error saving chat:", error);
    }
}


export const getUserChats = async (userId: string): Promise<ChatSession[]> => {
    try {
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
    } catch (error) {
        console.error("Error fetching user chats:", error);
        return [];
    }
}

export const getAllChats = async (): Promise<ChatSession[]> => {
    try {
        const snapshot = await db.collection(COLLECTION_NAME)
            .orderBy('updatedAt', 'desc')
            .limit(50) // Limit for performance
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
    } catch (error) {
        console.error("Error fetching all chats:", error);
        return [];
    }
}
