'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Appointment } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

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
  const { level, name } = useAuthStore();
  const isLevel123 = level === '1' || level === '2' || level === '3';

  const filteredAppointments = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = searchTerm ? initialAppointments.filter(appt => {
      const clientIdentifier = appt.clientName || appt.client?.name || appt.client?.phoneNumber || '';
      const formattedDate = formatDateTime(appt.appointmentDate).toLowerCase();
      const servicesText = Array.isArray(appt.serviceConsumed) ? appt.serviceConsumed.join(', ') : (appt.serviceConsumed || '');
      return (
        clientIdentifier.toLowerCase().includes(lowerCaseSearchTerm) ||
        formattedDate.includes(lowerCaseSearchTerm) || // Search in formatted date
        servicesText.toLowerCase().includes(lowerCaseSearchTerm) || // Also allow search by service
        appt.attendedEmployee.toLowerCase().includes(lowerCaseSearchTerm) || // And by employee
        (appt.arrivalTime || '').includes(lowerCaseSearchTerm) || // And by start time
        (appt.leaveTime || '').includes(lowerCaseSearchTerm) // And by end time
      );
    }) : initialAppointments;

    // Filter by employee if level 1, 2, or 3
    let results = filtered;
    if (isLevel123 && name) {
      results = results.filter(appt =>
        appt.attendedEmployee.toLowerCase().includes(name.toLowerCase())
      );
    }

    // Sort by date (descending) and then arrival time (descending)
    return [...results].sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();

      if (dateB !== dateA) {
        return dateB - dateA; // Descending date
      }

      // If same date, compare arrivalTime (descending)
      const timeA = a.arrivalTime || '00:00';
      const timeB = b.arrivalTime || '00:00';
      return timeB.localeCompare(timeA);
    });
  }, [searchTerm, initialAppointments, isLevel123, name]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por cliente, fecha, horario, servicio, profesional..."
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
        <div className="shadow-xl rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[400px]">
            <table className="min-w-full divide-y divide-gray-200 bg-white border-separate border-spacing-0">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Cliente</th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Servicio</th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Fecha</th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Inicio</th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Fin</th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200`}>Profesional</th>
                  <th scope="col" className={`${thStyle} sticky top-0 right-0 bg-gray-50 border-b border-l border-gray-200 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appt, index) => {
                  const isEven = index % 2 === 0;
                  const rowBg = isEven ? 'bg-white' : 'bg-gray-50';

                  return (
                    <tr
                      key={appt.id}
                      className={`hover:bg-pink-50 group transition ${rowBg}`}
                    >
                      <td className={tdStyle}>{appt.clientName || appt.client?.name || appt.client?.phoneNumber || 'N/D'}</td>
                      <td className={tdStyle}>{Array.isArray(appt.serviceConsumed) ? appt.serviceConsumed.join(', ') : appt.serviceConsumed}</td>
                      <td className={tdStyle}>{formatDateTime(appt.appointmentDate)}</td>
                      <td className={tdStyle}>{appt.arrivalTime || 'N/D'}</td>
                      <td className={tdStyle}>{appt.leaveTime || 'N/D'}</td>
                      <td className={tdStyle}>{appt.attendedEmployee}</td>
                      <td className={`${tdStyle} text-right sticky right-0 border-l border-gray-200 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] ${rowBg} group-hover:bg-pink-50`}>
                        {!isLevel123 && (
                          <Link href={`/appointments/${appt.id}`} className="text-pink-600 hover:text-pink-800 font-medium">
                            Ver Detalles
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}