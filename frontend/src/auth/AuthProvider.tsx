import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, setToken, clearToken, getUsernameFromToken } from './storage';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setTokenState(storedToken);
      setUsername(getUsernameFromToken());
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Check if fake auth is enabled
    const fakeAuthEnabled = import.meta.env.VITE_FAKE_AUTH === '1';
    if (!fakeAuthEnabled) {
      console.warn('Fake auth is disabled. Set VITE_FAKE_AUTH=1 to enable local-only authentication.');
      return { success: false, error: 'Authentication is disabled in this environment' };
    }

    // Validate against env credentials or registered users
    const testUser = import.meta.env.VITE_TEST_USER || 'demo';
    const testPass = import.meta.env.VITE_TEST_PASS || 'demo';

    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }

    // Check if it's the default demo user
    const isDemoUser = username === testUser && password === testPass;
    
    // Check registered users in localStorage
    let isRegisteredUser = false;
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      isRegisteredUser = registeredUsers.some((user: any) => 
        user.username === username && user.password === password
      );
    } catch {
      // Ignore localStorage errors
    }

    if (!isDemoUser && !isRegisteredUser) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create fake JWT token
    const payload = btoa(JSON.stringify({ 
      sub: username, 
      iat: Date.now() 
    }));
    const fakeToken = `fake.${payload}.token`;

    // Store token and update state
    setToken(fakeToken);
    setTokenState(fakeToken);
    setUsername(username);

    return { success: true };
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUsername(null);
  };

  const value: AuthContextType = {
    token,
    username,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};