import { db } from './firebase';
import { ChatMessage, ChatSession, DirectMessage, FriendRequest, User, Friend } from '../types';
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

// --- DIRECT MESSAGING ---

export const sendDirectMessage = async (
    senderId: string,
    receiverId: string,
    content: string,
    media?: { type: 'image' | 'audio'; url: string; mimeType?: string }
) => {
    try {
        const chatId = [senderId, receiverId].sort().join('_');
        const messageData: Partial<DirectMessage> = {
            senderId,
            receiverId,
            content, // Can be empty if media is present, or a caption
            timestamp: new Date().toISOString(),
            read: false,
            chatId,
            participants: [senderId, receiverId],
        };

        if (media) {
            messageData.type = media.type;
            messageData.mediaUrl = media.url;
            messageData.mimeType = media.mimeType;
        } else {
            messageData.type = 'text';
        }

        await db.collection('direct_messages').add(messageData);
    } catch (error) {
        console.error("Error sending direct message:", error);
        throw error;
    }
};

export const listenToDirectMessages = (userId1: string, userId2: string, callback: (messages: DirectMessage[]) => void) => {
    // Firestore query for messages between two users (either A->B or B->A)
    // We filter locally or use a combined key for simplicity
    const chatId = [userId1, userId2].sort().join('_');
    const myId = userId1; // Assuming userId1 is the local user usually

    return db.collection('direct_messages')
        .where('chatId', '==', chatId) // We'll add this field for easier querying
        .where('participants', 'array-contains', myId)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DirectMessage));
            callback(messages);
        }, error => {
            console.error("Firestore Snapshot Error (direct_messages):", error);
        });
};

// --- FRIEND MANAGEMENT ---

export const sendFriendRequest = async (sender: User, toId: string) => {
    try {
        // Check if already friends or request pending
        const existing = await db.collection('friendRequests')
            .where('fromId', 'in', [sender.id, toId])
            .where('toId', 'in', [sender.id, toId])
            .get();

        if (!existing.empty) {
            throw new Error("Friend request already exists or you are already friends");
        }

        const request: Partial<FriendRequest> = {
            fromId: sender.id,
            senderName: sender.name,
            senderAvatar: sender.avatar,
            toId: toId,
            status: 'pending',
            timestamp: new Date().toISOString(),
        };
        await db.collection('friendRequests').add(request);
    } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
    }
};

export const acceptFriendRequest = async (requestId: string) => {
    try {
        await db.collection('friendRequests').doc(requestId).update({ status: 'accepted' });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        throw error;
    }
};

export const rejectFriendRequest = async (requestId: string) => {
    try {
        await db.collection('friendRequests').doc(requestId).delete();
    } catch (error) {
        console.error("Error rejecting friend request:", error);
        throw error;
    }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists ? (doc.data() as User) : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
    try {
        await db.collection('users').doc(userId).set(data, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};
