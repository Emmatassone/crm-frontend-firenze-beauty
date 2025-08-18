'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth-debug';
import AuthDebugger from './AuthDebugger';
import HydrationDebugger from './HydrationDebugger';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { token, isTokenValid, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔍 [LAYOUT DEBUG] MainLayout effect triggered:', {
      hasToken: !!token,
      pathname,
      isLoginPage: pathname === '/login'
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
  }, [token, pathname, router, isTokenValid, logout]);

  // Show loading or redirect if no valid token
  if (!token && pathname !== '/login') {
    return null; // or a loading spinner
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