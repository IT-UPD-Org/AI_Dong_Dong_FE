import * as Sentry from '@sentry/react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authApi } from '../api/auth.api';
import { getStoredToken, removeStoredToken } from '../api/client';
import type { User } from '../api/types';
import { identifyUser } from '../lib/analytics';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  devLogin: (email: string, name: string) => Promise<User>;
  microsoftLogin: (code: string, codeVerifier: string, nonce: string) => Promise<User>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const trackedUserId = useRef<string | null>(null);

  // Tie error reports and analytics to the signed-in account. Only the opaque
  // ID and role are sent, so names and emails stay out of both services.
  useEffect(() => {
    if (!user) {
      Sentry.setUser(null);
      trackedUserId.current = null;
      return;
    }

    Sentry.setUser({ id: user.id });

    if (trackedUserId.current !== user.id) {
      trackedUserId.current = user.id;
      identifyUser(user.id, { role: user.role });
    }
  }, [user]);

  const clearSession = useCallback(() => {
    removeStoredToken();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      if (getStoredToken()) {
        try {
          const currentUser = await authApi.getCurrentUser();
          if (!cancelled) setUser(currentUser);
        } catch {
          if (!cancelled) clearSession();
        }
      }
      if (!cancelled) setIsLoading(false);
    }

    initAuth();

    // apiClient fires this on any 401 so an expired token signs the user out.
    window.addEventListener('auth:unauthorized', clearSession);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:unauthorized', clearSession);
    };
  }, [clearSession]);

  const devLogin = async (email: string, name: string) => {
    const loggedIn = await authApi.devLogin(email, name);
    setUser(loggedIn);
    return loggedIn;
  };

  const microsoftLogin = async (code: string, codeVerifier: string, nonce: string) => {
    const loggedIn = await authApi.microsoftLogin(code, codeVerifier, nonce);
    setUser(loggedIn);
    return loggedIn;
  };

  const refreshUser = async () => {
    setUser(await authApi.getCurrentUser());
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        devLogin,
        microsoftLogin,
        refreshUser,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
