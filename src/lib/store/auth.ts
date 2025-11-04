import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  email: string | null;
  level: string | null;
  isAdmin: boolean;
  canManageProducts: boolean;
  login: (token: string) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

interface JwtPayload {
  email: string;
  level?: string;
  exp: number; // JWT expiration timestamp
  sub: string;
}

type MyPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>(
  (persist as MyPersist)(
    (set, get) => ({
      token: null,
      email: null,
      level: null,
      isAdmin: false,
      canManageProducts: false,
      login: (token: string) => {
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const { email, level } = decoded;
          const isAdmin = level === '5' || level === '6';
          const canManageProducts = level === '4' || level === '5' || level === '6';
          set({ token, email, level: level || null, isAdmin, canManageProducts });
        } catch (error) {
          console.error('Failed to decode JWT token:', error);
          // Reset auth state on invalid token
          set({ token: null, email: null, level: null, isAdmin: false, canManageProducts: false });
        }
      },
      logout: () => {
        set({ token: null, email: null, level: null, isAdmin: false, canManageProducts: false });
      },
      isTokenValid: () => {
        const { token } = get();
        
        if (!token) {
          return false;
        }
        
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const currentTime = Date.now() / 1000; // Convert to seconds
          const isValid = decoded.exp > currentTime;
          
          return isValid;
        } catch (error) {
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      // Add token validation on hydration
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          const isValid = state.isTokenValid();
          
          if (!isValid) {
            state.logout();
          }
        }
      },
    }
  )
); 