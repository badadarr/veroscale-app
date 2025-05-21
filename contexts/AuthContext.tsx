import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const initAuth = async () => {
      try {
        // Only access localStorage in browser environment
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          
          if (token) {
            // Set default auth header for axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Fetch user data from localStorage
            const userData = localStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        setUser(data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      router.push('/login');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
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