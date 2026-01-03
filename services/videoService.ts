import { db } from './firebase';
import { Call } from '../types';
import firebase from 'firebase/compat/app';

const CALLS_COLLECTION = 'calls';

// Create a new call offer
export const initiateCall = async (
    caller: { id: string; name: string; avatar: string },
    receiver: { id: string; name: string; avatar: string }
): Promise<string> => {
    try {
        const callDoc = db.collection(CALLS_COLLECTION).doc();
        const callData: Partial<Call> = {
            id: callDoc.id,
            callerId: caller.id,
            callerName: caller.name,
            callerAvatar: caller.avatar,
            receiverId: receiver.id,
            receiverName: receiver.name,
            receiverAvatar: receiver.avatar,
            status: 'ringing',
            timestamp: new Date().toISOString()
        };
        await callDoc.set(callData);
        return callDoc.id;
    } catch (error) {
        console.error("Error initiating call:", error);
        throw error;
    }
};

// Update call with WebRTC Offer
export const updateCallWithOffer = async (callId: string, offer: any) => {
    await db.collection(CALLS_COLLECTION).doc(callId).update({ offer });
};

// Answer a call
export const answerCall = async (callId: string, answer: any) => {
    await db.collection(CALLS_COLLECTION).doc(callId).update({
        answer,
        status: 'connected'
    });
};

// End a call
export const endCall = async (callId: string) => {
    await db.collection(CALLS_COLLECTION).doc(callId).update({
        status: 'ended'
    });
};

// Reject a call
export const rejectCall = async (callId: string) => {
    await db.collection(CALLS_COLLECTION).doc(callId).update({
        status: 'rejected'
    });
};

// Listen for incoming calls
export const listenForIncomingCalls = (userId: string, callback: (calls: Call[]) => void) => {
    return db.collection(CALLS_COLLECTION)
        .where('receiverId', '==', userId)
        .where('status', '==', 'ringing')
        .onSnapshot(snapshot => {
            const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call));
            callback(calls);
        }, error => {
            console.error("Error listening for calls:", error);
        });
};

// Listen to a specific call's status/data
export const listenToCall = (callId: string, callback: (call: Call | null) => void) => {
    return db.collection(CALLS_COLLECTION).doc(callId)
        .onSnapshot(doc => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() } as Call);
            } else {
                callback(null);
            }
        });
};

// Save ICE Candidates
export const addIceCandidate = async (callId: string, candidate: any, type: 'caller' | 'receiver') => {
    const subcollection = type === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    await db.collection(CALLS_COLLECTION).doc(callId).collection(subcollection).add(candidate);
};

// Listen for ICE Candidates
export const listenForIceCandidates = (callId: string, type: 'caller' | 'receiver', callback: (candidate: any) => void) => {
    const subcollection = type === 'caller' ? 'callerCandidates' : 'receiverCandidates';
    return db.collection(CALLS_COLLECTION).doc(callId).collection(subcollection)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    callback(change.doc.data());
                }
            });
        });
};
