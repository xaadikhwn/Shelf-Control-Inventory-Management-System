import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────
interface AuthUser {
  name: string;
  role: string;
  initials: string;
  studentId: string;
}

interface AuthState {
  user: AuthUser;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: {
    name: 'Saad Ibrar',
    role: 'Administrator',
    initials: 'SI',
    studentId: '100536271',
  },
  isAuthenticated: true,
};

type AuthAction = { type: 'LOGOUT' } | { type: 'LOGIN'; payload: AuthUser };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGOUT':
      return { ...state, isAuthenticated: false };
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────
interface AuthContextValue extends AuthState {
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
