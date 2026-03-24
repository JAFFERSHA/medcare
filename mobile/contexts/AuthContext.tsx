import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, User } from '@/lib/api';
import { storage } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const token = await storage.getToken();
      if (token) {
        const storedUser = await storage.getUser<User>();
        if (storedUser) {
          setUser(storedUser);
          // Verify token is still valid
          try {
            const { user: freshUser } = await api.auth.me();
            setUser(freshUser);
            await storage.setUser(freshUser);
          } catch {
            // Token expired - clear storage
            await storage.clear();
            setUser(null);
          }
        }
      }
    } catch {
      await storage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(token: string, newUser: User) {
    await storage.setToken(token);
    await storage.setUser(newUser);
    setUser(newUser);
  }

  async function signOut() {
    try {
      await api.auth.logout();
    } catch {
      // ignore logout errors
    }
    await storage.clear();
    setUser(null);
  }

  async function refreshUser() {
    try {
      const { user: freshUser } = await api.auth.me();
      setUser(freshUser);
      await storage.setUser(freshUser);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
