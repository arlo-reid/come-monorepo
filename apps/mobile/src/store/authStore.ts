import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Actions
  setUser: (user) => set({ user }),
  
  setToken: (token) => set({ token }),
  
  login: (user, token) => set({ 
    user, 
    token, 
    isAuthenticated: true,
    isLoading: false,
  }),
  
  logout: () => set({ 
    user: null, 
    token: null, 
    isAuthenticated: false,
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
}));
