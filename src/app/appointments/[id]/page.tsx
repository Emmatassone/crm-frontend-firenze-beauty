'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAppointmentById, updateAppointment, deleteAppointment, type Appointment, type UpdateAppointmentDto } from '@/lib/api';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<UpdateAppointmentDto>({});

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getAppointmentById(id)
      .then((data) => { 
        if (isMounted) {
          setAppointment(data);
          setEditForm({
            appointmentDate: data.appointmentDate.split('T')[0] + 'T' + data.appointmentDate.split('T')[1].substring(0, 5),
            attendedEmployee: data.attendedEmployee,
            clientName: data.clientName,
            clientId: data.clientId,
            arrivalTime: data.arrivalTime,
            leaveTime: data.leaveTime,
            serviceConsumed: data.serviceConsumed,
            usedDiscount: data.usedDiscount,
            additionalComments: data.additionalComments,
          });
        }
      })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el turno'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  const handleSave = async () => {
    if (!id || !appointment) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedAppointment = await updateAppointment(id, editForm);
      setAppointment(updatedAppointment);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el turno');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (appointment) {
      setEditForm({
        appointmentDate: appointment.appointmentDate.split('T')[0] + 'T' + appointment.appointmentDate.split('T')[1].substring(0, 5),
        attendedEmployee: appointment.attendedEmployee,
        clientName: appointment.clientName,
        clientId: appointment.clientId,
        arrivalTime: appointment.arrivalTime,
        leaveTime: appointment.leaveTime,
        serviceConsumed: appointment.serviceConsumed,
        usedDiscount: appointment.usedDiscount,
        additionalComments: appointment.additionalComments,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof UpdateAppointmentDto, value: string) => {
    setEditForm(prev => {
      const updated = {
        ...prev,
        [field]: value === '' ? undefined : value
      };

      // Sync discounts when services change
      if (field === 'serviceConsumed' && value) {
        const servicesArray = value.split(',').filter((s: string) => s.trim());
        const currentDiscounts = prev.usedDiscount || '';
        const discountsArray = currentDiscounts.split(',').filter((d: string) => d.trim());
        
        // Ensure discounts match services length
        const newDiscounts = servicesArray.map((_, index) => 
          discountsArray[index] || '0'
        );
        updated.usedDiscount = newDiscounts.join(',');
      }

      return updated;
    });
  };

  const handleDiscountChange = (index: number, value: string) => {
    const currentDiscounts = editForm.usedDiscount || '';
    const discountsArray = currentDiscounts.split(',').filter((d: string) => d.trim());
    discountsArray[index] = value;
    setEditForm(prev => ({
      ...prev,
      usedDiscount: discountsArray.join(',')
    }));
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteAppointment(id);
      router.push('/appointments');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el turno');
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
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando turno…</div>;
  }

  if (error || !appointment) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Turno no encontrado'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Turno</h1>
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
          <label className="text-sm text-gray-500 block">Cliente</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.clientName || ''}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">{appointment.clientName}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Empleado que Atendió</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.attendedEmployee || ''}
              onChange={(e) => handleInputChange('attendedEmployee', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">{appointment.attendedEmployee}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Fecha</label>
          {isEditing ? (
            <input
              type="datetime-local"
              value={editForm.appointmentDate || ''}
              onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">
              {(() => {
                const date = new Date(appointment.appointmentDate);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${day}/${month}/${year}`;
              })()}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Servicio Consumido</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.serviceConsumed || ''}
              onChange={(e) => handleInputChange('serviceConsumed', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              required
            />
          ) : (
            <div className="text-lg text-gray-900">
              {(() => {
                const servicesArray = appointment.serviceConsumed ? appointment.serviceConsumed.split(',').filter(s => s.trim()) : [];
                const quantitiesArray = appointment.serviceQuantities ? appointment.serviceQuantities.split(',').filter(q => q.trim()) : [];
                
                return servicesArray.map((service, index) => {
                  const quantity = parseInt(quantitiesArray[index]) || 1;
                  return (
                    <span key={index}>
                      {index > 0 && ', '}
                      {service.trim()}
                      {quantity > 1 && <span className="text-pink-500 font-medium"> ×{quantity}</span>}
                    </span>
                  );
                });
              })()}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Hora de Llegada</label>
          {isEditing ? (
            <input
              type="time"
              value={editForm.arrivalTime || ''}
              onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg text-gray-900">{appointment.arrivalTime || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Hora de Salida</label>
          {isEditing ? (
            <input
              type="time"
              value={editForm.leaveTime || ''}
              onChange={(e) => handleInputChange('leaveTime', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg text-gray-900">{appointment.leaveTime || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Descuento Aplicado</label>
          {isEditing ? (
            (() => {
              const servicesArray = editForm.serviceConsumed ? editForm.serviceConsumed.split(',').filter((s: string) => s.trim()) : [];
              const discountsArray = editForm.usedDiscount ? editForm.usedDiscount.split(',').filter((d: string) => d.trim()) : [];
              
              // Ensure discounts array matches services length
              while (discountsArray.length < servicesArray.length) {
                discountsArray.push('0');
              }
              while (discountsArray.length > servicesArray.length) {
                discountsArray.pop();
              }

              if (servicesArray.length === 0) {
                return (
                  <p className="mt-1 text-sm text-gray-500 italic">
                    Primero agregue servicios para establecer descuentos
                  </p>
                );
              }

              return (
                <div className="space-y-2 mt-2">
                  {servicesArray.map((service, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
                      <span className="flex-1 text-sm text-gray-700 font-medium">{service}</span>
                      <select
                        value={discountsArray[index] || '0'}
                        onChange={(e) => handleDiscountChange(index, e.target.value)}
                        className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                        disabled={isSaving}
                      >
                        {Array.from({ length: 21 }, (_, i) => i * 5).map(value => (
                          <option key={value} value={value.toString()}>{value}%</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-lg text-gray-900">{appointment.usedDiscount || 'N/D'}</div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500 block">Comentarios Adicionales</label>
          {isEditing ? (
            <textarea
              value={editForm.additionalComments || ''}
              onChange={(e) => handleInputChange('additionalComments', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={3}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{appointment.additionalComments || 'N/D'}</div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500 block">Precio Total</label>
          <div className="text-xl font-bold text-pink-600">
            {appointment.totalAmount !== undefined && appointment.totalAmount !== null 
              ? `$${Number(appointment.totalAmount).toFixed(2)}` 
              : 'N/D'}
          </div>
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
              ¿Estás seguro de que deseas eliminar el turno de "{appointment.clientName}" del {(() => {
                const date = new Date(appointment.appointmentDate);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${day}/${month}/${year}`;
              })()}? 
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


