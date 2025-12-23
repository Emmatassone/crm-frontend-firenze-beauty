'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Employee } from '@/lib/api';

interface EmployeeListProps {
  initialEmployees: Employee[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
const naDisplay = <span className="text-gray-400">N/D</span>;

export default function EmployeeList({ initialEmployees }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    // First filter out retired employees
    const nonRetiredEmployees = initialEmployees.filter(e => e.status !== 'retired');

    if (!searchTerm) return nonRetiredEmployees;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return nonRetiredEmployees.filter(employee =>
      (employee.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (employee.jobTitle.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (employee.email.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [searchTerm, initialEmployees]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, puesto, email..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredEmployees.length === 0 && searchTerm && (
        <p className="text-gray-600">No se encontraron empleados con el término "{searchTerm}".</p>
      )}
      {filteredEmployees.length === 0 && !searchTerm && initialEmployees.length > 0 && (
        <p className="text-gray-600">No hay empleados que coincidan con su búsqueda actual, pero sí hay empleados registrados.</p>
      )}

      {filteredEmployees.length > 0 && (
        <div className="shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thStyle}>Nombre</th>
                <th scope="col" className={thStyle}>Correo Electrónico</th>
                <th scope="col" className={thStyle}>Puesto</th>
                <th scope="col" className={thStyle}>Estado</th>
                <th scope="col" className={thStyle}>Fecha Contratación</th>
                <th scope="col" className={thStyle}>Tipo Empleo</th>
                <th scope="col" className={thStyle}>Nivel</th>
                <th scope="col" className={thStyle}>Teléfono</th>
                <th scope="col" className={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`hover:bg-pink-50 transition duration-150 ease-in-out ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                >
                  <td className={tdStyle}>{employee.name}</td>
                  <td className={tdStyle}>{employee.email}</td>
                  <td className={tdStyle}>{employee.jobTitle}</td>
                  <td className={tdStyle}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-800' :
                      employee.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className={tdStyle}>
                    {employee.hireDate ? (() => {
                      const date = new Date(employee.hireDate);
                      const day = String(date.getUTCDate()).padStart(2, '0');
                      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                      const year = date.getUTCFullYear();
                      return `${day}/${month}/${year}`;
                    })() : naDisplay}
                  </td>
                  <td className={tdStyle}>
                    {employee.employmentType === 'fullTime' ? 'Full Time' :
                      employee.employmentType === 'partTime' ? 'Part Time' : naDisplay}
                  </td>
                  <td className={tdStyle}>{employee.level || naDisplay}</td>
                  <td className={tdStyle}>{employee.phoneNumber || naDisplay}</td>
                  <td className={`${tdStyle} text-right`}>
                    <Link href={`/employees/${employee.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
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