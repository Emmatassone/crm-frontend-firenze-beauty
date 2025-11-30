'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ClientProfile } from '@/lib/api';

const clientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder los 100 caracteres').optional().or(z.literal('')),
  countryCode: z.string().min(1, 'El código de país es requerido').refine(val => /^\+\d{1,4}$/.test(val), {
    message: 'El código de país debe comenzar con + y contener 1-4 dígitos'
  }),
  phoneNumber: z.string().min(1, 'El número de teléfono es requerido').refine(val => /^\d{6,14}$/.test(val), {
    message: 'El número de teléfono debe contener entre 6 y 14 dígitos'
  }),
  email: z.string().email('Debe ser un correo electrónico válido').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  hairDetails: z.string().optional(),
  eyelashDetails: z.string().optional(),
  nailDetails: z.string().optional(),
  clientAllergies: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  onSubmit: SubmitHandler<ClientFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<ClientFormValues>;
  isEdit?: boolean;
}

export default function ClientForm({ onSubmit, isLoading, defaultValues, isEdit = false }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      ...defaultValues,
      countryCode: defaultValues?.phoneNumber ? (() => {
        // El backend guarda el número sin el +, por ejemplo: 542215661377
        // Necesitamos extraer el código de país (54) y agregar el +
        const phoneStr = defaultValues.phoneNumber;
        if (phoneStr.startsWith('+')) {
          const match = phoneStr.match(/^(\+\d{1,4})/);
          return match ? match[1] : '+54';
        } else {
          // Si no tiene +, asumimos que empieza con el código de país
          // Extraemos los primeros 2-3 dígitos (54 para Argentina)
          const match = phoneStr.match(/^(\d{2,3})/);
          return match ? `+${match[1]}` : '+54';
        }
      })() : '+54',
      phoneNumber: defaultValues?.phoneNumber ? (() => {
        const phoneStr = defaultValues.phoneNumber;
        if (phoneStr.startsWith('+')) {
          const match = phoneStr.match(/^\+\d{1,4}(\d+)/);
          return match ? match[1] : '';
        } else {
          // Si no tiene +, asumimos formato 542215661377, quitamos los primeros 2-3 dígitos
          const match = phoneStr.match(/^\d{2,3}(\d+)/);
          return match ? match[1] : phoneStr;
        }
      })() : '',
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
  const textareaStyle = `${inputStyle} h-24`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
      <div>
        <label htmlFor="name" className={labelStyle}>Nombre</label>
        <input id="name" type="text" {...register('name')} className={`${inputStyle} ${errors.name ? 'border-red-500' : ''}`} />
        {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="phoneNumber" className={labelStyle}>Teléfono <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <div className="w-28">
            <input
              id="countryCode"
              type="text"
              placeholder="+54"
              {...register('countryCode')}
              className={`${inputStyle} ${errors.countryCode ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="flex-1">
            <input
              id="phoneNumber"
              type="tel"
              placeholder="2215661377"
              {...register('phoneNumber')}
              className={`${inputStyle} ${errors.phoneNumber ? 'border-red-500' : ''}`}
            />
          </div>
        </div>
        {errors.countryCode && <p className={errorStyle}>{errors.countryCode.message}</p>}
        {errors.phoneNumber && <p className={errorStyle}>{errors.phoneNumber.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelStyle}>Correo Electrónico</label>
        <input id="email" type="email" {...register('email')} className={`${inputStyle} ${errors.email ? 'border-red-500' : ''}`} />
        {errors.email && <p className={errorStyle}>{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="dateOfBirth" className={labelStyle}>Fecha de Nacimiento</label>
        <input id="dateOfBirth" type="text" placeholder="DD-MM-AAAA" {...register('dateOfBirth')} className={`${inputStyle} ${errors.dateOfBirth ? 'border-red-500' : ''}`} />
        {errors.dateOfBirth && <p className={errorStyle}>{errors.dateOfBirth.message}</p>}
      </div>

      <div>
        <label htmlFor="hairDetails" className={labelStyle}>Detalles del Cabello</label>
        <textarea id="hairDetails" {...register('hairDetails')} className={`${textareaStyle} ${errors.hairDetails ? 'border-red-500' : ''}`} />
        {errors.hairDetails && <p className={errorStyle}>{errors.hairDetails.message}</p>}
      </div>

      <div>
        <label htmlFor="eyelashDetails" className={labelStyle}>Detalles de Pestañas y Cejas</label>
        <textarea id="eyelashDetails" {...register('eyelashDetails')} className={`${textareaStyle} ${errors.eyelashDetails ? 'border-red-500' : ''}`} />
        {errors.eyelashDetails && <p className={errorStyle}>{errors.eyelashDetails.message}</p>}
      </div>

      <div>
        <label htmlFor="nailDetails" className={labelStyle}>Detalles de Uñas</label>
        <textarea id="nailDetails" {...register('nailDetails')} className={`${textareaStyle} ${errors.nailDetails ? 'border-red-500' : ''}`} />
        {errors.nailDetails && <p className={errorStyle}>{errors.nailDetails.message}</p>}
      </div>

      <div>
        <label htmlFor="clientAllergies" className={labelStyle}>Alergias del Cliente</label>
        <textarea id="clientAllergies" {...register('clientAllergies')} className={`${textareaStyle} ${errors.clientAllergies ? 'border-red-500' : ''}`} />
        {errors.clientAllergies && <p className={errorStyle}>{errors.clientAllergies.message}</p>}
      </div>

      <div className="flex items-center justify-end space-x-4">
        <Link href="/clients" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Cancelar
        </Link>
        <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
          {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Cliente' : 'Guardar Cliente')}
        </button>
      </div>
    </form>
  );
} 