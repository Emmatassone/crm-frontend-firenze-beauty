'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import MainLayout from '@/components/MainLayout';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && (
        <header className="bg-pink-600 text-white shadow-md">
          <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold hover:text-pink-200">
              Firenze Beauty - Gestor de Clientes
            </Link>
            <Navigation />
          </nav>
        </header>
      )}
      <main className="flex-grow container mx-auto p-6">
        <MainLayout>
          {children}
        </MainLayout>
      </main>
      {!isLoginPage && (
        <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
          <p>&copy; {new Date().getFullYear()} Firenze Beauty - Salón de Belleza. Todos los derechos reservados.</p>
        </footer>
      )}
    </>
  );
} 