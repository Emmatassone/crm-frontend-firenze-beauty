'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEmployeeById, type Employee } from '@/lib/api';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getEmployeeById(id)
      .then((data) => { if (isMounted) setEmployee(data); })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el empleado'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando empleado…</div>;
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Empleado no encontrado'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Empleado</h1>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><div className="text-sm text-gray-500">Nombre</div><div className="text-lg text-gray-900">{employee.name}</div></div>
        <div><div className="text-sm text-gray-500">Correo</div><div className="text-lg text-gray-900">{employee.email}</div></div>
        <div><div className="text-sm text-gray-500">Puesto</div><div className="text-lg text-gray-900">{employee.jobTitle}</div></div>
        <div><div className="text-sm text-gray-500">Estado</div><div className="text-lg text-gray-900">{employee.status}</div></div>
        <div><div className="text-sm text-gray-500">Nivel</div><div className="text-lg text-gray-900">{employee.level || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Teléfono</div><div className="text-lg text-gray-900">{employee.phoneNumber || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Dirección</div><div className="text-lg text-gray-900">{employee.address || 'N/D'}</div></div>
        <div>
          <div className="text-sm text-gray-500">Fecha de Nacimiento</div>
          <div className="text-lg text-gray-900">
            {employee.dateOfBirth ? (() => {
              const date = new Date(employee.dateOfBirth);
              const day = String(date.getUTCDate()).padStart(2, '0');
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              const year = date.getUTCFullYear();
              return `${day}/${month}/${year}`;
            })() : 'N/D'}
          </div>
        </div>
        <div><div className="text-sm text-gray-500">Creado</div><div className="text-lg text-gray-900">{new Date(employee.createdAt).toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-500">Actualizado</div><div className="text-lg text-gray-900">{new Date(employee.updatedAt).toLocaleString()}</div></div>
      </div>
    </div>
  );
}


