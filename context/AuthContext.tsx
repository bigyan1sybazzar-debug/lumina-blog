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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure persistence is set to LOCAL to avoid environment issues with session storage
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .then(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

              if (userDoc.exists) {
                setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
              } else {
                // New user via Google or other method not yet in DB
                const newUser: User = {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'User',
                  email: firebaseUser.email || '',
                  role: 'user', // Default role
                  avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`
                };
                // Save to DB
                await db.collection('users').doc(firebaseUser.uid).set(newUser);
                setUser(newUser);
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            }
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
    setIsLoading(true);
    try {
      await auth.signInWithPopup(googleProvider);
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