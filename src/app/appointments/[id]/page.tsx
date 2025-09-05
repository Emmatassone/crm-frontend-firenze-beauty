'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAppointmentById, type Appointment } from '@/lib/api';

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getAppointmentById(id)
      .then((data) => { if (isMounted) setAppointment(data); })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el turno'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

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
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><div className="text-sm text-gray-500">Cliente</div><div className="text-lg text-gray-900">{appointment.clientName}</div></div>
        <div><div className="text-sm text-gray-500">Servicio</div><div className="text-lg text-gray-900">{appointment.serviceConsumed}</div></div>
        <div><div className="text-sm text-gray-500">Fecha y Hora</div><div className="text-lg text-gray-900">{new Date(appointment.appointmentDate).toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-500">Empleado</div><div className="text-lg text-gray-900">{appointment.attendedEmployee}</div></div>
        <div><div className="text-sm text-gray-500">Llegada</div><div className="text-lg text-gray-900">{appointment.arrivalTime || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Salida</div><div className="text-lg text-gray-900">{appointment.leaveTime || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Descuento</div><div className="text-lg text-gray-900">{appointment.usedDiscount || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Comentarios</div><div className="text-lg text-gray-900">{appointment.additionalComments || 'N/D'}</div></div>
      </div>
    </div>
  );
}


