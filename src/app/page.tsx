import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-pink-600 mb-6">Bienvenida a nuestro gestor de clientes</h1>
      <p className="text-lg text-gray-700 mb-8">
        Administra perfiles de clientes, citas e inventario de productos fácilmente.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/clients" className="block hover:no-underline">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-pink-500 mb-3">Clientes</h2>
            <p className="text-gray-600">Ver, agregar y administrar perfiles detallados de clientes.</p>
          </div>
        </Link>
        <Link href="/services" className="block hover:no-underline">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-pink-500 mb-3">Servicios</h2>
            <p className="text-gray-600">Administrar servicios disponibles.</p>
          </div>
        </Link>
        <Link href="/products" className="block hover:no-underline">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col justify-center">
            <h2 className="text-2xl font-semibold text-pink-500 mb-3">Productos</h2>
            <p className="text-gray-600">Administrar inventario y ventas de productos.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
