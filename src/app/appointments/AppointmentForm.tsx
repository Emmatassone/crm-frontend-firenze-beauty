'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Select from 'react-select';
import { Appointment, ClientProfile, Employee, getEmployees, getServices, Service } from '@/lib/api';
import { useEffect, useState } from 'react';

const appointmentSchema = z.object({
  appointmentDate: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^d{2}-d{2}-d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  attendedEmployee: z.string().min(1, 'El empleado es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientId: z.string().min(1, 'El ID del cliente es requerido'),
  arrivalTime: z.string().optional(),
  leaveTime: z.string().optional(),
  serviceConsumed: z.string().min(1, 'El servicio es requerido'),
  usedDiscount: z.string().optional(),
  additionalComments: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onSubmit: SubmitHandler<AppointmentFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<AppointmentFormValues>;
  isEdit?: boolean;
  clients: ClientProfile[];
}

export default function AppointmentForm({ onSubmit, isLoading, defaultValues, isEdit = false, clients }: AppointmentFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [employeeData, serviceData] = await Promise.all([
          getEmployees(),
          getServices(),
        ]);
        setEmployees(employeeData);
        setServices(serviceData);
      } catch (e) {
        console.error("Error al cargar datos para el formulario", e);
      }
    }
    fetchData();
  }, []);
    
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      ...defaultValues,
      appointmentDate: defaultValues?.appointmentDate ? (() => {
          const date = new Date(defaultValues.appointmentDate);
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          return `${day}-${month}-${year}`;
      })() : '',
    },
  });

  const selectedClientId = watch('clientId');

  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (selectedClient) {
        setValue('clientName', selectedClient.name || selectedClient.phoneNumber || '');
      }
    } else {
      setValue('clientName', ''); // Clear if no client is selected
    }
  }, [selectedClientId, clients, setValue]);

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const errorStyle = "mt-1 text-xs text-red-600";
  const textareaStyle = `${inputStyle} h-24`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
        <div>
            <label htmlFor="appointmentDate" className={labelStyle}>Fecha de la Cita</label>
            <input id="appointmentDate" type="text" placeholder="DD-MM-AAAA" {...register('appointmentDate')} className={`${inputStyle} ${errors.appointmentDate ? 'border-red-500' : ''}`} />
            {errors.appointmentDate && <p className={errorStyle}>{errors.appointmentDate.message}</p>}
        </div>

        <div>
            <label htmlFor="clientId" className={labelStyle}>Cliente</label>
            <select id="clientId" {...register('clientId')} className={`${inputStyle} ${errors.clientId ? 'border-red-500' : ''}`}>
                <option value="">Seleccione un cliente</option>
                {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                ))}
            </select>
            {errors.clientId && <p className={errorStyle}>{errors.clientId.message}</p>}
        </div>
        
        <div>
          <label htmlFor="clientName" className={labelStyle}>Nombre del Cliente (auto-rellenado)</label>
          <input id="clientName" type="text" {...register('clientName')} readOnly className={`${inputStyle} bg-gray-100 ${errors.clientName ? 'border-red-500' : ''}`} />
          {errors.clientName && <p className={errorStyle}>{errors.clientName.message}</p>}
        </div>

        <div>
            <label htmlFor="attendedEmployee" className={labelStyle}>Empleado que Atendió</label>
            <select id="attendedEmployee" {...register('attendedEmployee')} className={`${inputStyle} ${errors.attendedEmployee ? 'border-red-500' : ''}`}>
                <option value="">Seleccione un empleado</option>
                {employees.map(employee => (
                    <option key={employee.id} value={employee.name}>{employee.name}</option>
                ))}
            </select>
            {errors.attendedEmployee && <p className={errorStyle}>{errors.attendedEmployee.message}</p>}
        </div>

        <div>
            <label htmlFor="serviceConsumed" className={labelStyle}>Servicio Realizado</label>
            <Controller
                name="serviceConsumed"
                control={control}
                render={({ field }) => (
                    <Select
                        isMulti
                        options={services.map(service => ({ value: service.name, label: service.name }))}
                        onChange={options => field.onChange(options.map(option => option.value).join(','))}
                        value={field.value ? field.value.split(',').map(item => ({ value: item, label: item })) : []}
                    />
                )}
            />
            {errors.serviceConsumed && <p className={errorStyle}>{errors.serviceConsumed.message}</p>}
        </div>

        <div>
          <label htmlFor="arrivalTime" className={labelStyle}>Hora de Llegada (HH:MM)</label>
          <input id="arrivalTime" type="time" {...register('arrivalTime')} className={`${inputStyle} ${errors.arrivalTime ? 'border-red-500' : ''}`} />
          {errors.arrivalTime && <p className={errorStyle}>{errors.arrivalTime.message}</p>}
        </div>

        <div>
          <label htmlFor="leaveTime" className={labelStyle}>Hora de Salida (HH:MM)</label>
          <input id="leaveTime" type="time" {...register('leaveTime')} className={`${inputStyle} ${errors.leaveTime ? 'border-red-500' : ''}`} />
          {errors.leaveTime && <p className={errorStyle}>{errors.leaveTime.message}</p>}
        </div>

        <div>
          <label htmlFor="usedDiscount" className={labelStyle}>Descuento Aplicado</label>
          <input id="usedDiscount" type="text" {...register('usedDiscount')} className={`${inputStyle} ${errors.usedDiscount ? 'border-red-500' : ''}`} />
          {errors.usedDiscount && <p className={errorStyle}>{errors.usedDiscount.message}</p>}
        </div>

        <div>
          <label htmlFor="additionalComments" className={labelStyle}>Comentarios Adicionales</label>
          <textarea id="additionalComments" {...register('additionalComments')} className={`${textareaStyle} ${errors.additionalComments ? 'border-red-500' : ''}`} />
          {errors.additionalComments && <p className={errorStyle}>{errors.additionalComments.message}</p>}
        </div>
        
        <div className="flex items-center justify-end space-x-4">
            <Link href="/appointments" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
            {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Cita' : 'Guardar Cita')}
            </button>
        </div>
    </form>
  );
} 