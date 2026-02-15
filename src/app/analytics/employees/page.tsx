'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getDashboardSummary,
  getEmployeeMonthlyPerformance,
  getEmployeeRetentionFacts,
} from '@/lib/api/analytics';
import { getEmployees } from '@/lib/api';
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
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

type EmployeeRow = {
  month: string;
  employee_name: string;
  generated_income?: number;
  clients_attended?: number;
  avg_appointment_duration_minutes?: number;
  hourly_wage?: number;
  revenue_per_hour?: number;
  service_time_breakdown?: unknown;
  top_services_time_breakdown?: unknown;
};

type RetentionRow = {
  month: string;
  employee_name: string;
  retention_rate?: number;
  client_migration_rate?: number;
  new_client_rate?: number;
  retained_clients?: number;
  migrated_clients?: number;
  new_clients?: number;
};

export default function EmployeeAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeRow[]>([]);
  const [retentionData, setRetentionData] = useState<RetentionRow[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparisonEmployee, setComparisonEmployee] = useState('');
  const router = useRouter();
  const { canAccessAnalytics } = useAuthStore();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, analyticsData, employeesList, retention] = await Promise.all([
        getDashboardSummary(),
        getEmployeeMonthlyPerformance(),
        getEmployees(),
        getEmployeeRetentionFacts(),
      ]);
      setDashboardData(dashboard);
      setEmployeeData(analyticsData ?? []);
      setActiveEmployees(employeesList ?? []);
      setRetentionData(retention ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar analíticas de profesionales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAccessAnalytics) {
      router.push('/');
      return;
    }
    loadData();
  }, [canAccessAnalytics, loadData, router]);

  useEffect(() => {
    if (!selectedEmployee) {
      setIsCompareMode(false);
      setComparisonEmployee('');
      return;
    }

    if (comparisonEmployee === selectedEmployee) {
      setComparisonEmployee('');
    }
  }, [selectedEmployee, comparisonEmployee]);

  const formatCurrency = (value: number) => `$${Number(value || 0).toFixed(2)}`;
  const formatMinutesCell = (value?: number) => (value && value > 0 ? `${value} min` : '-');

  const currentMonth = employeeData[0]?.month || '';

  const companyRevenueByMonth = useMemo(() => {
    const revenueByMonth = employeeData.reduce((acc, row) => {
      const month = row.month;
      acc.set(month, (acc.get(month) || 0) + Number(row.generated_income || 0));
      return acc;
    }, new Map<string, number>());

    return Array.from(revenueByMonth.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [employeeData]);

  const companyCurrentMonthPerformance = useMemo(() => {
    if (!currentMonth) return [];
    return employeeData.filter((row) => row.month === currentMonth);
  }, [employeeData, currentMonth]);

  const companyCurrentMonthEfficiency = useMemo(() => {
    if (!currentMonth) return [];
    return employeeData
      .filter((row) => row.month === currentMonth && row.hourly_wage && row.revenue_per_hour)
      .map((row) => {
        const hourlyWage = Number(row.hourly_wage || 0);
        const revenuePerHour = Number(row.revenue_per_hour || 0);
        return {
          employee_name: row.employee_name,
          hourly_wage: hourlyWage,
          revenue_per_hour: revenuePerHour,
          efficiency_ratio: hourlyWage > 0 ? Number(((revenuePerHour / hourlyWage) * 100).toFixed(1)) : 0,
        };
      });
  }, [employeeData, currentMonth]);

  const selectedEmployeeMonthlyData = useMemo(() => {
    if (!selectedEmployee) return [];
    return employeeData
      .filter((row) => row.employee_name === selectedEmployee)
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [employeeData, selectedEmployee]);

  const selectedEmployeeLatest = selectedEmployeeMonthlyData[selectedEmployeeMonthlyData.length - 1];

  const selectedEmployeeRevenueByMonth = useMemo(() => {
    if (!selectedEmployee) return [];
    return selectedEmployeeMonthlyData.map((row) => ({
      month: row.month,
      revenue: Number(row.generated_income || 0),
    }));
  }, [selectedEmployee, selectedEmployeeMonthlyData]);

  const retentionSeries = useMemo(() => {
    const months = Array.from(new Set(retentionData.map((row) => row.month))).sort();

    return months.map((month) => {
      if (selectedEmployee) {
        const row = retentionData.find((item) => item.month === month && item.employee_name === selectedEmployee);
        return {
          month,
          retention_rate: row ? Number(row.retention_rate || 0) * 100 : 0,
          migration_rate: row ? Number(row.client_migration_rate || 0) * 100 : 0,
          new_client_rate: row ? Number(row.new_client_rate || 0) * 100 : 0,
          retained_count: row ? Number(row.retained_clients || 0) : 0,
          migrated_count: row ? Number(row.migrated_clients || 0) : 0,
          new_count: row ? Number(row.new_clients || 0) : 0,
        };
      }

      const monthRows = retentionData.filter((item) => item.month === month);
      if (monthRows.length === 0) {
        return {
          month,
          retention_rate: 0,
          migration_rate: 0,
          new_client_rate: 0,
          retained_count: 0,
          migrated_count: 0,
          new_count: 0,
        };
      }

      return {
        month,
        retention_rate:
          (monthRows.reduce((sum, item) => sum + Number(item.retention_rate || 0), 0) / monthRows.length) * 100,
        migration_rate:
          (monthRows.reduce((sum, item) => sum + Number(item.client_migration_rate || 0), 0) / monthRows.length) * 100,
        new_client_rate:
          (monthRows.reduce((sum, item) => sum + Number(item.new_client_rate || 0), 0) / monthRows.length) * 100,
        retained_count: monthRows.reduce((sum, item) => sum + Number(item.retained_clients || 0), 0),
        migrated_count: monthRows.reduce((sum, item) => sum + Number(item.migrated_clients || 0), 0),
        new_count: monthRows.reduce((sum, item) => sum + Number(item.new_clients || 0), 0),
      };
    });
  }, [retentionData, selectedEmployee]);

  const lastThreeEmployeeMonths = useMemo(() => {
    if (!selectedEmployee) return [];
    return [...selectedEmployeeMonthlyData]
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 3);
  }, [selectedEmployee, selectedEmployeeMonthlyData]);

  const serviceBreakdownTable = useMemo(() => {
    if (!selectedEmployee || lastThreeEmployeeMonths.length === 0) {
      return { months: [] as string[], rows: [] as Array<Record<string, unknown>> };
    }

    const serviceMap = new Map<string, Record<string, number>>();
    const months: string[] = [];

    lastThreeEmployeeMonths.forEach((row) => {
      months.push(row.month);
      let parsed = row.service_time_breakdown;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = [];
        }
      }

      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (!serviceMap.has(item.service)) {
            serviceMap.set(item.service, {});
          }
          serviceMap.get(item.service)![row.month] = Number(item.avg_duration_minutes || 0);
        });
      }
    });

    const rows = Array.from(serviceMap.entries()).map(([service, monthValues]) => {
      const tableRow: Record<string, unknown> = { service };
      months.forEach((month) => {
        tableRow[month] = monthValues[month] || 0;
      });
      return tableRow;
    });

    return { months, rows };
  }, [selectedEmployee, lastThreeEmployeeMonths]);

  const combinationsTable = useMemo(() => {
    if (!selectedEmployee || lastThreeEmployeeMonths.length === 0) {
      return { months: [] as string[], rows: [] as Array<Record<string, unknown>> };
    }

    const comboMap = new Map<string, Record<string, number>>();
    const months: string[] = [];

    lastThreeEmployeeMonths.forEach((row) => {
      months.push(row.month);
      let parsed = row.top_services_time_breakdown;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = [];
        }
      }

      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (!comboMap.has(item.service_combination)) {
            comboMap.set(item.service_combination, {});
          }
          comboMap.get(item.service_combination)![row.month] = Number(item.avg_duration_minutes || 0);
        });
      }
    });

    const rows = Array.from(comboMap.entries()).map(([combination, monthValues]) => {
      const tableRow: Record<string, unknown> = { combination };
      months.forEach((month) => {
        tableRow[month] = monthValues[month] || 0;
      });
      return tableRow;
    });

    return { months, rows };
  }, [selectedEmployee, lastThreeEmployeeMonths]);

  const latestServiceDurations = useMemo(() => {
    if (!selectedEmployee || lastThreeEmployeeMonths.length === 0) return [] as Array<{ name: string; minutes: number }>;

    const latestMonth = lastThreeEmployeeMonths[0];
    let parsed = latestMonth?.service_time_breakdown;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = [];
      }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: any) => ({
        name: String(item.service || 'Servicio'),
        minutes: Number(item.avg_duration_minutes || 0),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [selectedEmployee, lastThreeEmployeeMonths]);

  const latestCombinationDurations = useMemo(() => {
    if (!selectedEmployee || lastThreeEmployeeMonths.length === 0) return [] as Array<{ name: string; minutes: number }>;

    const latestMonth = lastThreeEmployeeMonths[0];
    let parsed = latestMonth?.top_services_time_breakdown;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = [];
      }
    }

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: any) => ({
        name: String(item.service_combination || 'Combinación'),
        minutes: Number(item.avg_duration_minutes || 0),
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);
  }, [selectedEmployee, lastThreeEmployeeMonths]);

  const comparisonEmployeeOptions = useMemo(() => {
    return activeEmployees.filter((employee) => employee.name !== selectedEmployee);
  }, [activeEmployees, selectedEmployee]);

  const comparisonServiceBreakdown = useMemo(() => {
    const compareMap = new Map<string, Record<string, number>>();
    if (!selectedEmployee || !comparisonEmployee || serviceBreakdownTable.months.length === 0) {
      return compareMap;
    }

    const monthsSet = new Set(serviceBreakdownTable.months);
    const rows = employeeData.filter(
      (row) => row.employee_name === comparisonEmployee && monthsSet.has(row.month),
    );

    rows.forEach((row) => {
      let parsed = row.service_time_breakdown;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = [];
        }
      }

      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          const serviceName = String(item.service || 'Servicio');
          if (!compareMap.has(serviceName)) {
            compareMap.set(serviceName, {});
          }
          compareMap.get(serviceName)![row.month] = Number(item.avg_duration_minutes || 0);
        });
      }
    });

    return compareMap;
  }, [selectedEmployee, comparisonEmployee, serviceBreakdownTable.months, employeeData]);

  const comparisonCombinationsBreakdown = useMemo(() => {
    const compareMap = new Map<string, Record<string, number>>();
    if (!selectedEmployee || !comparisonEmployee || combinationsTable.months.length === 0) {
      return compareMap;
    }

    const monthsSet = new Set(combinationsTable.months);
    const rows = employeeData.filter(
      (row) => row.employee_name === comparisonEmployee && monthsSet.has(row.month),
    );

    rows.forEach((row) => {
      let parsed = row.top_services_time_breakdown;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = [];
        }
      }

      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          const comboName = String(item.service_combination || 'Combinación');
          if (!compareMap.has(comboName)) {
            compareMap.set(comboName, {});
          }
          compareMap.get(comboName)![row.month] = Number(item.avg_duration_minutes || 0);
        });
      }
    });

    return compareMap;
  }, [selectedEmployee, comparisonEmployee, combinationsTable.months, employeeData]);

  const showComparisonColumns = isCompareMode && Boolean(comparisonEmployee);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando analíticas de profesionales...</p>
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analíticas de Profesionales</h1>
        <p className="text-gray-600 mt-2">Vista general del equipo y análisis individual por profesional.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700">
            Seleccionar profesional
          </label>
          {selectedEmployee && (
            <button
              type="button"
              onClick={() => setSelectedEmployee('')}
              className="text-sm font-medium text-pink-600 hover:text-pink-700"
            >
              Limpiar filtro
            </button>
          )}
        </div>
        <select
          id="employee-select"
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="">Seleccionar un profesional...</option>
          {activeEmployees.map((employee) => (
            <option key={employee.id} value={employee.name}>
              {employee.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-3">Elige un profesional para ver todas sus métricas históricas y de retención.</p>
      </div>

      {!selectedEmployee && (
      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Vista general del equipo</h2>
          <span className="text-sm text-gray-500">Mes actual: {currentMonth || 'N/A'}</span>
        </div>

        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-80">Mejor Profesional (Clientes)</h3>
              <p className="text-2xl font-bold mt-2">{dashboardData.topEmployees?.[0]?.employee_name || 'N/A'}</p>
              <p className="text-sm opacity-80">{dashboardData.topEmployees?.[0]?.clients_attended || 0} clientes</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-80">Servicio Más Popular</h3>
              <p className="text-2xl font-bold mt-2">{dashboardData.topServices?.[0]?.service_name || 'N/A'}</p>
              <p className="text-sm opacity-80">{dashboardData.topServices?.[0]?.appointment_count || 0} citas</p>
            </div>
          </div>
        )}

        {dashboardData?.topServices?.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Top 5 Servicios</h3>
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
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingresos Históricos (Equipo)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={companyRevenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
                <Area type="monotone" dataKey="revenue" name="Ingresos Generados" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Rendimiento por Profesional (Mes Actual)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyCurrentMonthPerformance}>
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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Eficiencia de Profesionales (Mes Actual)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={companyCurrentMonthEfficiency}>
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
                <Line yAxisId="right" type="monotone" dataKey="efficiency_ratio" name="Ratio de Eficiencia" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-4">* Ratio de Eficiencia = (Ingresos por Hora / Salario por Hora) × 100%</p>
        </div>
      </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Vista por profesional</h2>
        </div>

        {!selectedEmployee ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-600">
            Selecciona un profesional para mostrar el detalle individual.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white">
                <h3 className="text-sm font-medium opacity-80">Clientes Atendidos (Último Mes)</h3>
                <p className="text-3xl font-bold mt-2">{Number(selectedEmployeeLatest?.clients_attended || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
                <h3 className="text-sm font-medium opacity-80">Ingresos Generados (Último Mes)</h3>
                <p className="text-3xl font-bold mt-2">{formatCurrency(Number(selectedEmployeeLatest?.generated_income || 0))}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
                <h3 className="text-sm font-medium opacity-80">Duración Promedio (Último Mes)</h3>
                <p className="text-3xl font-bold mt-2">{Number(selectedEmployeeLatest?.avg_appointment_duration_minutes || 0)} min</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingresos Históricos - {selectedEmployee}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedEmployeeRevenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ingresos']} />
                    <Area type="monotone" dataKey="revenue" name="Ingresos Generados" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Rendimiento Mensual - {selectedEmployee}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedEmployeeMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#ec4899" />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="clients_attended" name="Clientes" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="avg_appointment_duration_minutes" name="Duración Prom. (min)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Retención de Clientes - {selectedEmployee}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={retentionSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: '%', position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => {
                        const payload = props?.payload || {};
                        let count = 0;
                        if (name === 'Tasa Retención') count = payload.retained_count || 0;
                        else if (name === 'Tasa Migración (Switch)') count = payload.migrated_count || 0;
                        else if (name === 'Tasa Nuevos') count = payload.new_count || 0;
                        return [`${Number(value || 0).toFixed(1)}% (${count})`, name];
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="retention_rate" name="Tasa Retención" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="migration_rate" name="Tasa Migración (Switch)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="new_client_rate" name="Tasa Nuevos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm text-gray-600">
                <div className="p-3 bg-green-50 rounded border border-green-100">
                  <span className="font-semibold text-green-700">Retención:</span> Clientes que regresan al MISMO profesional.
                </div>
                <div className="p-3 bg-yellow-50 rounded border border-yellow-100">
                  <span className="font-semibold text-yellow-700">Migración:</span> Clientes que regresan pero CAMBIAN de profesional.
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-100">
                  <span className="font-semibold text-blue-700">Nuevos:</span> Clientes que nunca habían sido atendidos.
                </div>
              </div>
            </div>

            {serviceBreakdownTable.rows.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Servicios (Último Mes)</h3>
                  <div className="space-y-3">
                    {latestServiceDurations.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{index + 1}. {item.name}</span>
                        <span className="font-medium text-gray-900">{item.minutes} min</span>
                      </div>
                    ))}
                    {latestServiceDurations.length === 0 && <p className="text-sm text-gray-500">Sin datos para el último mes.</p>}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Combinaciones (Último Mes)</h3>
                  <div className="space-y-3">
                    {latestCombinationDurations.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{index + 1}. {item.name}</span>
                        <span className="font-medium text-gray-900">{item.minutes} min</span>
                      </div>
                    ))}
                    {latestCombinationDurations.length === 0 && <p className="text-sm text-gray-500">Sin datos para el último mes.</p>}
                  </div>
                </div>
              </div>
            )}

            {serviceBreakdownTable.rows.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Comparar tablas detalladas</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompareMode) {
                        setIsCompareMode(false);
                        setComparisonEmployee('');
                      } else {
                        setIsCompareMode(true);
                      }
                    }}
                    className="text-sm font-medium text-pink-600 hover:text-pink-700"
                  >
                    {isCompareMode ? 'Quitar comparación' : 'Comparar con otro profesional'}
                  </button>
                </div>

                {isCompareMode && (
                  <div>
                    <label htmlFor="shared-compare-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Profesional a comparar
                    </label>
                    <select
                      id="shared-compare-select"
                      className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      value={comparisonEmployee}
                      onChange={(e) => setComparisonEmployee(e.target.value)}
                    >
                      <option value="">Seleccionar profesional...</option>
                      {comparisonEmployeeOptions.map((employee) => (
                        <option key={employee.id} value={employee.name}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {serviceBreakdownTable.rows.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Desglose de Tiempo por Servicio - {selectedEmployee} (Últimos 3 Meses)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      {showComparisonColumns ? (
                        <>
                          <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                            {serviceBreakdownTable.months.map((month) => (
                              <th key={month} colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {month}
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {serviceBreakdownTable.months.map((month) => (
                              <Fragment key={`service-header-${month}`}>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{selectedEmployee}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider bg-indigo-50">{comparisonEmployee}</th>
                              </Fragment>
                            ))}
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                          {serviceBreakdownTable.months.map((month) => (
                            <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {month}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {serviceBreakdownTable.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{String(row.service)}</td>
                          {serviceBreakdownTable.months.map((month) => (
                            showComparisonColumns ? (
                              <Fragment key={`${String(row.service)}-${month}-group`}>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {formatMinutesCell(Number(row[month] || 0))}
                                </td>
                                <td className="px-6 py-4 text-sm text-indigo-700 bg-indigo-50/50">
                                  {formatMinutesCell(comparisonServiceBreakdown.get(String(row.service))?.[month])}
                                </td>
                              </Fragment>
                            ) : (
                              <td key={month} className="px-6 py-4 text-sm text-gray-600">
                                {formatMinutesCell(Number(row[month] || 0))}
                              </td>
                            )
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {combinationsTable.rows.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Top 15 Combinaciones de Servicios - {selectedEmployee} (Últimos 3 Meses)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      {showComparisonColumns ? (
                        <>
                          <tr>
                            <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combinación de Servicios</th>
                            {combinationsTable.months.map((month) => (
                              <th key={month} colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {month}
                              </th>
                            ))}
                          </tr>
                          <tr>
                            {combinationsTable.months.map((month) => (
                              <Fragment key={`combo-header-${month}`}>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{selectedEmployee}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider bg-indigo-50">{comparisonEmployee}</th>
                              </Fragment>
                            ))}
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combinación de Servicios</th>
                          {combinationsTable.months.map((month) => (
                            <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {month}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {combinationsTable.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{String(row.combination)}</td>
                          {combinationsTable.months.map((month) => (
                            showComparisonColumns ? (
                              <Fragment key={`${String(row.combination)}-${month}-group`}>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {formatMinutesCell(Number(row[month] || 0))}
                                </td>
                                <td className="px-6 py-4 text-sm text-indigo-700 bg-indigo-50/50">
                                  {formatMinutesCell(comparisonCombinationsBreakdown.get(String(row.combination))?.[month])}
                                </td>
                              </Fragment>
                            ) : (
                              <td key={month} className="px-6 py-4 text-sm text-gray-600">
                                {formatMinutesCell(Number(row[month] || 0))}
                              </td>
                            )
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
