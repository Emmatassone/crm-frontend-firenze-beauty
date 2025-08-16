import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

interface AuthState {
  token: string | null;
  email: string | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

type MyPersist = (
  config: StateCreator<AuthState>,
  options: PersistOptions<AuthState>
) => StateCreator<AuthState>;

export const useAuthStore = create<AuthState>(
  (persist as MyPersist)(
    (set) => ({
      token: null,
      email: null,
      isAdmin: false,
      login: (token: string) => {
        const { email } = jwtDecode<{ email: string }>(token);
        const isAdmin = email === 'flor@firenzebeauty.com.ar';
        set({ token, email, isAdmin });
      },
      logout: () => set({ token: null, email: null, isAdmin: false }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
); 