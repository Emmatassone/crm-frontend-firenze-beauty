'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { token, isTokenValid, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for client-side hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Don't run auth checks until hydration is complete
    if (!isHydrated) {
      return;
    }

    // Check if we have a token but it's expired
    if (token) {
      const isValid = isTokenValid();
      
      if (!isValid) {
        logout();
        router.push('/login');
        return;
      }
    }

    // Redirect to login if no token
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [token, pathname, router, isTokenValid, logout, isHydrated]);

  // Show loading during hydration or if no valid token
  if (!isHydrated || (!token && pathname !== '/login')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">
          {!isHydrated ? 'Iniciando aplicación...' : 'Cargando...'}
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};

export default MainLayout; 