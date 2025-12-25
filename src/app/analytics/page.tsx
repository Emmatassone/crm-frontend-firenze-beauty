'use client';

import { useEffect, useState } from 'react';
import {
  getDashboardSummary,
  getFinanceMonthlyRevenue,
  getEmployeeMonthlyPerformance,
  getClientMonthlyBehavior,
} from '@/lib/api/analytics';
import { getEmployees } from '@/lib/api';
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
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

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
      const [analyticsData, employeesList] = await Promise.all([
        getEmployeeMonthlyPerformance(),
        getEmployees()
      ]);
      setEmployeeData(analyticsData);
      setActiveEmployees(employeesList);
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
              {/* Revenue & Expenses Trend - Line Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
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
                      <Line
                        type="monotone"
                        dataKey="appointment_revenue"
                        name="Ingresos por Servicios"
                        stroke="#ec4899"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="net_service_revenue"
                        name="Ingresos por servicios netos"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total_salary_expenses"
                        name="Gastos de Salarios"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Revenue - Bar Chart */}
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
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-6">
              {/* Employee Filter */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Empleado
                </label>
                <select
                  id="employee-select"
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value || null)}
                >
                  <option value="">Todos los empleados</option>
                  {activeEmployees.map(employee => (
                    <option key={employee.id} value={employee.name}>{employee.name}</option>
                  ))}
                </select>
              </div>

              {/* Historical Revenue by Employee */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Ingresos Históricos {selectedEmployee ? `- ${selectedEmployee}` : 'por Empleado'}
                </h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const filtered = selectedEmployee
                        ? employeeData.filter(e => e.employee_name === selectedEmployee)
                        : employeeData;

                      // Group by month and sum revenue
                      const revenueByMonth = filtered.reduce((acc, emp) => {
                        const existing = acc.find((item: { month: string, revenue: number }) => item.month === emp.month);
                        if (existing) {
                          existing.revenue += Number(emp.generated_income || 0);
                        } else {
                          acc.push({
                            month: emp.month,
                            revenue: Number(emp.generated_income || 0)
                          });
                        }
                        return acc;
                      }, [] as Array<{ month: string, revenue: number }>);

                      return revenueByMonth.reverse();
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
                      <Bar dataKey="revenue" name="Ingresos Generados" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Rendimiento {selectedEmployee ? `- ${selectedEmployee}` : '(Mes Actual)'}
                </h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      const filtered = selectedEmployee
                        ? employeeData.filter(e => e.employee_name === selectedEmployee)
                        : employeeData.filter(e => e.month === employeeData[0]?.month);
                      return filtered;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={selectedEmployee ? "month" : "employee_name"} />
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

              {/* Employee Efficiency Metrics - Current Month */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Eficiencia de Empleados (Mes Actual)
                </h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(() => {
                      // Get current month data for all employees
                      const currentMonth = employeeData[0]?.month;
                      const currentMonthData = employeeData
                        .filter(e => e.month === currentMonth && e.hourly_wage && e.revenue_per_hour)
                        .map(e => ({
                          employee_name: e.employee_name,
                          hourly_wage: Number(e.hourly_wage || 0),
                          revenue_per_hour: Number(e.revenue_per_hour || 0),
                          efficiency_ratio: e.hourly_wage > 0
                            ? ((Number(e.revenue_per_hour || 0) / Number(e.hourly_wage)) * 100).toFixed(1)
                            : 0
                        }));
                      return currentMonthData;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="employee_name" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" label={{ value: '$', position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: '%', position: 'insideRight' }} />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'Ratio de Eficiencia') {
                            return [`${value}%`, name];
                          }
                          return [formatCurrency(value), name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="hourly_wage" name="Salario por Hora" fill="#8b5cf6" />
                      <Bar yAxisId="left" dataKey="revenue_per_hour" name="Ingresos por Hora" fill="#ec4899" />
                      <Bar yAxisId="right" dataKey="efficiency_ratio" name="Ratio de Eficiencia" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * Ratio de Eficiencia = (Ingresos por Hora / Salario por Hora) × 100%
                </p>
              </div>

              {/* Service Time Breakdown */}
              {selectedEmployee && (() => {
                // Get last 3 months of data for the selected employee
                const employeeMonthlyData = employeeData
                  .filter(e => e.employee_name === selectedEmployee)
                  .sort((a, b) => b.month.localeCompare(a.month))
                  .slice(0, 3);

                if (employeeMonthlyData.length === 0) {
                  return null;
                }

                // Aggregate services across the last 3 months
                const serviceMap = new Map<string, { [month: string]: number }>();
                const months: string[] = [];

                employeeMonthlyData.forEach(data => {
                  const month = data.month;
                  months.push(month);

                  const services = typeof data.service_time_breakdown === 'string'
                    ? JSON.parse(data.service_time_breakdown)
                    : data.service_time_breakdown;

                  if (services && Array.isArray(services)) {
                    services.forEach((service: any) => {
                      if (!serviceMap.has(service.service)) {
                        serviceMap.set(service.service, {});
                      }
                      serviceMap.get(service.service)![month] = service.avg_duration_minutes;
                    });
                  }
                });

                if (serviceMap.size === 0) {
                  return null;
                }

                // Transform data for grouped bar chart
                const chartData = Array.from(serviceMap.entries()).map(([serviceName, monthlyDurations]) => {
                  const row: any = { service: serviceName };
                  months.forEach(month => {
                    row[month] = monthlyDurations[month] || 0;
                  });
                  return row;
                });

                // Month colors
                const monthColors = ['#ec4899', '#8b5cf6', '#3b82f6'];

                return (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Desglose de Tiempo por Servicio - {selectedEmployee} (Últimos 3 Meses)
                    </h2>
                    <div className="mb-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" label={{ value: 'Minutos', position: 'insideBottom', offset: -5 }} />
                          <YAxis dataKey="service" type="category" width={180} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [`${value} min`, '']} />
                          <Legend />
                          {months.map((month, idx) => (
                            <Bar
                              key={month}
                              dataKey={month}
                              fill={monthColors[idx]}
                              name={month}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Servicio
                            </th>
                            {months.map(month => (
                              <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {month}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {chartData.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.service}</td>
                              {months.map(month => (
                                <td key={month} className="px-6 py-4 text-sm text-gray-600">
                                  {row[month] ? `${row[month]} min` : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
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
          )}
        </>
      )}
    </div>
  );
}
