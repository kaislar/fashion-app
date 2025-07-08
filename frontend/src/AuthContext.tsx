import React, { createContext, useContext, useState, useEffect } from 'react';

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() < payload.exp * 1000;
  } catch (e) {
    return false;
  }
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const storedToken = localStorage.getItem('access_token');
    console.log('AuthContext: Checking stored token:', storedToken ? 'Present' : 'None');
    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      setIsLoggedIn(true);
      console.log('AuthContext: User is logged in');
    } else {
      console.log('AuthContext: No valid token found, user not logged in');
      logout(); // Clear invalid/expired token
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    sessionStorage.clear(); // Also clear session storage
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
