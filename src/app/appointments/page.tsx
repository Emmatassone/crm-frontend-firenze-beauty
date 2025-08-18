'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAppointments, Appointment } from '@/lib/api';
import AppointmentList from './AppointmentList';

// Helper to format date and time
const formatDateTime = (isoString?: string) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const data = await getAppointments();
        setAppointments(data);
      } catch (e: any) {
        console.error('Error al cargar turnos:', e);
        setError(e.message || "No se pudieron cargar los turnos. Por favor, inténtalo más tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center">
          <div className="text-lg">Cargando turnos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Turnos</h1>
        <Link href="/appointments/new" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition">
          Agregar Turno
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
           <span className="block sm:inline">{error}</span>
        </div>
      )}

      {!error && appointments.length === 0 && (
        <p className="text-gray-600">No hay turnos. Comienza agregando uno nuevo!</p>
      )}

      {!error && (
        <AppointmentList initialAppointments={appointments} />
      )}
    </div>
  );
}

export default AppointmentsPage; 