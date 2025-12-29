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

  const onSubmit: SubmitHandler<AppointmentFormValues> = async (data) => {
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
    }
    setIsLoading(false);
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