import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  email: string | null;
  level: string | null;
  isAdmin: boolean;
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
      login: (token: string) => {
        console.log('🔍 [AUTH DEBUG] Login called with token length:', token?.length);
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const { email, level } = decoded;
          const isAdmin = level === '5' || level === '6';
          console.log('🔍 [AUTH DEBUG] Login successful:', { email, level, isAdmin });
          set({ token, email, level: level || null, isAdmin });
        } catch (error) {
          console.error('🔍 [AUTH DEBUG] Failed to decode JWT token:', error);
          // Reset auth state on invalid token
          set({ token: null, email: null, level: null, isAdmin: false });
        }
      },
      logout: () => {
        console.log('🔍 [AUTH DEBUG] Logout called from:', new Error().stack);
        set({ token: null, email: null, level: null, isAdmin: false });
      },
      isTokenValid: () => {
        const { token } = get();
        console.log('🔍 [AUTH DEBUG] Checking token validity:', { 
          hasToken: !!token, 
          tokenLength: token?.length || 0,
          tokenStart: token?.substring(0, 20) + '...' || 'null'
        });
        
        if (!token) {
          console.log('🔍 [AUTH DEBUG] No token found');
          return false;
        }
        
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          const currentTime = Date.now() / 1000; // Convert to seconds
          const isValid = decoded.exp > currentTime;
          const timeUntilExpiry = decoded.exp - currentTime;
          
          console.log('🔍 [AUTH DEBUG] Token validation:', {
            isValid,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
            currentTime: new Date(currentTime * 1000).toISOString(),
            timeUntilExpiryMinutes: Math.floor(timeUntilExpiry / 60),
            email: decoded.email,
            level: decoded.level
          });
          
          return isValid;
        } catch (error) {
          console.error('🔍 [AUTH DEBUG] Error validating token:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      // TEMPORARILY DISABLE onRehydrateStorage to test if this is the issue
      // onRehydrateStorage: () => (state) => {
      //   console.log('🔍 [AUTH DEBUG] Hydrating auth store:', {
      //     hasState: !!state,
      //     hasToken: !!state?.token,
      //     tokenLength: state?.token?.length || 0
      //   });
      //   
      //   if (state?.token) {
      //     const isValid = state.isTokenValid();
      //     console.log('🔍 [AUTH DEBUG] Token validation on hydration:', { isValid });
      //     
      //     if (!isValid) {
      //       console.log('🔍 [AUTH DEBUG] Token expired on hydration, logging out');
      //       state.logout();
      //     }
      //   }
      // },
    }
  )
);
