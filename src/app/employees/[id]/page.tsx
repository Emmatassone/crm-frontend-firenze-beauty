'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEmployeeById, updateEmployee, deductVacation, type Employee } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { canAccessAnalytics } = useAuthStore();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields state
  const [editableStatus, setEditableStatus] = useState<Employee['status'] | ''>('');
  const [editableHireDate, setEditableHireDate] = useState<string>('');
  const [editableEmploymentType, setEditableEmploymentType] = useState<Employee['employmentType'] | ''>('');
  const [editableMonthlySalary, setEditableMonthlySalary] = useState<string>('');
  const [editableWeeklyWorkingHours, setEditableWeeklyWorkingHours] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Vacation deduction state
  const [vacationDaysToDeduct, setVacationDaysToDeduct] = useState<number>(1);
  const [isDeducting, setIsDeducting] = useState(false);
  const [deductError, setDeductError] = useState<string | null>(null);
  const [deductSuccess, setDeductSuccess] = useState(false);

  // Weekly work hours state
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysInSpanish: Record<string, string> = {
    'Sunday': 'Domingo',
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado'
  };
  const [weeklyWorkHours, setWeeklyWorkHours] = useState<Record<string, { 'check-in': string; 'check-out': string }>>(
    daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { 'check-in': '', 'check-out': '' } }), {})
  );
  const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getEmployeeById(id)
      .then((data) => {
        if (isMounted) {
          setEmployee(data);
          setEditableStatus(data.status);
          setEditableHireDate(data.hireDate || '');
          setEditableEmploymentType(data.employmentType || 'fullTime');
          setEditableMonthlySalary(data.monthlySalary?.toString() || '');
          setEditableWeeklyWorkingHours(data.weeklyWorkingHours?.toString() || '');

          // Initialize weekly work hours
          if (data.weekly_work_hours) {
            setWeeklyWorkHours(data.weekly_work_hours);
          } else {
            // Set default empty values
            setWeeklyWorkHours(
              daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { 'check-in': '', 'check-out': '' } }), {})
            );
          }
        }
      })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar el profesional'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  const handleUpdate = async (field: 'status' | 'hireDate' | 'employmentType' | 'monthlySalary' | 'weeklyWorkingHours') => {
    if (!id || !employee) return;

    let value: any;
    if (field === 'status') value = editableStatus;
    else if (field === 'hireDate') value = editableHireDate;
    else if (field === 'employmentType') value = editableEmploymentType;
    else if (field === 'monthlySalary') value = editableMonthlySalary ? parseFloat(editableMonthlySalary) : null;
    else if (field === 'weeklyWorkingHours') value = editableWeeklyWorkingHours ? parseInt(editableWeeklyWorkingHours) : null;

    // Compare with current value
    const currentValue = (employee as any)[field];
    if (value === currentValue || (value === null && currentValue === undefined)) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateEmployee(id, { [field]: value });
      setEmployee(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || `Error al actualizar ${field}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!id || !newPassword || newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await updateEmployee(id, { password: newPassword });
      setPasswordSuccess(true);
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeductVacation = async () => {
    if (!id || !employee) return;

    setIsDeducting(true);
    setDeductError(null);
    setDeductSuccess(false);

    try {
      const updated = await deductVacation(id, vacationDaysToDeduct);
      setEmployee(updated);
      setDeductSuccess(true);
      setVacationDaysToDeduct(1);
      setTimeout(() => setDeductSuccess(false), 3000);
    } catch (err: any) {
      setDeductError(err?.message || 'Error al descontar vacaciones');
    } finally {
      setIsDeducting(false);
    }
  };

  const handleWorkHourChange = (day: string, field: 'check-in' | 'check-out', value: string) => {
    setWeeklyWorkHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveWorkHours = async () => {
    if (!id || !employee) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await updateEmployee(id, { weekly_work_hours: weeklyWorkHours });
      setEmployee(updated);
      setIsEditingWorkHours(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Error al actualizar horarios de trabajo');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando profesional…</div>;
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Profesional no encontrado'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  const statusLabels: Record<Employee['status'], string> = {
    active: 'Activo',
    suspended: 'Suspendido',
    retired: 'Retirado',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Profesional</h1>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>

      {/* Vacation Stats Card */}
      {employee.hireDate && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">📅 Vacaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{employee.totalVacationDays ?? 0}</div>
              <div className="text-sm opacity-90">Días Totales</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{employee.vacationTaken ?? 0}</div>
              <div className="text-sm opacity-90">Días Tomados</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{employee.vacationBalance ?? 0}</div>
              <div className="text-sm opacity-90">Días Disponibles</div>
            </div>
          </div>

          {/* Deduct Vacation Section */}
          {canAccessAnalytics && (
            <div className="mt-4 pt-4 border-t border-white/30">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium">Descontar Vacaciones:</label>
                <input
                  type="number"
                  min="1"
                  max={employee.vacationBalance ?? 0}
                  value={vacationDaysToDeduct}
                  onChange={(e) => setVacationDaysToDeduct(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 border border-white/30 rounded-md bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  disabled={isDeducting}
                />
                <span className="text-sm">días</span>
                <button
                  onClick={handleDeductVacation}
                  disabled={isDeducting || (employee.vacationBalance ?? 0) <= 0}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 text-sm font-medium transition"
                >
                  {isDeducting ? 'Descontando...' : '➖ Descontar Vacaciones'}
                </button>
              </div>
              {deductSuccess && <span className="text-green-200 text-sm mt-2 block">✓ Vacaciones descontadas correctamente</span>}
              {deductError && <span className="text-red-200 text-sm mt-2 block">{deductError}</span>}
            </div>
          )}
        </div>
      )}

      {!employee.hireDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <strong>Nota:</strong> Este profesional no tiene fecha de contratación registrada. Configure la fecha de contratación para calcular las vacaciones.
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><div className="text-sm text-gray-500">Nombre</div><div className="text-lg text-gray-900">{employee.name}</div></div>
        <div><div className="text-sm text-gray-500">Correo</div><div className="text-lg text-gray-900">{employee.email}</div></div>
        <div><div className="text-sm text-gray-500">Puesto(s)</div><div className="text-lg text-gray-900">{employee.jobTitle.join(', ')}</div></div>
        <div>
          <div className="text-sm text-gray-500">Estado</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <select
                value={editableStatus}
                onChange={(e) => setEditableStatus(e.target.value as Employee['status'])}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                disabled={isSaving}
              >
                <option value="active">{statusLabels.active}</option>
                <option value="suspended">{statusLabels.suspended}</option>
                <option value="retired">{statusLabels.retired}</option>
              </select>
              {editableStatus !== employee.status && (
                <button
                  onClick={() => handleUpdate('status')}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'active' ? 'bg-green-100 text-green-800' :
                employee.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {statusLabels[employee.status]}
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Fecha de Contratación</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <input
                type="date"
                value={editableHireDate}
                onChange={(e) => setEditableHireDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                disabled={isSaving}
              />
              {editableHireDate !== (employee.hireDate || '') && (
                <button
                  onClick={() => handleUpdate('hireDate')}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              {employee.hireDate ? (() => {
                const date = new Date(employee.hireDate);
                const day = String(date.getUTCDate()).padStart(2, '0');
                const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                const year = date.getUTCFullYear();
                return `${day}/${month}/${year}`;
              })() : 'N/D'}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Tipo de Empleo</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <select
                value={editableEmploymentType}
                onChange={(e) => setEditableEmploymentType(e.target.value as Employee['employmentType'])}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                disabled={isSaving}
              >
                <option value="fullTime">Full Time</option>
                <option value="partTime">Part Time</option>
              </select>
              {editableEmploymentType !== (employee.employmentType || 'fullTime') && (
                <button
                  onClick={() => handleUpdate('employmentType')}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              {employee.employmentType === 'fullTime' ? 'Full Time' :
                employee.employmentType === 'partTime' ? 'Part Time' : 'N/D'}
            </div>
          )}
        </div>

        <div><div className="text-sm text-gray-500">Nivel</div><div className="text-lg text-gray-900">{employee.level || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Teléfono</div><div className="text-lg text-gray-900">{employee.phoneNumber || 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Dirección</div><div className="text-lg text-gray-900">{employee.address || 'N/D'}</div></div>

        {/* Monthly Salary */}
        <div>
          <div className="text-sm text-gray-500">Salario Mensual</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editableMonthlySalary}
                  onChange={(e) => setEditableMonthlySalary(e.target.value)}
                  className="pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm w-40"
                  disabled={isSaving}
                  placeholder="0.00"
                />
              </div>
              {editableMonthlySalary !== (employee.monthlySalary?.toString() || '') && (
                <button
                  onClick={() => handleUpdate('monthlySalary')}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              {employee.monthlySalary ? `$${Number(employee.monthlySalary).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'N/D'}
            </div>
          )}
        </div>

        {/* Weekly Working Hours */}
        <div>
          <div className="text-sm text-gray-500">Horas Semanales</div>
          {canAccessAnalytics ? (
            <div className="flex items-center gap-3 mt-1">
              <input
                type="number"
                min="1"
                max="168"
                value={editableWeeklyWorkingHours}
                onChange={(e) => setEditableWeeklyWorkingHours(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm w-24"
                disabled={isSaving}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">hs/semana</span>
              {editableWeeklyWorkingHours !== (employee.weeklyWorkingHours?.toString() || '') && (
                <button
                  onClick={() => handleUpdate('weeklyWorkingHours')}
                  disabled={isSaving}
                  className="px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-900">
              {employee.weeklyWorkingHours ? `${employee.weeklyWorkingHours} hs/semana` : 'N/D'}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Fecha de Nacimiento</div>
          <div className="text-lg text-gray-900">
            {employee.dateOfBirth ? (() => {
              const date = new Date(employee.dateOfBirth);
              const day = String(date.getUTCDate()).padStart(2, '0');
              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
              const year = date.getUTCFullYear();
              return `${day}/${month}/${year}`;
            })() : 'N/D'}
          </div>
        </div>
        <div><div className="text-sm text-gray-500">Creado</div><div className="text-lg text-gray-900">{employee ? new Date(employee.createdAt).toLocaleString() : 'N/D'}</div></div>
        <div><div className="text-sm text-gray-500">Actualizado</div><div className="text-lg text-gray-900">{employee ? new Date(employee.updatedAt).toLocaleString() : 'N/D'}</div></div>

        {/* Save messages at the bottom of the grid or separate container */}
        <div className="col-span-1 md:col-span-2">
          {saveSuccess && <span className="text-green-600 text-sm block">✓ Cambios guardados correctamente</span>}
          {saveError && <span className="text-red-600 text-sm block">{saveError}</span>}
        </div>
      </div>

      {/* Change Password Section (Level 6 only) */}
      {canAccessAnalytics && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Cambiar Contraseña
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
                disabled={isChangingPassword}
              />
            </div>
            <button
              onClick={handleUpdatePassword}
              disabled={isChangingPassword || !newPassword}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 text-sm font-medium transition flex items-center gap-2"
            >
              {isChangingPassword ? 'Cambiando...' : 'Actualizar Contraseña'}
            </button>
          </div>
          {passwordSuccess && <span className="text-green-600 text-sm mt-2 block font-medium">✓ Contraseña actualizada correctamente</span>}
          {passwordError && <span className="text-red-600 text-sm mt-2 block font-medium">{passwordError}</span>}
          <p className="mt-2 text-xs text-gray-400">
            Esta acción permite a un administrador (Nivel 6) resetear la contraseña de cualquier usuario.
          </p>
        </div>
      )}

      {/* Weekly Work Hours Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Horarios Semanales</h2>
          {canAccessAnalytics && !isEditingWorkHours && (
            <button
              onClick={() => setIsEditingWorkHours(true)}
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 text-sm font-medium"
            >
              ✏️ Editar Horarios
            </button>
          )}
          {canAccessAnalytics && isEditingWorkHours && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveWorkHours}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                {isSaving ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button
                onClick={() => {
                  setIsEditingWorkHours(false);
                  // Reset to original values
                  if (employee?.weekly_work_hours) {
                    setWeeklyWorkHours(employee.weekly_work_hours);
                  } else {
                    setWeeklyWorkHours(
                      daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: { 'check-in': '', 'check-out': '' } }), {})
                    );
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                ✕ Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salida
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {daysOfWeek.map((day) => (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {daysInSpanish[day]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isEditingWorkHours && canAccessAnalytics ? (
                      <input
                        type="time"
                        value={weeklyWorkHours[day]?.['check-in'] || ''}
                        onChange={(e) => handleWorkHourChange(day, 'check-in', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                    ) : (
                      <span>{weeklyWorkHours[day]?.['check-in'] || 'N/D'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isEditingWorkHours && canAccessAnalytics ? (
                      <input
                        type="time"
                        value={weeklyWorkHours[day]?.['check-out'] || ''}
                        onChange={(e) => handleWorkHourChange(day, 'check-out', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                      />
                    ) : (
                      <span>{weeklyWorkHours[day]?.['check-out'] || 'N/D'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
