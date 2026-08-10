"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, AuthUser, getCurrentUser } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (nextToken: string) => {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    try {
      setUser(await getCurrentUser());
    } catch (error) {
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      setToken(null);
      throw error;
    }
  };

  const logout = () => {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, isLoading, login, logout }), [user, token, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
