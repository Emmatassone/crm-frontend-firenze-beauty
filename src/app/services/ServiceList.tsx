'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Service } from '@/lib/api';

interface ServiceListProps {
  initialServices: Service[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";

export default function ServiceList({ initialServices }: ServiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = useMemo(() => {
    if (!searchTerm) return initialServices;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialServices.filter(service => 
      (service.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (service.description?.toLowerCase().includes(lowerCaseSearchTerm) ?? false)
    );
  }, [searchTerm, initialServices]);

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por nombre o descripción..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className={thStyle}>Nombre</th>
              <th scope="col" className={thStyle}>Descripción</th>
              <th scope="col" className={thStyle}>Precio</th>
              <th scope="col" className={thStyle}>Duración (min)</th>
              <th scope="col" className={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                <td className={tdStyle}>{service.name}</td>
                <td className={tdStyle}>{service.description || <span className="text-gray-400">N/D</span>}</td>
                <td className={tdStyle}>${Number(service.price).toFixed(2)}</td>
                <td className={tdStyle}>{service.duration || <span className="text-gray-400">N/D</span>}</td>
                <td className={`${tdStyle} text-right`}>
                  <Link href={`/services/${service.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
                    Ver Detalles
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 