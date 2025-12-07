'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientProfiles, ClientProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import ClientList from './ClientList'; // Import the new client component

function ClientsPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isViewOnly } = useAuthStore();

  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await getClientProfiles();
        setClients(data);
      } catch (e: any) {
        console.error('Error al cargar clientes:', e);
        setError(e.message || "No se pudieron cargar los perfiles de clientes. Por favor, inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-lg">Cargando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Perfiles de Clientes</h1>
        {!isViewOnly && (
          <Link href="/clients/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out">
            Agregar Nuevo Cliente
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!error && clients.length === 0 && (
        <p className="text-gray-600">No se encontraron perfiles de clientes. ¡Comienza agregando un nuevo cliente!</p>
      )}

      {!error && (
        <ClientList initialClients={clients} />
      )}
    </div>
  );
}

export default ClientsPage; 