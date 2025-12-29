'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SidebarNavigation from '@/components/SidebarNavigation';
import MainLayout from '@/components/MainLayout';
import { useAuthStore } from '@/lib/store/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { token } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Login page layout
  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-white">
        {children}
      </main>
    );
  }

  // Prevent flash of unstyled content/logic before hydration
  if (!isHydrated) {
    return null; // Or a simple loading screen
  }

  // Main App Layout
  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden relative">
      <MainLayout>
        <div className="flex h-full w-full">
          {/* Sidebar logic - only if token exists */}
          {token && (
            <div className="h-full flex-shrink-0">
              <SidebarNavigation />
            </div>
          )}

          {/* Page Content Panel */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}