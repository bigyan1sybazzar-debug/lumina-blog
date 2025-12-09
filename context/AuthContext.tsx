import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, googleProvider } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Helper function to sync/create a user profile in Firestore
   */
  const syncUserProfile = useCallback(async (firebaseUser: firebase.User) => {
    try {
      const userDocRef = db.collection('users').doc(firebaseUser.uid);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        // User exists, load profile
        setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
      } else {
        // User does not exist, create new profile (used for Google sign-in or first time login)
        const isDefaultAdmin = firebaseUser.email === 'admin@lumina.blog';
        
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
          email: firebaseUser.email || '',
          role: isDefaultAdmin ? 'admin' : 'user', // Set admin role if matches specific email
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=random`
        };

        // Save new user profile to Firestore
        await userDocRef.set(newUser);
        setUser(newUser);
      }
    } catch (error) {
      console.error("Error syncing user profile:", error);
      // In case of a profile sync error, we still set isLoading to false
      // but the user might only have partial data (or none if the error prevents setting)
    }
  }, []);

  useEffect(() => {
    // Ensure persistence is set to LOCAL
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            await syncUserProfile(firebaseUser); // Use the helper function here
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });
        return () => unsubscribe();
      })
      .catch((error) => {
        console.error("Auth Persistence Error:", error);
        setIsLoading(false);
      });
  }, [syncUserProfile]); // Dependency on syncUserProfile

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged will handle setting the user state via syncUserProfile
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await auth.signInWithPopup(googleProvider);
      if (result.user) {
        await syncUserProfile(result.user); // Use the helper function here
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Google Sign In Error:", error);
      if (error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('Google Sign-In is not supported in this environment (e.g. HTTP without localhost). Please use Email/Password.');
      }
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return;

      const isDefaultAdmin = email === 'admin@lumina.blog';

      const newUserProfile: User = {
        id: firebaseUser.uid,
        name,
        email,
        role: isDefaultAdmin ? 'admin' : 'user',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      };

      // Explicitly set the profile for sign-up (since we have the name)
      await db.collection('users').doc(firebaseUser.uid).set(newUserProfile);
      
      // Update local state and let onAuthStateChanged handle the rest
      setUser(newUserProfile);
      setIsLoading(false); 
      
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};