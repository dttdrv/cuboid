import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // SECURITY: Mock session is ephemeral. No persistence to avoid XSS risks.
  // The useEffect that previously read from localStorage has been removed.

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (import.meta.env.DEV) {
        // Mock Login Bypass (InMemory)
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

        const mockUser: User = {
          id: 'dev-mock-id',
          email: email,
          name: 'Dev User',
        };

        setUser(mockUser);
        // REMOVED: localStorage.setItem('user', JSON.stringify(mockUser));
      } else {
        // Real API implementation would go here
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        setUser(data.user);
        // Real implementation would likely set secure httpOnly cookies here
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    // REMOVED: localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};