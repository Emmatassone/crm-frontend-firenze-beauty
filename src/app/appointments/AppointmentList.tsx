'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Appointment } from '@/lib/api';

interface AppointmentListProps {
  initialAppointments: Appointment[];
}

const thStyle = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdStyle = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";

const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'N/D';
  try {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) { return 'Fecha Inválida'; }
};

export default function AppointmentList({ initialAppointments }: AppointmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return initialAppointments;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return initialAppointments.filter(appt => {
      const clientIdentifier = appt.clientName || appt.client?.name || appt.client?.phoneNumber || '';
      const formattedDate = formatDateTime(appt.appointmentDate).toLowerCase();
      return (
        clientIdentifier.toLowerCase().includes(lowerCaseSearchTerm) ||
        formattedDate.includes(lowerCaseSearchTerm) || // Search in formatted date
        appt.serviceConsumed.toLowerCase().includes(lowerCaseSearchTerm) || // Also allow search by service
        appt.attendedEmployee.toLowerCase().includes(lowerCaseSearchTerm) // And by employee
      );
    });
  }, [searchTerm, initialAppointments]);

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por cliente, fecha, servicio, empleado..."
          className="mt-1 block w-full md:w-1/2 lg:w-1/3 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredAppointments.length === 0 && searchTerm && (
        <p className="text-gray-600">No se encontraron turnos con el término "{searchTerm}".</p>
      )}
       {filteredAppointments.length === 0 && !searchTerm && initialAppointments.length > 0 && (
         <p className="text-gray-600">No hay turnos que coincidan con su búsqueda actual, pero sí hay turnos registrados.</p>
      )}

      {filteredAppointments.length > 0 && (
        <div className="shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={thStyle}>Cliente</th>
                <th scope="col" className={thStyle}>Servicio</th>
                <th scope="col" className={thStyle}>Fecha</th>
                <th scope="col" className={thStyle}>Empleado</th>
                <th scope="col" className={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-gray-50 transition">
                  <td className={tdStyle}>{appt.clientName || appt.client?.name || appt.client?.phoneNumber || 'N/D'}</td>
                  <td className={tdStyle}>{appt.serviceConsumed}</td>
                  <td className={tdStyle}>{formatDateTime(appt.appointmentDate)}</td>
                  <td className={tdStyle}>{appt.attendedEmployee}</td>
                  <td className={`${tdStyle} text-right`}>
                    <Link href={`/appointments/${appt.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
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