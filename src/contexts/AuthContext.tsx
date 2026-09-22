import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.api';
import { getStoredToken, removeStoredToken, setStoredToken } from '../api/client';
import type { AuthResponse, MagicLinkResponse, User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestMagicLink: (email: string) => Promise<MagicLinkResponse>;
  verifyMagicLink: (token: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khởi tạo và kiểm tra token khi load trang
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setToken(storedToken);
          } else {
            // Token không còn hợp lệ
            removeStoredToken();
            setToken(null);
            setUser(null);
          }
        } catch {
          removeStoredToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    // Lắng nghe sự kiện 401 tự động logout
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const requestMagicLink = async (email: string): Promise<MagicLinkResponse> => {
    return await authApi.requestMagicLink(email);
  };

  const verifyMagicLink = async (verifyToken: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyMagicLink(verifyToken);
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        requestMagicLink,
        verifyMagicLink,
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
