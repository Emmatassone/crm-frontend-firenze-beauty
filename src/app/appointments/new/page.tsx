'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createAppointment, CreateAppointmentDto, getClientProfiles, ClientProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import AppointmentForm, { AppointmentFormValues } from '../AppointmentForm';

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [isLongDurationConfirmOpen, setIsLongDurationConfirmOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<AppointmentFormValues | null>(null);
  const { isViewOnly } = useAuthStore();

  // Redirect view-only users
  useEffect(() => {
    if (isViewOnly) {
      router.replace('/appointments');
    }
  }, [isViewOnly, router]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const clientData = await getClientProfiles();
        setClients(clientData);
      } catch (e) {
        console.error("Error al cargar clientes para el selector", e);
        setError("No se pudieron cargar los clientes.");
      }
    }
    fetchClients();
  }, []);

  const defaultValues: Partial<AppointmentFormValues> = {
    appointmentDate: searchParams.get('date') || undefined,
    clientId: searchParams.get('clientId') || undefined,
    clientName: searchParams.get('clientName') || undefined,
    attendedEmployee: searchParams.get('employee') || undefined,
    serviceConsumed: searchParams.get('services')?.split(',') || [],
  };

  const performSave = async (data: AppointmentFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateAppointmentDto = {
        ...data,
        appointmentDate: data.appointmentDate ? data.appointmentDate.split('-').reverse().join('-') : new Date().toISOString(),
        attendedEmployee: data.attendedEmployee,
        clientName: data.clientName,
        clientId: data.clientId,
        arrivalTime: data.arrivalTime,
        leaveTime: data.leaveTime,
        serviceConsumed: data.serviceConsumed,
        serviceQuantities: data.serviceQuantities || [],
        usedDiscount: data.usedDiscount || [],
        additionalComments: data.additionalComments || '',
        totalAmount: data.totalAmount || 0,
        servicePrices: data.servicePrices || [],
      };
      const newAppointment = await createAppointment(payload);
      router.push(`/appointments/${newAppointment.id}`);
    } catch (e: any) {
      setError(e.message || 'Error al crear turno.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
    // Check if duration is greater than 3 hours (180 minutes)
    if (data.arrivalTime && data.leaveTime) {
      const [arrHour, arrMin] = data.arrivalTime.split(':').map(Number);
      const [leaveHour, leaveMin] = data.leaveTime.split(':').map(Number);

      const arrivalMinutes = arrHour * 60 + arrMin;
      const leaveMinutes = leaveHour * 60 + leaveMin;
      const duration = leaveMinutes - arrivalMinutes;

      const THREE_HOURS_IN_MINUTES = 180;

      if (duration > THREE_HOURS_IN_MINUTES) {
        setPendingSaveData(data);
        setIsLongDurationConfirmOpen(true);
        return;
      }
    }

    await performSave(data);
  };

  const confirmLongDurationSave = async () => {
    if (pendingSaveData) {
      setIsLongDurationConfirmOpen(false);
      await performSave(pendingSaveData);
    }
  };

  const cancelLongDurationSave = () => {
    setIsLongDurationConfirmOpen(false);
    setPendingSaveData(null);
  };

  if (isViewOnly) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agregar Nuevo Turno</h1>
        <Link href="/appointments" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Turnos
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <AppointmentForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        clients={clients}
        defaultValues={defaultValues}
      />

      {isLongDurationConfirmOpen && pendingSaveData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Turno de larga duración</h3>
              <p className="text-gray-500 mb-4 text-sm">
                El turno tiene una duración mayor a 3 horas.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-amber-800 font-medium">
                  Duración: {(() => {
                    const [arrHour, arrMin] = (pendingSaveData.arrivalTime || "0:0").split(':').map(Number);
                    const [leaveHour, leaveMin] = (pendingSaveData.leaveTime || "0:0").split(':').map(Number);
                    const minutes = (leaveHour * 60 + leaveMin) - (arrHour * 60 + arrMin);
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;
                    return `${hours}h ${remainingMinutes}min`;
                  })()}
                </p>
              </div>
              <p className="text-gray-500 mb-6 text-sm">
                ¿Estás seguro de que la hora de fin es correcta?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelLongDurationSave}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Corregir
                </button>
                <button
                  onClick={confirmLongDurationSave}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200 disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <NewAppointmentContent />
    </Suspense>
  );
}