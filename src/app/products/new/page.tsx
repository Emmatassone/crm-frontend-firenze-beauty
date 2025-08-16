'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createProduct, CreateProductDto } from '@/lib/api';
import ProductForm, { ProductFormValues } from '../ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload: CreateProductDto = {
        productName: data.productName,
        currentStock: data.currentStock ? parseInt(data.currentStock, 10) : undefined,
        model: data.model,
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : undefined,
        sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : undefined,
        lastRestockDate: data.lastRestockDate ? data.lastRestockDate.split('-').reverse().join('-') : undefined,
      };
      
      const newProduct = await createProduct(payload);
      router.push(`/products/${newProduct.id}`);
    } catch (e: any) {
      setError(e.message || 'Error al crear producto.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agregar Nuevo Producto</h1>
        <Link href="/products" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Productos
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <ProductForm 
        onSubmit={onSubmit} 
        isLoading={isLoading}
        defaultValues={{
          lastRestockDate: new Date().toISOString(),
        }}
      />
    </div>
  );
} 