'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createClientProfile, CreateClientProfileDto } from '@/lib/api';
import ClientForm, { ClientFormValues } from '../ClientForm';

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ClientFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateClientProfileDto = {
        ...data,
        name: data.name === '' ? undefined : data.name,
        phoneNumber: `${data.countryCode}${data.phoneNumber}`.replace(/\+/g, ''),
        email: data.email,
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
          dateOfBirth: new Date().toISOString(),
        }}
      />
    </div>
  );
} 