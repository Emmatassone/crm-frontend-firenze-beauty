'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Service } from '@/lib/api';

interface ServiceListProps {
  initialServices: Service[];
}

const SERVICE_AREAS = [
  'Uñas',
  'Pestañas y Cejas',
  'Peluqueria',
  'Maquillaje',
  'Cosmetología',
  'Labios',
] as const;

// Area icons/emojis for visual representation
const AREA_ICONS: Record<string, string> = {
  'Uñas': '💅',
  'Pestañas y Cejas': '👁️',
  'Peluqueria': '💇',
  'Maquillaje': '💄',
  'Cosmetología': '✨',
  'Labios': '👄',
  'Otros Servicios': '🔧',
};

export default function ServiceList({ initialServices }: ServiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    if (!searchTerm) return initialServices;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialServices.filter(service => 
      (service.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (service.description?.toLowerCase().includes(lowerCaseSearchTerm) ?? false) ||
      (service.area?.toLowerCase().includes(lowerCaseSearchTerm) ?? false)
    );
  }, [searchTerm, initialServices]);

  // Group services by area
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    
    // Initialize groups for defined areas
    SERVICE_AREAS.forEach(area => {
      groups[area] = [];
    });
    groups['Otros Servicios'] = [];

    // Categorize services
    filteredServices.forEach(service => {
      const area = service.area && SERVICE_AREAS.includes(service.area as any) 
        ? service.area 
        : 'Otros Servicios';
      groups[area].push(service);
    });

    // Sort services alphabetically within each group
    Object.keys(groups).forEach(area => {
      groups[area].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    });

    // Filter out empty groups
    return Object.entries(groups).filter(([_, services]) => services.length > 0);
  }, [filteredServices]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Buscar por nombre, descripción o área..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {groupedServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No se encontraron servicios
        </div>
      ) : (
        groupedServices.map(([area, services]) => (
          <div key={area} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="text-xl">{AREA_ICONS[area]}</span>
                {area}
                <span className="ml-2 text-sm font-normal opacity-90">
                  ({services.length} {services.length === 1 ? 'servicio' : 'servicios'})
                </span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abreviatura
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duración
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service, index) => (
                    <tr 
                      key={service.id} 
                      className={`hover:bg-pink-50 transition duration-150 ease-in-out ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {service.abbreviation || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {service.description || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-pink-600">
                        ${Number(service.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {service.duration ? `${service.duration} min` : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <Link 
                          href={`/services/${service.id}`} 
                          className="text-pink-600 hover:text-pink-800 font-medium"
                        >
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 