'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDashboardSummary,
  getFinanceMonthlyRevenue,
} from '@/lib/api/analytics';
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
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';

export default function FinanceAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [financeData, setFinanceData] = useState<any[]>([]);
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
      const [dashboard, finance] = await Promise.all([
        getDashboardSummary(),
        getFinanceMonthlyRevenue(),
      ]);
      setDashboardData(dashboard);
      setFinanceData(finance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analíticas financieras');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando analíticas financieras...</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analíticas Financieras</h1>

      {/* Summary Card from Dashboard */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-80">Ingresos Totales (Mes Actual)</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(dashboardData.finance?.total_revenue || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
            <h3 className="text-sm font-medium opacity-80">Ingresos por Servicios (Mes Actual)</h3>
            <p className="text-3xl font-bold mt-2">{formatCurrency(dashboardData.finance?.appointment_revenue || 0)}</p>
          </div>
        </div>
      )}

      {/* Recent Revenue Chart from Dashboard */}
      {dashboardData?.recentRevenue?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingresos Recientes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[...dashboardData.recentRevenue].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
              <Area type="monotone" dataKey="total_revenue" stroke="#ec4899" fill="#fce7f3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Revenue & Expenses Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tendencias de Ingresos y Gastos</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...financeData].reverse().map(item => ({
              ...item,
              net_service_revenue: Number(item.appointment_revenue || 0) - Number(item.total_salary_expenses || 0)
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
              <Legend />
              <Line type="monotone" dataKey="appointment_revenue" name="Ingresos por Servicios" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="net_service_revenue" name="Ingresos por servicios netos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total_salary_expenses" name="Gastos de Salarios" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Revenue */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingresos por Productos</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[...financeData].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Productos']} />
              <Legend />
              <Bar dataKey="product_revenue" name="Productos" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
