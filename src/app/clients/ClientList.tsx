'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ClientProfile } from '@/lib/api'; // Use type import for interfaces

interface ClientListProps {
  initialClients: ClientProfile[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
const naDisplay = <span className="text-gray-400">N/D</span>;

export default function ClientList({ initialClients }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) return initialClients;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialClients.filter(client => 
      (client.name?.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (client.phoneNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (client.email?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, initialClients]);

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por nombre, teléfono, email..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 && searchTerm && (
        <p className="text-gray-600">No se encontraron clientes con el término "{searchTerm}".</p>
      )}
      {filteredClients.length === 0 && !searchTerm && initialClients.length > 0 && (
         <p className="text-gray-600">No hay clientes que coincidan con su búsqueda actual, pero sí hay clientes registrados.</p>
      )}
      {/* The case for initialClients.length === 0 is handled by the parent page */}

      {filteredClients.length > 0 && (
        <div className="shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thStyle}>Nombre</th>
                <th scope="col" className={thStyle}>Teléfono</th>
                <th scope="col" className={thStyle}>Correo Electrónico</th>
                <th scope="col" className={thStyle}>Fecha de Nacimiento</th>
                <th scope="col" className={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className={tdStyle}>{client.name || naDisplay}</td>
                  <td className={tdStyle}>{client.phoneNumber}</td>
                  <td className={tdStyle}>{client.email || naDisplay}</td>
                  <td className={tdStyle}>{client.dateOfBirth || naDisplay}</td>
                  <td className={`${tdStyle} text-right`}>
                    <Link href={`/clients/${client.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 