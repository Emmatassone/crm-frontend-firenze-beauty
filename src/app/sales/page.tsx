'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProductSales, ProductSale } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import SaleList from './SaleList';

function SalesPage() {
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isViewOnly, level } = useAuthStore();
  const router = useRouter();
  const isLevel123 = level === '1' || level === '2' || level === '3';

  useEffect(() => {
    if (isLevel123) {
      router.push('/');
    }
  }, [isLevel123, router]);

  useEffect(() => {
    if (isLevel123) return;
    async function fetchSales() {
      try {
        const data = await getProductSales();
        setSales(data);
      } catch (e: any) {
        console.error('Error al cargar ventas:', e);
        setError(e.message || "No se pudieron cargar las ventas. Por favor, inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchSales();
  }, [isLevel123]);

  if (loading || isLevel123) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-lg">Cargando ventas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Ventas de Productos</h1>
        {!isViewOnly && (
          <Link href="/sales/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition">
            Registrar Nueva Venta
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!error && sales.length === 0 && (
        <p className="text-gray-600">No hay ventas registradas. ¡Comienza registrando una nueva venta!</p>
      )}

      {!error && (
        <SaleList initialSales={sales} />
      )}
    </div>
  );
}

export default SalesPage; 