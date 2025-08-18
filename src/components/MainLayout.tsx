'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth-debug';
import AuthDebugger from './AuthDebugger';
import HydrationDebugger from './HydrationDebugger';

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
      console.log('🔍 [LAYOUT DEBUG] Waiting for hydration to complete...');
      return;
    }

    console.log('🔍 [LAYOUT DEBUG] MainLayout effect triggered (post-hydration):', {
      hasToken: !!token,
      pathname,
      isLoginPage: pathname === '/login',
      isHydrated
    });

    // Check if we have a token but it's expired
    if (token) {
      const isValid = isTokenValid();
      console.log('🔍 [LAYOUT DEBUG] Token validation in MainLayout:', { isValid });
      
      if (!isValid) {
        console.log('🔍 [LAYOUT DEBUG] Token expired in MainLayout, logging out');
        logout();
        router.push('/login');
        return;
      }
    }

    // Redirect to login if no token
    if (!token && pathname !== '/login') {
      console.log('🔍 [LAYOUT DEBUG] No token, redirecting to login');
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
      <AuthDebugger />
      <HydrationDebugger />
      {children}
    </>
  );
};

export default MainLayout; 