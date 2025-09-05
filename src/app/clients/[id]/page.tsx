'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientProfileById, type ClientProfile } from '@/lib/api';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getClientProfileById(id)
      .then((data) => { if (isMounted) setClient(data); })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el cliente'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando cliente…</div>;
  }

  if (error || !client) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Cliente no encontrado'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Cliente</h1>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><div className="text-sm text-gray-500">Nombre</div><div className="text-lg text-gray-900">{client.name || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Teléfono</div><div className="text-lg text-gray-900">{client.phoneNumber}</div></div>
        <div><div className="text-sm text-gray-500">Correo</div><div className="text-lg text-gray-900">{client.email || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Nacimiento</div><div className="text-lg text-gray-900">{client.dateOfBirth || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Cabello</div><div className="text-lg text-gray-900">{client.hairDetails || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Pestañas</div><div className="text-lg text-gray-900">{client.eyelashDetails || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Uñas</div><div className="text-lg text-gray-900">{client.nailDetails || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Alergias</div><div className="text-lg text-gray-900">{client.clientAllergies || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Creado</div><div className="text-lg text-gray-900">{new Date(client.createdAt).toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-500">Actualizado</div><div className="text-lg text-gray-900">{new Date(client.updatedAt).toLocaleString()}</div></div>
      </div>
    </div>
  );
}


