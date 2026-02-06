import { db } from './firebase';
import { PhoneListing, BuyerRequest } from '../types';
import firebase from 'firebase/compat/app';

const LISTINGS_COLLECTION = 'phone_listings';
const REQUESTS_COLLECTION = 'buyer_requests';

// --- PHONE LISTINGS ---

export const getPhoneListings = async (filters?: { brand?: string; minPrice?: number; maxPrice?: number; condition?: string }): Promise<PhoneListing[]> => {
    try {
        let query: firebase.firestore.Query<firebase.firestore.DocumentData> = db.collection(LISTINGS_COLLECTION)
            .where('status', '==', 'approved')
            .orderBy('timestamp', 'desc');

        if (filters?.brand && filters.brand !== 'All') {
            query = query.where('brand', '==', filters.brand);
        }

        // Note: Firestore limitation - cannot filter by multiple fields with inequalities easily without composite indexes.
        // For simple price filtering with other fields, we might need client-side filtering or exact matches.
        // We will do client-side filtering for price to avoid complex index requirements for now.

        const snapshot = await query.get();
        let listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhoneListing));

        if (filters?.condition && filters.condition !== 'All') {
            listings = listings.filter(l => l.condition === filters.condition);
        }
        if (filters?.minPrice) {
            listings = listings.filter(l => l.price >= filters.minPrice!);
        }
        if (filters?.maxPrice) {
            listings = listings.filter(l => l.price <= filters.maxPrice!);
        }

        return listings;
    } catch (error) {
        console.error("Error fetching phone listings:", error);
        return [];
    }
};

export const createPhoneListing = async (listing: Omit<PhoneListing, 'id' | 'timestamp'>) => {
    try {
        const newListing = {
            ...listing,
            status: 'pending', // Default to pending for approval
            timestamp: new Date().toISOString(),
        };
        await db.collection(LISTINGS_COLLECTION).add(newListing);
    } catch (error) {
        console.error("Error creating phone listing:", error);
        throw error;
    }
};

export const markListingAsSold = async (listingId: string) => {
    try {
        await db.collection(LISTINGS_COLLECTION).doc(listingId).update({ status: 'sold' });
    } catch (error) {
        console.error("Error marking listing as sold:", error);
        throw error;
    }
};

export const deleteListing = async (listingId: string) => {
    try {
        await db.collection(LISTINGS_COLLECTION).doc(listingId).delete();
    } catch (error) {
        console.error("Error deleting listing:", error);
        throw error;
    }
};

export const getPendingListings = async (): Promise<PhoneListing[]> => {
    try {
        const snapshot = await db.collection(LISTINGS_COLLECTION)
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhoneListing));
    } catch (error) {
        console.error("Error fetching pending listings:", error);
        return [];
    }
};

export const getMyListings = async (userId: string): Promise<PhoneListing[]> => {
    try {
        const snapshot = await db.collection(LISTINGS_COLLECTION)
            .where('sellerId', '==', userId)
            .orderBy('timestamp', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PhoneListing));
    } catch (error) {
        console.error("Error fetching my listings:", error);
        return [];
    }
};

export const updateListingStatus = async (listingId: string, status: 'approved' | 'rejected' | 'sold' | 'pending') => {
    try {
        await db.collection(LISTINGS_COLLECTION).doc(listingId).update({ status });
    } catch (error) {
        console.error("Error updating listing status:", error);
        throw error;
    }
};

// --- BUYER REQUESTS ---

export const getBuyerRequests = async (): Promise<BuyerRequest[]> => {
    try {
        const snapshot = await db.collection(REQUESTS_COLLECTION)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuyerRequest));
    } catch (error) {
        console.error("Error fetching buyer requests:", error);
        return [];
    }
};

export const createBuyerRequest = async (request: Omit<BuyerRequest, 'id' | 'timestamp'>) => {
    try {
        const newRequest = {
            ...request,
            timestamp: new Date().toISOString(),
        };
        await db.collection(REQUESTS_COLLECTION).add(newRequest);
    } catch (error) {
        console.error("Error creating buyer request:", error);
        throw error;
    }
};

export const deleteBuyerRequest = async (requestId: string) => {
    try {
        await db.collection(REQUESTS_COLLECTION).doc(requestId).delete();
    } catch (error) {
        console.error("Error deleting buyer request:", error);
        throw error;
    }
};
