'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getServiceById, type Service } from '@/lib/api';

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getServiceById(id)
      .then((data) => {
        if (!isMounted) return;
        setService(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'No se pudo cargar el servicio');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-700 animate-pulse">Cargando servicio…</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Servicio no encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Servicio</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Volver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500">Nombre</div>
          <div className="text-lg font-medium text-gray-900">{service.name}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Abreviación</div>
          <div className="text-lg text-gray-900">{service.abbreviation || 'N/D'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Descripción</div>
          <div className="text-lg text-gray-900">{service.description || 'N/D'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Precio</div>
          <div className="text-lg text-gray-900">${Number(service.price).toFixed(2)}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Duración</div>
          <div className="text-lg text-gray-900">{service.duration ?? 'N/D'} min</div>
        </div>
      </div>
    </div>
  );
}


