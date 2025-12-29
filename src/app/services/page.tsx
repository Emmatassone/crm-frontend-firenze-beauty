'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServices, Service } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import ServiceList from './ServiceList';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { canManageProducts, level } = useAuthStore();
  const router = useRouter();
  const isLevel123 = level === '1' || level === '2' || level === '3';

  useEffect(() => {
    if (isLevel123) {
      router.push('/');
    }
  }, [isLevel123, router]);

  useEffect(() => {
    if (isLevel123) return;
    async function fetchServices() {
      try {
        const data = await getServices();
        setServices(data);
      } catch (e: any) {
        console.error("Error al cargar servicios:", e);
        setError("No se pudieron cargar los servicios.");
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [isLevel123]);

  if (loading || isLevel123) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-lg">Cargando servicios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Servicios
        </h1>
        {canManageProducts && (
          <Link href="/services/new" className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-75">
            Agregar Nuevo Servicio
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <ServiceList initialServices={services} />
    </div>
  );
} 