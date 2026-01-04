'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Select from 'react-select';
import { Employee } from '@/lib/api';

const jobTitleOptions = [
  { value: 'Uñas', label: 'Uñas' },
  { value: 'Pestañas y Cejas', label: 'Pestañas y Cejas' },
  { value: 'Peluqueria', label: 'Peluqueria' },
  { value: 'Maquillaje', label: 'Maquillaje' },
  { value: 'Cosmetología', label: 'Cosmetología' },
  { value: 'Labios', label: 'Labios' }
];

const levelValues = ["1", "2", "3", "4", "5", "6"] as const;
const statusValues = ["active", "suspended", "retired"] as const;

const employeeSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder los 100 caracteres'),
  email: z.string().email('Debe ser un correo electrónico válido').min(1, 'El correo electrónico es requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').optional().or(z.literal('')),
  jobTitle: z.array(z.string()).min(1, 'Debe seleccionar al menos un puesto'),
  status: z.enum(statusValues),
  level: z.enum(levelValues).optional().or(z.literal('')),
  phoneNumber: z.string().optional().refine(val => !val || val.trim() === '' || /^\+?[1-9]\d{1,14}$/.test(val), {
    message: 'El número de teléfono debe ser un formato internacional válido (ej: +1234567890) o estar vacío'
  }),
  address: z.string().optional(),
  dateOfBirth: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  hireDate: z.string().optional().or(z.literal('')),
  employmentType: z.enum(['fullTime', 'partTime']).optional().or(z.literal('')),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  onSubmit: SubmitHandler<EmployeeFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<EmployeeFormValues>;
  isEdit?: boolean;
}

export default function EmployeeForm({ onSubmit, isLoading, defaultValues, isEdit = false }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      ...defaultValues,
      dateOfBirth: defaultValues?.dateOfBirth ? (() => {
        const date = new Date(defaultValues.dateOfBirth);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}-${month}-${year}`;
      })() : '',
    },
  });

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const errorStyle = "mt-1 text-xs text-red-600";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
      <div>
        <label htmlFor="name" className={labelStyle}>Nombre <span className="text-red-500">*</span></label>
        <input id="name" type="text" {...register('name')} className={`${inputStyle} ${errors.name ? 'border-red-500' : ''}`} />
        {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelStyle}>Correo Electrónico <span className="text-red-500">*</span></label>
        <input id="email" type="email" {...register('email')} className={`${inputStyle} ${errors.email ? 'border-red-500' : ''}`} />
        {errors.email && <p className={errorStyle}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className={labelStyle}>Contraseña {isEdit ? '(Opcional)' : <span className="text-red-500">*</span>}</label>
        <input id="password" type="password" {...register('password')} className={`${inputStyle} ${errors.password ? 'border-red-500' : ''}`} />
        {errors.password && <p className={errorStyle}>{errors.password.message}</p>}
      </div>

      <div>
        <label htmlFor="jobTitle" className={labelStyle}>Puesto(s) <span className="text-red-500">*</span></label>
        <Controller
          name="jobTitle"
          control={control}
          render={({ field }) => (
            <Select
              isMulti
              options={jobTitleOptions}
              classNamePrefix="select"
              placeholder="Seleccionar puestos..."
              className={errors.jobTitle ? 'border-red-500 rounded-md' : ''}
              value={jobTitleOptions.filter(option => field.value?.includes(option.value))}
              onChange={(val) => field.onChange(val.map(v => v.value))}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: '#db2777', // pink-600
                }
              })}
            />
          )}
        />
        {errors.jobTitle && <p className={errorStyle}>{errors.jobTitle.message}</p>}
      </div>

      <div>
        <label htmlFor="status" className={labelStyle}>Estado</label>
        <select
          id="status"
          {...register('status')}
          className={`${inputStyle} ${errors.status ? 'border-red-500' : ''}`}
        >
          {statusValues.map(st => (
            <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
          ))}
        </select>
        {errors.status && <p className={errorStyle}>{errors.status.message}</p>}
      </div>

      <div>
        <label htmlFor="level" className={labelStyle}>Nivel</label>
        <select
          id="level"
          {...register('level')}
          className={`${inputStyle} ${errors.level ? 'border-red-500' : ''}`}
        >
          <option value="">Seleccione un nivel (opcional)</option>
          {levelValues.map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
        {errors.level && <p className={errorStyle}>{errors.level.message}</p>}
      </div>

      <div>
        <label htmlFor="phoneNumber" className={labelStyle}>Teléfono</label>
        <input id="phoneNumber" type="tel" {...register('phoneNumber')} className={`${inputStyle} ${errors.phoneNumber ? 'border-red-500' : ''}`} />
        {errors.phoneNumber && <p className={errorStyle}>{errors.phoneNumber.message}</p>}
      </div>

      <div>
        <label htmlFor="address" className={labelStyle}>Dirección</label>
        <input id="address" type="text" {...register('address')} className={`${inputStyle} ${errors.address ? 'border-red-500' : ''}`} />
        {errors.address && <p className={errorStyle}>{errors.address.message}</p>}
      </div>

      <div>
        <label htmlFor="dateOfBirth" className={labelStyle}>Fecha de Nacimiento</label>
        <input id="dateOfBirth" type="text" placeholder="DD-MM-AAAA" {...register('dateOfBirth')} className={`${inputStyle} ${errors.dateOfBirth ? 'border-red-500' : ''}`} />
        {errors.dateOfBirth && <p className={errorStyle}>{errors.dateOfBirth.message}</p>}
      </div>

      <div>
        <label htmlFor="hireDate" className={labelStyle}>Fecha de Contratación</label>
        <input id="hireDate" type="date" {...register('hireDate')} className={`${inputStyle} ${errors.hireDate ? 'border-red-500' : ''}`} />
        {errors.hireDate && <p className={errorStyle}>{errors.hireDate.message}</p>}
      </div>

      <div>
        <label htmlFor="employmentType" className={labelStyle}>Tipo de Empleo</label>
        <select
          id="employmentType"
          {...register('employmentType')}
          className={`${inputStyle} ${errors.employmentType ? 'border-red-500' : ''}`}
        >
          <option value="fullTime">Full Time</option>
          <option value="partTime">Part Time</option>
        </select>
        {errors.employmentType && <p className={errorStyle}>{errors.employmentType.message}</p>}
      </div>

      <div className="flex items-center justify-end space-x-4">
        <Link href="/employees" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Cancelar
        </Link>
        <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
          {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Profesional' : 'Guardar Profesional')}
        </button>
      </div>
    </form>
  );
} 