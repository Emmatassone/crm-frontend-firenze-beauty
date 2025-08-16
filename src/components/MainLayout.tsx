'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token && pathname !== '/login') {
      router.push('/login');
    }
  }, [token, pathname, router]);

  if (!token && pathname !== '/login') {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default MainLayout; 