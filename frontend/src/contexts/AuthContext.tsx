import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch, odooCall } from '../utils/api';

interface User {
  uid: number;
  login: string;
  name: string;
  shiv_role?: string;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  useEffect(() => {
    // Check if session exists by trying to fetch the current user's profile from our API
    const initAuth = async () => {
      try {
        const me = await apiFetch('/shiv/auth/me');
        if (me && me.data && me.data.uid) {
          setUser({
            uid: me.data.uid,
            login: me.data.login,
            name: me.data.name,
            shiv_role: me.data.shiv_role,
            must_change_password: me.data.must_change_password
          });
        }
      } catch (err) {
        console.error('Session check failed', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (loginStr: string, passwordStr: string) => {
    // Using our custom REST controller for strict security and auditing
    const data = await apiFetch('/shiv/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginStr, password: passwordStr })
    });
    
    if (data.data && data.data.uid) {
      setUser({
        uid: data.data.uid,
        login: data.data.login || loginStr,
        name: data.data.name || loginStr,
        shiv_role: data.data.shiv_role,
        must_change_password: data.data.must_change_password
      });
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/shiv/auth/logout', { method: 'POST' });
    } catch (e) {
      // Odoo fallback
      await fetch('/web/session/destroy', { method: 'POST' });
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
