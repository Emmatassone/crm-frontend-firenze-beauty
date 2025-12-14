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
            serviceQuantities: data.serviceQuantities,
            usedDiscount: data.usedDiscount,
            servicePrices: data.servicePrices,
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
        serviceQuantities: appointment.serviceQuantities,
        usedDiscount: appointment.usedDiscount,
        servicePrices: appointment.servicePrices,
        additionalComments: appointment.additionalComments,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleServiceChange = (value: string) => {
    // Parse comma-separated input to array for backwards compatibility in edit mode
    const servicesArray = value.split(',').map(s => s.trim()).filter(s => s);
    const currentDiscounts = editForm.usedDiscount || [];
    const currentQuantities = editForm.serviceQuantities || [];
    const currentPrices = editForm.servicePrices || [];

    // Ensure discounts match services length
    const newDiscounts = servicesArray.map((_, index) => currentDiscounts[index] || '0');
    const newQuantities = servicesArray.map((_, index) => currentQuantities[index] || '1');
    // For prices, we check if we have a stored price. If not, we can't look up here easily, so we might default to 0 or null
    // But since this is text edit without IDs, we rely on position. 
    // Ideally we'd fetch price, but simpler to preserve position.
    const newPrices = servicesArray.map((_, index) => currentPrices[index] ?? 0);

    setEditForm(prev => ({
      ...prev,
      serviceConsumed: servicesArray,
      usedDiscount: newDiscounts,
      serviceQuantities: newQuantities,
      servicePrices: newPrices,
    }));
  };

  const handleDiscountChange = (index: number, value: string) => {
    const discountsArray = [...(editForm.usedDiscount || [])];
    discountsArray[index] = value;
    setEditForm(prev => ({
      ...prev,
      usedDiscount: discountsArray
    }));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantitiesArray = [...(editForm.serviceQuantities || [])];
    quantitiesArray[index] = value;
    setEditForm(prev => ({
      ...prev,
      serviceQuantities: quantitiesArray
    }));
  };

  const handleInputChange = (field: keyof UpdateAppointmentDto, value: string) => {
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

  const servicesArray = Array.isArray(appointment.serviceConsumed) ? appointment.serviceConsumed : [];
  const quantitiesArray = Array.isArray(appointment.serviceQuantities) ? appointment.serviceQuantities : [];
  const discountsArray = Array.isArray(appointment.usedDiscount) ? appointment.usedDiscount : [];

  const editServicesArray = Array.isArray(editForm.serviceConsumed) ? editForm.serviceConsumed : [];
  const editQuantitiesArray = Array.isArray(editForm.serviceQuantities) ? editForm.serviceQuantities : [];
  const editDiscountsArray = Array.isArray(editForm.usedDiscount) ? editForm.usedDiscount : [];

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
              value={editServicesArray.join(', ')}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="Separar servicios con comas"
              required
            />
          ) : (
            <div className="text-lg text-gray-900">
              {servicesArray.map((service: string, index: number) => {
                const quantity = parseInt(quantitiesArray[index]) || 1;
                return (
                  <span key={index}>
                    {index > 0 && ', '}
                    {service.trim()}
                    {quantity > 1 && <span className="text-pink-500 font-medium"> ×{quantity}</span>}
                  </span>
                );
              })}
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
          <label className="text-sm text-gray-500 block">Cantidad y Descuento por Servicio</label>
          {isEditing ? (
            (() => {
              if (editServicesArray.length === 0) {
                return (
                  <p className="mt-1 text-sm text-gray-500 italic">
                    Primero agregue servicios para establecer cantidades y descuentos
                  </p>
                );
              }

              return (
                <div className="space-y-2 mt-2">
                  {editServicesArray.map((service: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 p-2 rounded-md">
                      <span className="flex-1 text-sm text-gray-700 font-medium">{service}</span>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Cant:</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editQuantitiesArray[index] || '1'}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-14 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm text-center"
                          disabled={isSaving}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Desc:</label>
                        <select
                          value={editDiscountsArray[index] || '0'}
                          onChange={(e) => handleDiscountChange(index, e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                          disabled={isSaving}
                        >
                          {Array.from({ length: 21 }, (_, i) => i * 5).map(value => (
                            <option key={value} value={value.toString()}>{value}%</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-lg text-gray-900">
              {servicesArray.length > 0 ? (
                servicesArray.map((service: string, index: number) => {
                  const quantity = parseInt(quantitiesArray[index]) || 1;
                  const discount = parseInt(discountsArray[index]) || 0;
                  return (
                    <div key={index} className="text-sm">
                      {service}: Cant. {quantity}, Desc. {discount}%
                    </div>
                  );
                })
              ) : (
                'N/D'
              )}
            </div>
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
