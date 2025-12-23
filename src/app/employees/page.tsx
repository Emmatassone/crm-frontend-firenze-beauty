'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getEmployees, Employee, calculateAllVacations } from '@/lib/api';
import EmployeeList from './EmployeeList';
import { useAuthStore } from '@/lib/store/auth';

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatingVacations, setCalculatingVacations] = useState(false);
  const [vacationMessage, setVacationMessage] = useState<string | null>(null);
  const { canAccessAnalytics } = useAuthStore();

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e: any) {
      console.error('Error al cargar empleados:', e);
      setError(e.message || "No se pudieron cargar los empleados. Por favor, inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCalculateVacations = async () => {
    setCalculatingVacations(true);
    setVacationMessage(null);
    try {
      const result = await calculateAllVacations();
      setVacationMessage(`✓ Se actualizaron las vacaciones de ${result.updated} empleados.`);
      // Refresh the employee list
      await fetchEmployees();
      setTimeout(() => setVacationMessage(null), 5000);
    } catch (e: any) {
      setVacationMessage(`Error: ${e.message || 'No se pudieron calcular las vacaciones.'}`);
    } finally {
      setCalculatingVacations(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-lg">Cargando empleados...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Empleados</h1>
        <div className="flex gap-3">
          {canAccessAnalytics && (
            <button
              onClick={handleCalculateVacations}
              disabled={calculatingVacations}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {calculatingVacations ? 'Calculando...' : '📅 Calcular Vacaciones'}
            </button>
          )}
          <Link href="/employees/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition">
            Agregar Nuevo Empleado
          </Link>
        </div>
      </div>

      {vacationMessage && (
        <div className={`px-4 py-3 rounded mb-4 ${vacationMessage.startsWith('✓') ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`} role="alert">
          {vacationMessage}
        </div>
      )}

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
