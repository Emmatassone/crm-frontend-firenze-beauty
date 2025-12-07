'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEmployeeById, updateEmployee, type Employee } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { canAccessAnalytics } = useAuthStore();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableStatus, setEditableStatus] = useState<Employee['status'] | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getEmployeeById(id)
      .then((data) => {
        if (isMounted) {
          setEmployee(data);
          setEditableStatus(data.status);
        }
      })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el empleado'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  const handleStatusChange = async () => {
    if (!id || !editableStatus || editableStatus === employee?.status) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateEmployee(id, { status: editableStatus });
      setEmployee(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Error al actualizar el estado');
    } finally {
      setIsSaving(false);
    }
  };

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

  const statusLabels: Record<Employee['status'], string> = {
    active: 'Activo',
    suspended: 'Suspendido',
    retired: 'Retirado',
  };

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
        <div>
          <div className="text-sm text-gray-500">Estado</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <select
                value={editableStatus}
                onChange={(e) => setEditableStatus(e.target.value as Employee['status'])}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                disabled={isSaving}
              >
                <option value="active">{statusLabels.active}</option>
                <option value="suspended">{statusLabels.suspended}</option>
                <option value="retired">{statusLabels.retired}</option>
              </select>
              {editableStatus !== employee.status && (
                <button
                  onClick={handleStatusChange}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              {saveSuccess && <span className="text-green-600 text-sm">✓ Guardado</span>}
              {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-800' :
                  employee.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                {statusLabels[employee.status]}
              </span>
            </div>
          )}
        </div>
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


