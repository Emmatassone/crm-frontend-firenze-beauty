import Link from 'next/link';
import { getProducts, Product } from '@/lib/api';
import ProductList from './ProductList';

async function ProductsPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: any) {
    console.error('Error al cargar productos:', e);
    error = e.message || "No se pudieron cargar los productos. Por favor, inténtalo más tarde.";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
        <Link href="/products/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition">
          Agregar Producto
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!error && products.length === 0 && (
        <p className="text-gray-600">No hay productos. Comienza agregando uno nuevo!</p>
      )}

      {!error && (
        <ProductList initialProducts={products} />
      )}
    </div>
  );
}

export default ProductsPage; 