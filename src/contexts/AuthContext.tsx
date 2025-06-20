import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Authentification listener
  useEffect(() => {
    console.info("[AuthContext] Setting up auth state listener");
    setIsAuthLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[AuthContext] User signed in:", user.uid);
        setCurrentUser(user);
      } else {
        console.log("[AuthContext] User signed out");
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      console.info("[AuthContext] Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("[AuthContext] Sign in with Google successful");
    } catch (e: any) {
      console.error('[AuthContext] Error signing in with Google:', e.message || e);
      setAuthError(e.message || 'Failed to sign in with Google');
      throw e; // Re-throw pour permettre à l'UI de gérer l'erreur
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      console.log("[AuthContext] Sign out successful");
    } catch (e: any) {
      console.error('[AuthContext] Error signing out:', e.message || e);
      setAuthError(e.message || 'Failed to sign out');
      throw e; // Re-throw pour permettre à l'UI de gérer l'erreur
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        signInWithGoogle,
        signOutUser,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 