'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/store/auth';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, logout } = useAuthStore();

  const navLinks = [
    ...(isAdmin ? [{ href: '/employees', label: 'Empleados' }] : []),
    ...(isAdmin ? [{ href: '/products', label: 'Productos' }] : []),
    ...(isAdmin ? [{ href: '/services', label: 'Servicios' }] : []),
    { href: '/clients', label: 'Clientes' },
    { href: '/appointments', label: 'Citas' },
    { href: '/sales', label: 'Ventas' },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
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
      <button
        onClick={handleLogout}
        className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-pink-100 hover:bg-pink-500 hover:text-white"
      >
        Logout
      </button>
    </div>
  );
} 