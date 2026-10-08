import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const authVersionRef = useRef(0);

  // Khởi tạo và kiểm tra token khi load trang
  useEffect(() => {
    let cancelled = false;
    const version = authVersionRef.current;
    const isCurrent = () => !cancelled && version === authVersionRef.current;
    async function initAuth() {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          if (!isCurrent()) return;
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
          if (!isCurrent()) return;
          removeStoredToken();
          setToken(null);
          setUser(null);
        }
      }
      if (isCurrent()) setIsLoading(false);
    }

    initAuth();

    // Lắng nghe sự kiện 401 tự động logout
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const requestMagicLink = async (email: string): Promise<MagicLinkResponse> => {
    return await authApi.requestMagicLink(email);
  };

  const verifyMagicLink = async (verifyToken: string): Promise<AuthResponse> => {
    const version = ++authVersionRef.current;
    setIsLoading(true);
    try {
      const res = await authApi.verifyMagicLink(verifyToken);
      if (version !== authVersionRef.current) {
        throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
      }
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res;
    } finally {
      if (version === authVersionRef.current) setIsLoading(false);
    }
  };

  const logout = () => {
    authVersionRef.current += 1;
    void authApi.logout();
    setToken(null);
    setUser(null);
    setIsLoading(false);
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
