import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Models, ID, Query } from 'appwrite';
import { account, databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      // User not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // Create account
      await account.create('unique()', email, password, fullName);
      
      // Sign in after successful registration
      await account.createEmailPasswordSession(email, password);
      
      // Get user data
      const userData = await account.get();
      setUser(userData);

      // Auto-create profile with fullName so Profile Settings is pre-filled
      if (fullName?.trim()) {
        try {
          // Check if profile already exists (shouldn't, but be safe)
          const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            [Query.equal('userId', userData.$id)]
          );
          if (existing.documents.length === 0) {
            await databases.createDocument(
              DATABASE_ID,
              COLLECTIONS.PROFILES,
              ID.unique(),
              {
                userId: userData.$id,
                fullName: fullName.trim(),
                username: '',
                phone: '',
                shippingAddress: '',
              }
            );
          }
        } catch (profileError) {
          // Non-fatal — profile can be set later from Profile Settings
          console.warn('Profile auto-create failed:', profileError);
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get user data
      const userData = await account.get();
      setUser(userData);
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
