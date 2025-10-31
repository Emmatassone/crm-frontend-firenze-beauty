'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createProductSale, CreateProductSaleDto } from '@/lib/api';
import SaleForm, { SaleFormValues } from '../SaleForm';

export default function NewSalePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<SaleFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateProductSaleDto = {
        productId: data.productId,
        clientId: data.clientId === '' ? undefined : data.clientId,
        quantitySold: Number(data.quantitySold),
        sellingPricePerUnit: Number(data.sellingPricePerUnit),
        totalSaleAmount: Number(data.totalSaleAmount),
        finalAmount: Number(data.finalAmount),
        discountApplied: data.discountApplied === '' ? undefined : data.discountApplied,
        dateTime: data.dateTime ? data.dateTime.split('-').reverse().join('-') : new Date().toISOString(),
      };
      
      await createProductSale(payload);
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
        defaultValues={{
          dateTime: new Date().toISOString(),
        }}
      />
    </div>
  );
} 