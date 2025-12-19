// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, googleProvider } from '../services/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Default "safe" context value — prevents throw during SSG
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  signup: async () => {},
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase auth listener — only runs in browser
  useEffect(() => {
    // Guard: only run in browser (not during SSG/SSR)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Set persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

              if (userDoc.exists) {
                setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
              } else {
                const newUser: User = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  role: 'user',
                  avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.email || 'User')}&background=random`,
                };
                await db.collection('users').doc(firebaseUser.uid).set(newUser);
                setUser(newUser);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });

        return () => unsubscribe();
      })
      .catch((error) => {
        console.error('Auth Persistence Error:', error);
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Google Sign-In not available during server render');
    }

    setIsLoading(true);
    try {
      if (!googleProvider) {
        throw new Error('Google Provider failed to initialize.');
      }
      await auth.signInWithPopup(googleProvider);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Google Sign In Error:', error);
      if (error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('Google Sign-In requires HTTPS (except localhost). Use Email/Password instead.');
      }
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) return;

      const role = email === 'admin@lumina.blog' ? 'admin' : 'user';

      const newUserProfile: User = {
        id: firebaseUser.uid,
        name,
        email,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      };

      await db.collection('users').doc(firebaseUser.uid).set(newUserProfile);
      setUser(newUserProfile);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    if (typeof window === 'undefined') {
      setUser(null);
      return;
    }

    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Safe hook — never throws during SSG
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  // During SSG or if somehow not wrapped, return safe defaults instead of throwing
  if (context === defaultContextValue && typeof window === 'undefined') {
    return {
      user: null,
      isLoading: false,
      login: async () => console.warn('Auth not available during static render'),
      loginWithGoogle: async () => console.warn('Auth not available during static render'),
      signup: async () => console.warn('Auth not available during static render'),
      logout: async () => console.warn('Auth not available during static render'),
    };
  }

  return context;
};