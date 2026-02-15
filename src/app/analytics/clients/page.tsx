'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientMonthlyBehavior } from '@/lib/api/analytics';
import { useAuthStore } from '@/lib/store/auth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ClientAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any[]>([]);
  const router = useRouter();
  const { canAccessAnalytics } = useAuthStore();

  useEffect(() => {
    if (!canAccessAnalytics) {
      router.push('/');
      return;
    }
    loadData();
  }, [canAccessAnalytics]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getClientMonthlyBehavior();
      setClientData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analíticas de clientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando analíticas de clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analíticas de Clientes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Appointment Frequency vs Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frecuencia de Citas vs Productos</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={clientData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client_name" angle={-45} textAnchor="end" height={100} interval={0} fontSize={10} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="appointment_frequency" name="Citas" fill="#8b5cf6" />
              <Bar dataKey="product_frequency" name="Productos" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribución por Edad</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={(() => {
              const ageGroups: Record<string, number> = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0 };
              clientData.forEach((c: any) => {
                const age = c.client_age;
                if (age) {
                  if (age <= 25) ageGroups['18-25']++;
                  else if (age <= 35) ageGroups['26-35']++;
                  else if (age <= 45) ageGroups['36-45']++;
                  else if (age <= 60) ageGroups['46-60']++;
                  else ageGroups['60+']++;
                }
              });
              return Object.entries(ageGroups).map(([range, count]) => ({ range, count }));
            })()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="Clientes" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
