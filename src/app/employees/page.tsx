import Link from 'next/link';
import { getEmployees, Employee } from '@/lib/api';
import EmployeeList from './EmployeeList';

async function EmployeesPage() {
  let employees: Employee[] = [];
  let error: string | null = null;

  try {
    employees = await getEmployees();
  } catch (e: any) {
    console.error('Error al cargar empleados:', e);
    error = e.message || "No se pudieron cargar los empleados. Por favor, inténtalo más tarde.";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Empleados</h1>
        <Link href="/employees/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition">
          Agregar Nuevo Empleado
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
           <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!error && employees.length === 0 && (
        <p className="text-gray-600">No hay empleados registrados. ¡Comienza agregando uno nuevo!</p>
      )}

      {!error && (
        <EmployeeList initialEmployees={employees} />
      )}
    </div>
  );
}

export default EmployeesPage; 