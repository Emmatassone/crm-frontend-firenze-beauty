'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getServiceById, updateService, deleteService, type Service, type UpdateServiceDto } from '@/lib/api';

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDurationConfirm, setShowDurationConfirm] = useState(false);
  const [isPendingSave, setIsPendingSave] = useState(false);
  const [editForm, setEditForm] = useState<UpdateServiceDto>({});

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getServiceById(id)
      .then((data) => {
        if (!isMounted) return;
        setService(data);
        setEditForm({
          name: data.name,
          abbreviation: data.abbreviation,
          description: data.description,
          area: data.area,
          price: data.price,
          duration: data.duration,
        });
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

  const handleSave = async (force: boolean = false) => {
    if (!id || !service) return;

    // Validate duration
    const dur = editForm.duration ? Number(editForm.duration) : 0;
    if (!force && dur > 0 && (dur > 240 || dur < 10)) {
      setShowDurationConfirm(true);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedService = await updateService(id, editForm);
      setService(updatedService);
      setIsEditing(false);
      setShowDurationConfirm(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el servicio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (service) {
      setEditForm({
        name: service.name,
        abbreviation: service.abbreviation,
        description: service.description,
        area: service.area,
        price: service.price,
        duration: service.duration,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof UpdateServiceDto, value: string | number | undefined) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteService(id);
      router.push('/services');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el servicio');
      setIsDeleting(false);
      setShowDeleteConfirm(false); // Close the modal on error
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

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
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-700 text-white"
              >
                Editar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
              >
                {isDeleting ? 'Eliminando...' : 'Borrar'}
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Volver
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-gray-500 block">Nombre</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg font-medium text-gray-900">{service.name}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Abreviación</label>
          {isEditing ? (
            <input
              type="text"
              maxLength={10}
              value={editForm.abbreviation || ''}
              onChange={(e) => handleInputChange('abbreviation', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{service.abbreviation || 'N/D'}</div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500 block">Descripción</label>
          {isEditing ? (
            <textarea
              value={editForm.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={3}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{service.description || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Área del Servicio</label>
          {isEditing ? (
            <select
              value={editForm.area || ''}
              onChange={(e) => handleInputChange('area', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            >
              <option value="">Seleccionar área...</option>
              <option value="Uñas">Uñas</option>
              <option value="Pestañas y Cejas">Pestañas y Cejas</option>
              <option value="Peluqueria">Peluqueria</option>
              <option value="Maquillaje">Maquillaje</option>
              <option value="Cosmetología">Cosmetología</option>
              <option value="Labios">Labios</option>
            </select>
          ) : (
            <div className="text-lg text-gray-900">{service.area || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Precio</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.price ?? ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">${Number(service.price).toFixed(2)}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Duración (minutos)</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              value={editForm.duration ?? ''}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="0"
            />
          ) : (
            <div className="text-lg text-gray-900">{service.duration ?? 'N/D'} min</div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el servicio "{service.name}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Duration Confirmation Modal */}
      {showDurationConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-4 text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold">Confirmar Duración Atípica</h3>
            </div>
            <p className="text-gray-600 mb-6">
              La duración ingresada ({editForm.duration} minutos) es inusual (menos de 10 min o más de 4 horas). ¿Deseas continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDurationConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Revisar
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-md shadow-amber-200 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


