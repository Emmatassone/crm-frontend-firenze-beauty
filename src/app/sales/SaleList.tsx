'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ProductSale } from '@/lib/api';

interface SaleListProps {
  initialSales: ProductSale[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
const naDisplay = <span className="text-gray-400">N/D</span>;

const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'N/D';
  try {
    return new Date(isoString).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return 'Fecha Inválida'; }
};

const formatCurrency = (amount?: number) => {
  if (typeof amount !== 'number') return 'N/D';
  return `$${amount.toFixed(2)}`; // Basic currency format
};

export default function SaleList({ initialSales }: SaleListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    if (!searchTerm) return initialSales;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialSales.filter(sale => 
      (sale.productName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (sale.sku?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, initialSales]);

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por nombre de producto, SKU..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredSales.length === 0 && searchTerm && (
        <p className="text-gray-600">No se encontraron ventas con el término "{searchTerm}".</p>
      )}
      {filteredSales.length === 0 && !searchTerm && initialSales.length > 0 && (
         <p className="text-gray-600">No hay ventas que coincidan con su búsqueda actual, pero sí hay ventas registradas.</p>
      )}

      {filteredSales.length > 0 && (
        <div className="shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thStyle}>Producto</th>
                <th scope="col" className={thStyle}>SKU</th>
                <th scope="col" className={thStyle}>Fecha y Hora</th>
                <th scope="col" className={thStyle}>Cantidad</th>
                <th scope="col" className={thStyle}>Precio Unit.</th>
                {/* <th scope="col" className={thStyle}>Total Bruto</th> */}
                <th scope="col" className={thStyle}>Descuento</th>
                <th scope="col" className={thStyle}>Total Final</th>
                <th scope="col" className={thStyle}>Vendedor</th>
                <th scope="col" className={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className={tdStyle}>{sale.productName}</td>
                  <td className={tdStyle}>{sale.sku || naDisplay}</td>
                  <td className={tdStyle}>{formatDateTime(sale.dateTime)}</td>
                  <td className={tdStyle}>{sale.quantitySold}</td>
                  <td className={tdStyle}>{formatCurrency(sale.sellingPricePerUnit)}</td>
                  {/* <td className={tdStyle}>{formatCurrency(sale.totalSaleAmount)}</td> */}
                  <td className={tdStyle}>{sale.discountApplied || naDisplay}</td>
                  <td className={`${tdStyle} font-semibold`}>{formatCurrency(sale.finalAmount)}</td>
                  <td className={tdStyle}>{sale.sellerEmployee?.name || naDisplay}</td>
                  <td className={`${tdStyle} text-right`}>
                    <Link href={`/sales/${sale.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 