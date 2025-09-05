'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductSaleById, type ProductSale } from '@/lib/api';

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [sale, setSale] = useState<ProductSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getProductSaleById(id)
      .then((data) => { if (isMounted) setSale(data); })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar la venta'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando venta…</div>;
  }

  if (error || !sale) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Venta no encontrada'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Venta</h1>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><div className="text-sm text-gray-500">Producto</div><div className="text-lg text-gray-900">{sale.productName}</div></div>
        <div><div className="text-sm text-gray-500">SKU</div><div className="text-lg text-gray-900">{sale.sku || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Fecha</div><div className="text-lg text-gray-900">{new Date(sale.dateTime).toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-500">Cantidad</div><div className="text-lg text-gray-900">{sale.quantitySold}</div></div>
        <div><div className="text-sm text-gray-500">Precio Unit.</div><div className="text-lg text-gray-900">${Number(sale.sellingPricePerUnit).toFixed(2)}</div></div>
        <div><div className="text-sm text-gray-500">Descuento</div><div className="text-lg text-gray-900">{sale.discountApplied || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Total Final</div><div className="text-lg text-gray-900">${Number(sale.finalAmount).toFixed(2)}</div></div>
        <div><div className="text-sm text-gray-500">Vendedor</div><div className="text-lg text-gray-900">{sale.sellerEmployee?.name || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Creado</div><div className="text-lg text-gray-900">{new Date(sale.createdAt).toLocaleString()}</div></div>
        <div><div className="text-sm text-gray-500">Actualizado</div><div className="text-lg text-gray-900">{new Date(sale.updatedAt).toLocaleString()}</div></div>
      </div>
    </div>
  );
}


