import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '../services/authApi';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials?: string;
  studentId?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('bms_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      if (res.success) {
        const u = res.data;
        const generatedInitials = u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        
        setUser({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          initials: u.initials || generatedInitials,
          studentId: u.studentId || 'N/A',
          avatarUrl: u.avatarUrl
        });
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      localStorage.removeItem('bms_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    if (res.success) {
      localStorage.setItem('bms_token', res.token);
      const u = res.data;
      const generatedInitials = u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      
      setUser({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        initials: u.initials || generatedInitials,
        studentId: u.studentId || 'N/A',
        avatarUrl: u.avatarUrl
      });
      toast.success('Successfully logged in!');
    }
  };

  const registerUser = async (data: any) => {
    const res = await authApi.register(data);
    if (res.success) {
      localStorage.setItem('bms_token', res.token);
      const u = res.data;
      const generatedInitials = u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      
      setUser({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        initials: u.initials || generatedInitials,
        studentId: u.studentId || 'N/A',
        avatarUrl: u.avatarUrl
      });
      toast.success('Successfully registered! Please verify your email.');
    }
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('bms_token');
      setUser(null);
      toast.success('Logged out successfully');
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
