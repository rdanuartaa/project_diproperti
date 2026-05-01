'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fungsi load user (dipakai berkali-kali)
  const loadUser = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Load user saat pertama kali mount
  useEffect(() => {
    loadUser();
  }, []);

  // 🔥 DETEKSI PERUBAHAN TOKEN DI LOCALSTORAGE
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        loadUser(); // Reload user saat token berubah
      }
    };

    // Untuk tab/browser lain
    window.addEventListener('storage', handleStorageChange);
    
    // Untuk tab yang sama (polling ringan)
    const checkInterval = setInterval(() => {
      const currentToken = localStorage.getItem('auth_token');
      const storedToken = window._authTokenCache;
      
      if (currentToken !== storedToken) {
        window._authTokenCache = currentToken;
        loadUser();
      }
    }, 1000);

    // Simpan token awal ke cache
    window._authTokenCache = localStorage.getItem('auth_token');

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  const login = async (token) => {
    localStorage.setItem('auth_token', token);
    window._authTokenCache = token; // Update cache
    
    try {
      await loadUser(); // Langsung load user setelah login
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('auth_token');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      window._authTokenCache = null;
      setUser(null);
      router.push('/');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
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