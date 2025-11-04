'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const serviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  abbreviation: z.string().max(10, 'La abreviatura no puede tener más de 10 caracteres').optional(),
  description: z.string().optional(),
  area: z.string().max(100, 'El área no puede tener más de 100 caracteres').optional(),
  price: z.string().min(1, 'El precio es requerido'),
  duration: z.string().optional(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  onSubmit: SubmitHandler<ServiceFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<ServiceFormValues>;
  isEdit?: boolean;
}

export default function ServiceForm({ onSubmit, isLoading, defaultValues, isEdit = false }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
  });

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700";
  const errorStyle = "mt-1 text-xs text-red-600";
  const textareaStyle = `${inputStyle} h-24`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
        <div>
            <label htmlFor="name" className={labelStyle}>Nombre del Servicio <span className="text-red-500">*</span></label>
            <input id="name" type="text" {...register('name')} className={`${inputStyle} ${errors.name ? 'border-red-500' : ''}`} />
            {errors.name && <p className={errorStyle}>{errors.name.message}</p>}
        </div>

        <div>
            <label htmlFor="abbreviation" className={labelStyle}>Abreviatura</label>
            <input id="abbreviation" type="text" {...register('abbreviation')} className={`${inputStyle} ${errors.abbreviation ? 'border-red-500' : ''}`} />
            {errors.abbreviation && <p className={errorStyle}>{errors.abbreviation.message}</p>}
        </div>

        <div>
            <label htmlFor="description" className={labelStyle}>Descripción</label>
            <textarea id="description" {...register('description')} className={`${textareaStyle} ${errors.description ? 'border-red-500' : ''}`} />
            {errors.description && <p className={errorStyle}>{errors.description.message}</p>}
        </div>

        <div>
            <label htmlFor="area" className={labelStyle}>Área del Servicio</label>
            <select id="area" {...register('area')} className={`${inputStyle} ${errors.area ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar área...</option>
              <option value="Uñas">Uñas</option>
              <option value="Pestañas y Cejas">Pestañas y Cejas</option>
              <option value="Peluqueria">Peluquería</option>
              <option value="Maquillaje">Maquillaje</option>
              <option value="Cosmetología">Cosmetología</option>
              <option value="Labios">Labios</option>
            </select>
            {errors.area && <p className={errorStyle}>{errors.area.message}</p>}
        </div>

        <div>
            <label htmlFor="price" className={labelStyle}>Precio <span className="text-red-500">*</span></label>
            <input id="price" type="number" step="0.01" {...register('price')} className={`${inputStyle} ${errors.price ? 'border-red-500' : ''}`} />
            {errors.price && <p className={errorStyle}>{errors.price.message}</p>}
        </div>
        
        <div>
            <label htmlFor="duration" className={labelStyle}>Duración (minutos)</label>
            <input id="duration" type="number" {...register('duration')} className={`${inputStyle} ${errors.duration ? 'border-red-500' : ''}`} />
            {errors.duration && <p className={errorStyle}>{errors.duration.message}</p>}
        </div>
        
        <div className="flex items-center justify-end space-x-4">
            <Link href="/services" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
            {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Servicio' : 'Guardar Servicio')}
            </button>
        </div>
    </form>
  );
} 