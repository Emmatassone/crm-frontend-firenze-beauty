'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createService, CreateServiceDto } from '@/lib/api';
import ServiceForm, { ServiceFormValues } from '../ServiceForm';

export default function NewServicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateServiceDto = {
        name: data.name,
        abbreviation: data.abbreviation,
        description: data.description,
        area: data.area,
        price: Number(data.price),
        duration: data.duration ? Number(data.duration) : undefined,
      };
      await createService(payload);
      router.push('/services');
    } catch (e: any) {
      setError(e.message || 'Error al crear servicio.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agregar Nuevo Servicio</h1>
        <Link href="/services" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Servicios
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <ServiceForm 
        onSubmit={onSubmit} 
        isLoading={isLoading} 
      />
    </div>
  );
} 