'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, canAccessAnalytics, logout } = useAuthStore();

  const navLinks = [
    ...(isAdmin ? [{ href: '/employees', label: 'Empleados' }] : []),
    { href: '/products', label: 'Productos' },
    { href: '/services', label: 'Servicios' },
    { href: '/clients', label: 'Clientes' },
    { href: '/appointments', label: 'Citas' },
    { href: '/sales', label: 'Ventas' },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const isAnalyticsActive = pathname.startsWith('/analytics');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center">
      {/* ERP Navigation Links */}
      <div className="space-x-4 flex items-center">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              isActive(href)
                ? 'bg-pink-700 text-white shadow-md'
                : 'text-pink-100 hover:bg-pink-500 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Analytics Link - Separated and styled differently for level 6 users */}
      {canAccessAnalytics && (
        <>
          <div className="mx-4 h-6 w-px bg-pink-300/50" /> {/* Divider */}
          <Link
            href="/analytics"
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              isAnalyticsActive
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400'
                : 'bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500 hover:text-white border border-indigo-400/50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Analíticas
          </Link>
        </>
      )}

      <div className="ml-4">
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-pink-100 hover:bg-pink-500 hover:text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 