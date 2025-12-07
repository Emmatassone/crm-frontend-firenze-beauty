'use client';

import Link from 'next/link';
import { useAuthStore } from '../lib/store/auth';

interface ServiceCard {
  href: string;
  label: string;
  description: string;
}

export default function HomePage() {
  const { name, isAdmin, canAccessAnalytics } = useAuthStore();

  // Use employee name directly for greeting
  const displayName = name || '';

  // Define all possible service cards with descriptions
  const allServiceCards: ServiceCard[] = [
    ...(isAdmin ? [{ href: '/employees', label: 'Empleados', description: 'Administrar empleados y sus permisos.' }] : []),
    { href: '/products', label: 'Productos', description: 'Administrar inventario y ventas de productos.' },
    { href: '/services', label: 'Servicios', description: 'Administrar servicios disponibles.' },
    { href: '/clients', label: 'Clientes', description: 'Ver, agregar y administrar perfiles detallados de clientes.' },
    { href: '/appointments', label: 'Citas', description: 'Programar y gestionar citas de clientes.' },
    { href: '/sales', label: 'Ventas', description: 'Registrar y consultar ventas de productos.' },
    ...(canAccessAnalytics ? [{ href: '/analytics', label: 'Analíticas', description: 'Ver estadísticas y reportes del negocio.' }] : []),
  ];

  // Determine grid columns based on number of cards
  const getGridClass = () => {
    const count = allServiceCards.length;
    if (count <= 3) return 'grid-cols-1 md:grid-cols-3';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-pink-600 mb-6">
        ¡Bienvenida{displayName ? `, ${displayName}` : ''}!
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        Administra perfiles de clientes, citas e inventario de productos fácilmente.
      </p>
      <div className={`grid ${getGridClass()} gap-6`}>
        {allServiceCards.map(({ href, label, description }) => (
          <Link key={href} href={href} className="block hover:no-underline">
            <div className={`p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-center ${href === '/analytics'
              ? 'bg-indigo-50 border border-indigo-200'
              : 'bg-white'
              }`}>
              <h2 className={`text-2xl font-semibold mb-3 ${href === '/analytics' ? 'text-indigo-600' : 'text-pink-500'
                }`}>
                {label}
              </h2>
              <p className="text-gray-600">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
