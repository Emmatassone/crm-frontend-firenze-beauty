'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createClientProfile, CreateClientProfileDto } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import ClientForm, { ClientFormValues } from '../ClientForm';

function NewClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledName = searchParams.get('name') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isViewOnly } = useAuthStore();

  // Redirect view-only users
  useEffect(() => {
    if (isViewOnly) {
      router.replace('/clients');
    }
  }, [isViewOnly, router]);

  // Don't render form for view-only users
  if (isViewOnly) {
    return null;
  }

  const onSubmit: SubmitHandler<ClientFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateClientProfileDto = {
        name: data.name === '' ? undefined : data.name,
        phoneNumber: `${data.countryCode}${data.phoneNumber}`.replace(/\+/g, ''),
        email: data.email === '' ? undefined : data.email,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('-').reverse().join('-') : undefined,
        hairDetails: data.hairDetails === '' ? undefined : data.hairDetails,
        eyelashDetails: data.eyelashDetails === '' ? undefined : data.eyelashDetails,
        nailDetails: data.nailDetails === '' ? undefined : data.nailDetails,
        clientAllergies: data.clientAllergies === '' ? undefined : data.clientAllergies,
      };
      const newClient = await createClientProfile(payload);
      router.push(`/clients/${newClient.id}`);
    } catch (e: any) {
      setError(e.message || 'Error al crear cliente.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agregar Nuevo Cliente</h1>
        <Link href="/clients" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Clientes
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <ClientForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        defaultValues={{
          name: prefilledName,
          dateOfBirth: new Date().toISOString(),
        }}
      />
    </div>
  );
}

export default function NewClientPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <NewClientContent />
    </Suspense>
  );
} 