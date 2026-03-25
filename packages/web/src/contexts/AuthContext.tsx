import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<AuthUser | null>(null);
  
  const logout = () => {
    localStorage.removeItem('idToken');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
