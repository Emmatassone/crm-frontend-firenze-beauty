'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { token, isTokenValid, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we have a token but it's expired
    if (token && !isTokenValid()) {
      console.log('Token expired, logging out');
      logout();
      router.push('/login');
      return;
    }

    // Redirect to login if no token
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [token, pathname, router, isTokenValid, logout]);

  // Show loading or redirect if no valid token
  if ((!token || !isTokenValid()) && pathname !== '/login') {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default MainLayout; 