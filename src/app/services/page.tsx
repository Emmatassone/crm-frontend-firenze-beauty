import Link from 'next/link';
import { getServices, Service } from '@/lib/api';
import ServiceList from './ServiceList';

async function getServiceData(): Promise<{ services: Service[], error: string | null }> {
  try {
    const services = await getServices();
    return { services, error: null };
  } catch (e: any) {
    console.error("Error al cargar servicios:", e);
    return { services: [], error: "No se pudieron cargar los servicios." };
  }
}

export default async function ServicesPage() {
  const { services, error } = await getServiceData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Servicios
        </h1>
        <Link href="/services/new" className="px-4 py-2 bg-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-75">
          Agregar Nuevo Servicio
        </Link>
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