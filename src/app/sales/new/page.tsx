'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProductSale, CreateProductSaleDto, getClientProfiles, ClientProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import SaleForm from '../SaleForm';

export default function NewSalePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const { isViewOnly } = useAuthStore();

  // Redirect view-only users
  useEffect(() => {
    if (isViewOnly) {
      router.replace('/sales');
    }
  }, [isViewOnly, router]);

  useEffect(() => {
    async function fetchClients() {
      try {
        const clientData = await getClientProfiles();
        setClients(clientData);
      } catch (e) {
        console.error("Error al cargar clientes", e);
        setError("No se pudieron cargar los clientes.");
      }
    }
    fetchClients();
  }, []);

  // Don't render form for view-only users
  if (isViewOnly) {
    return null;
  }

  const onSubmit = async (data: CreateProductSaleDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await createProductSale(data);
      router.push('/sales');
    } catch (e: any) {
      setError(e.message || 'Error al registrar la venta.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Registrar Nueva Venta</h1>
        <Link href="/sales" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Ventas
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <SaleForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        clients={clients}
      />
    </div>
  );
} 