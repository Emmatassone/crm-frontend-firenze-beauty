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
  const [clientFilter, setClientFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startTimeFilter, setStartTimeFilter] = useState('');
  const [endTimeFilter, setEndTimeFilter] = useState('');
  const [professionalFilter, setProfessionalFilter] = useState('');
  const { level, name } = useAuthStore();
  const isLevel123 = level === '1' || level === '2' || level === '3';

  const filteredAppointments = useMemo(() => {
    let results = initialAppointments;

    // Filter by general search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      results = results.filter(appt => {
        const clientIdentifier = appt.clientName || appt.client?.name || appt.client?.phoneNumber || '';
        const formattedDate = formatDateTime(appt.appointmentDate).toLowerCase();
        const servicesText = Array.isArray(appt.serviceConsumed) ? appt.serviceConsumed.join(', ') : (appt.serviceConsumed || '');
        return (
          clientIdentifier.toLowerCase().includes(lowerCaseSearchTerm) ||
          formattedDate.includes(lowerCaseSearchTerm) ||
          servicesText.toLowerCase().includes(lowerCaseSearchTerm) ||
          appt.attendedEmployee.toLowerCase().includes(lowerCaseSearchTerm) ||
          (appt.arrivalTime || '').includes(lowerCaseSearchTerm) ||
          (appt.leaveTime || '').includes(lowerCaseSearchTerm)
        );
      });
    }

    // Filter by specific columns
    if (clientFilter) {
      results = results.filter(appt => {
        const clientIdentifier = appt.clientName || appt.client?.name || appt.client?.phoneNumber || '';
        return clientIdentifier.toLowerCase().includes(clientFilter.toLowerCase());
      });
    }

    if (serviceFilter) {
      results = results.filter(appt => {
        const servicesText = Array.isArray(appt.serviceConsumed) ? appt.serviceConsumed.join(', ') : (appt.serviceConsumed || '');
        return servicesText.toLowerCase().includes(serviceFilter.toLowerCase());
      });
    }

    if (dateFilter) {
      results = results.filter(appt => {
        const formattedDate = formatDateTime(appt.appointmentDate).toLowerCase();
        return formattedDate.includes(dateFilter.toLowerCase());
      });
    }

    if (startTimeFilter) {
      results = results.filter(appt => {
        return (appt.arrivalTime || '').includes(startTimeFilter);
      });
    }

    if (endTimeFilter) {
      results = results.filter(appt => {
        return (appt.leaveTime || '').includes(endTimeFilter);
      });
    }

    if (professionalFilter) {
      results = results.filter(appt => {
        return appt.attendedEmployee.toLowerCase().includes(professionalFilter.toLowerCase());
      });
    }

    // Filter by employee if level 1, 2, or 3
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
  }, [searchTerm, clientFilter, serviceFilter, dateFilter, startTimeFilter, endTimeFilter, professionalFilter, initialAppointments, isLevel123, name]);

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
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Cliente</span>
                      <input
                        type="text"
                        placeholder="Filtrar cliente..."
                        className="w-full min-w-[120px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Servicio</span>
                      <input
                        type="text"
                        placeholder="Filtrar servicio..."
                        className="w-full min-w-[120px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Fecha</span>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        className="w-full min-w-[100px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Inicio</span>
                      <input
                        type="text"
                        placeholder="Ej: 10:00"
                        className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={startTimeFilter}
                        onChange={(e) => setStartTimeFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Fin</span>
                      <input
                        type="text"
                        placeholder="Ej: 11:00"
                        className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={endTimeFilter}
                        onChange={(e) => setEndTimeFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 bg-gray-50 border-b border-gray-200 align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Profesional</span>
                      <input
                        type="text"
                        placeholder="Filtrar prof..."
                        className="w-full min-w-[120px] px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-gray-400 bg-white shadow-sm"
                        value={professionalFilter}
                        onChange={(e) => setProfessionalFilter(e.target.value)}
                      />
                    </div>
                  </th>
                  <th scope="col" className={`${thStyle} sticky top-0 right-0 bg-gray-50 border-b border-l border-gray-200 z-30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] align-top`}>
                    <div className="flex flex-col space-y-2">
                      <span>Acciones</span>
                      <div className="h-[26px]"></div>
                    </div>
                  </th>
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