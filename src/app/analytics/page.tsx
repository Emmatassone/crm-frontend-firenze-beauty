'use client';

import { useEffect, useState } from 'react';
import {
  getDashboardSummary,
  getFinanceMonthlyRevenue,
  getEmployeeMonthlyPerformance,
  getClientMonthlyBehavior,
} from '@/lib/api/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// Color palette for charts
const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'employees' | 'clients'>('dashboard');

  // Data states
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [clientData, setClientData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboardSummary();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const data = await getFinanceMonthlyRevenue();
      setFinanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeMonthlyPerformance();
      setEmployeeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadClientData = async () => {
    try {
      setLoading(true);
      const data = await getClientMonthlyBehavior();
      setClientData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    setError(null);

    if (tab === 'finance' && financeData.length === 0) {
      await loadFinanceData();
    } else if (tab === 'employees' && employeeData.length === 0) {
      await loadEmployeeData();
    } else if (tab === 'clients' && clientData.length === 0) {
      await loadClientData();
    }
  };

  const formatCurrency = (value: number) => `$${Number(value).toFixed(2)}`;

  if (loading && activeTab === 'dashboard' && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando analíticas...</p>
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

  const tabNames = {
    dashboard: 'Panel',
    finance: 'Finanzas',
    employees: 'Empleados',
    clients: 'Clientes'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Analíticas Mensuales</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
        {(Object.keys(tabNames) as Array<keyof typeof tabNames>).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-pink-600'
              }`}
          >
            {tabNames[tab]}
          </button>
        ))}
      </div>

      {loading && activeTab !== 'dashboard' ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">Ingresos Totales (Mes Actual)</h3>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(dashboardData.finance?.total_revenue || 0)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">Mejor Empleado (Clientes)</h3>
                  <p className="text-2xl font-bold mt-2">{dashboardData.topEmployees?.[0]?.employee_name || 'N/A'}</p>
                  <p className="text-sm opacity-80">{dashboardData.topEmployees?.[0]?.clients_attended || 0} clientes</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <h3 className="text-sm font-medium opacity-80">Servicio Más Popular</h3>
                  <p className="text-2xl font-bold mt-2">{dashboardData.topServices?.[0]?.service_name || 'N/A'}</p>
                  <p className="text-sm opacity-80">{dashboardData.topServices?.[0]?.appointment_count || 0} citas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Revenue Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
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

                {/* Top Services Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 5 Servicios</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.topServices} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="service_name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="appointment_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Citas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Desglose de Ingresos Mensuales</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...financeData].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Bar dataKey="appointment_revenue" name="Servicios" stackId="a" fill="#ec4899" />
                      <Bar dataKey="product_revenue" name="Productos" stackId="a" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rendimiento de Empleados (Mes Actual)</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="employee_name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#ec4899" />
                      <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="clients_attended" name="Clientes" fill="#ec4899" />
                      <Bar yAxisId="right" dataKey="avg_appointment_duration_minutes" name="Duración Prom. (min)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribución por Edad</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={(() => {
                      const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0 };
                      clientData.forEach(c => {
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
          )}
        </>
      )}
    </div>
  );
}
