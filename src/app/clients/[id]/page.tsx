'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getClientProfileById, updateClientProfile, deleteClientProfile, type ClientProfile, type UpdateClientProfileDto } from '@/lib/api';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<UpdateClientProfileDto>({});

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getClientProfileById(id)
      .then((data) => { 
        if (isMounted) {
          setClient(data);
          setEditForm({
            name: data.name,
            phoneNumber: data.phoneNumber,
            email: data.email,
            dateOfBirth: data.dateOfBirth,
            hairDetails: data.hairDetails,
            eyelashDetails: data.eyelashDetails,
            nailDetails: data.nailDetails,
            clientAllergies: data.clientAllergies,
          });
        }
      })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el cliente'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  const handleSave = async () => {
    if (!id || !client) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedClient = await updateClientProfile(id, editForm);
      setClient(updatedClient);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (client) {
      setEditForm({
        name: client.name,
        phoneNumber: client.phoneNumber,
        email: client.email,
        dateOfBirth: client.dateOfBirth,
        hairDetails: client.hairDetails,
        eyelashDetails: client.eyelashDetails,
        nailDetails: client.nailDetails,
        clientAllergies: client.clientAllergies,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof UpdateClientProfileDto, value: string) => {
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
      await deleteClientProfile(id);
      router.push('/clients');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el cliente');
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

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
                onClick={handleSave}
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
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.name || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Teléfono</label>
          {isEditing ? (
            <input
              type="tel"
              value={editForm.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">{client.phoneNumber}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Correo</label>
          {isEditing ? (
            <input
              type="email"
              value={editForm.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.email || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Fecha de Nacimiento</label>
          {isEditing ? (
            <input
              type="date"
              value={editForm.dateOfBirth || ''}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg text-gray-900">{client.dateOfBirth || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Detalles de Cabello</label>
          {isEditing ? (
            <textarea
              value={editForm.hairDetails || ''}
              onChange={(e) => handleInputChange('hairDetails', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={2}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.hairDetails || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Detalles de Pestañas</label>
          {isEditing ? (
            <textarea
              value={editForm.eyelashDetails || ''}
              onChange={(e) => handleInputChange('eyelashDetails', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={2}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.eyelashDetails || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Detalles de Uñas</label>
          {isEditing ? (
            <textarea
              value={editForm.nailDetails || ''}
              onChange={(e) => handleInputChange('nailDetails', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={2}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.nailDetails || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Alergias del Cliente</label>
          {isEditing ? (
            <textarea
              value={editForm.clientAllergies || ''}
              onChange={(e) => handleInputChange('clientAllergies', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={2}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{client.clientAllergies || 'N/D'}</div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Creado</div>
          <div className="text-lg text-gray-900">{new Date(client.createdAt).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Actualizado</div>
          <div className="text-lg text-gray-900">{new Date(client.updatedAt).toLocaleString()}</div>
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
              ¿Estás seguro de que deseas eliminar el cliente "{client.name || client.phoneNumber}"? 
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
    </div>
  );
}


