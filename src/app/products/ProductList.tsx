'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/api';

interface ProductListProps {
  initialProducts: Product[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";

const formatPrice = (price?: number) => {
  if (typeof price !== 'number') return 'N/D';
  return `$${price.toFixed(2)}`; // Consider localizing currency later if needed
};

export default function ProductList({ initialProducts }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return initialProducts;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialProducts.filter(product => 
      (product.productName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (product.model?.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, initialProducts]);

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por nombre del producto o modelo..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 && searchTerm && (
        <p className="text-gray-600">No se encontraron productos con el término "{searchTerm}".</p>
      )}
      {filteredProducts.length === 0 && !searchTerm && initialProducts.length > 0 && (
         <p className="text-gray-600">No hay productos que coincidan con su búsqueda actual, pero sí hay productos registrados.</p>
      )}

      {filteredProducts.length > 0 && (
        <div className="shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thStyle}>Nombre del Producto</th>
                <th scope="col" className={thStyle}>Modelo</th>
                <th scope="col" className={thStyle}>Existencias</th>
                <th scope="col" className={thStyle}>Precio de Venta</th>
                <th scope="col" className={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-pink-50 transition ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className={tdStyle}>{product.productName}</td>
                  <td className={tdStyle}>{product.model || 'N/D'}</td>
                  <td className={`${tdStyle} ${product.currentStock && product.currentStock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>{product.currentStock ?? 0}</td>
                  <td className={tdStyle}>{formatPrice(product.sellingPrice)}</td>
                  <td className={`${tdStyle} text-right`}>
                    <Link href={`/products/${product.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
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