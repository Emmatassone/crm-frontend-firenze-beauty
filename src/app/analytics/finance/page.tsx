'use client';

import { useEffect, useState, useMemo } from 'react';
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
  LineChart,
  Line,
} from 'recharts';

// Curated color palette for category lines
const CATEGORY_COLORS: Record<string, string> = {
  'Uñas': '#8b5cf6',            // violet
  'Pestañas y Cejas': '#f59e0b', // amber
  'Peluqueria': '#06b6d4',       // cyan
  'Maquillaje': '#f43f5e',       // rose
};
const FALLBACK_COLORS = ['#6366f1', '#14b8a6', '#e879f9', '#fb923c', '#a3e635', '#38bdf8', '#c084fc', '#fbbf24'];

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

  // Process financeData to extract category revenue into flat keys for LineChart
  const { chartData, categories } = useMemo(() => {
    const allCategories = new Set<string>();

    const processed = [...financeData].reverse().map(item => {
      const row: any = {
        ...item,
        net_service_revenue: Number(item.appointment_revenue || 0) - Number(item.total_salary_expenses || 0),
      };

      // Parse revenue_by_category — could be a JSON string or already an array
      let categoryArray: { category: string; revenue: number }[] = [];
      if (item.revenue_by_category) {
        if (typeof item.revenue_by_category === 'string') {
          try {
            categoryArray = JSON.parse(item.revenue_by_category);
          } catch { /* ignore parse errors */ }
        } else if (Array.isArray(item.revenue_by_category)) {
          categoryArray = item.revenue_by_category;
        }
      }

      // Flatten each category into a unique key on the row
      for (const entry of categoryArray) {
        if (entry.category && entry.revenue != null) {
          const key = `cat_${entry.category}`;
          row[key] = Number(entry.revenue);
          allCategories.add(entry.category);
        }
      }

      return row;
    });

    return { chartData: processed, categories: Array.from(allCategories) };
  }, [financeData]);

  // Assign a color to each category
  const getCategoryColor = (category: string, index: number): string => {
    // Check if any known key is contained in the category string
    for (const [knownKey, color] of Object.entries(CATEGORY_COLORS)) {
      if (category === knownKey) return color;
    }
    // For combined categories or unknown ones, use fallback
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
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

      {/* Ingresos Recientes — 3 curves: appointment revenue, net revenue, salary expenses */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingresos Recientes</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
              <Legend />
              <Line type="monotone" dataKey="appointment_revenue" name="Ingresos por Servicios" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="net_service_revenue" name="Ingresos Netos" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="total_salary_expenses" name="Gastos de Salarios" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tendencias de Ingresos y Gastos — stacked bar by category */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tendencias de Ingresos y Gastos</h2>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
              <Legend />
              {categories.map((cat, idx) => (
                <Bar
                  key={cat}
                  dataKey={`cat_${cat}`}
                  name={cat}
                  stackId="revenue"
                  fill={getCategoryColor(cat, idx)}
                  radius={idx === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
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
