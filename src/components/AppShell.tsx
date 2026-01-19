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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          {/* Mobile Menu Button */}
          {token && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden fixed top-4 left-4 z-50 bg-pink-600 text-white p-3 rounded-lg shadow-lg hover:bg-pink-700 transition-all active:scale-95"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          )}

          {/* Mobile Overlay */}
          {token && isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar logic - only if token exists */}
          {token && (
            <div className={`
              fixed lg:relative inset-y-0 left-0 z-40
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <SidebarNavigation />
            </div>
          )}

          {/* Page Content Panel */}
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </div>
          </div>
        </div>
      </MainLayout>
    </div>
  );
}
