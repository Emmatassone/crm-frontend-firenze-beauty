'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, type Product } from '@/lib/api';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getProductById(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'No se pudo cargar el producto');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-700 animate-pulse">Cargando producto…</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Producto</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Volver
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500">Nombre</div>
          <div className="text-lg font-medium text-gray-900">{product.productName}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Modelo</div>
          <div className="text-lg text-gray-900">{product.model || 'N/D'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Existencias</div>
          <div className="text-lg text-gray-900">{product.currentStock ?? 0}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Precio de Venta</div>
          <div className="text-lg text-gray-900">{product.sellingPrice != null ? `$${Number(product.sellingPrice).toFixed(2)}` : 'N/D'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Último Reabastecimiento</div>
          <div className="text-lg text-gray-900">{product.lastRestockDate ? new Date(product.lastRestockDate).toLocaleDateString() : 'N/D'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Creado</div>
          <div className="text-lg text-gray-900">{new Date(product.createdAt).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Actualizado</div>
          <div className="text-lg text-gray-900">{new Date(product.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}


