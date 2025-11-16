'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Product } from '@/lib/api';

const productSchema = z.object({
  productName: z.string().min(2, 'El nombre del producto debe tener al menos 2 caracteres'),
  currentStock: z.string().optional(),
  model: z.string().optional(),
  purchasePrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  lastRestockDate: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: SubmitHandler<ProductFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<ProductFormValues>;
  isEdit?: boolean;
}

export default function ProductForm({ onSubmit, isLoading, defaultValues, isEdit = false }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...defaultValues,
      lastRestockDate: defaultValues?.lastRestockDate ? (() => {
          const date = new Date(defaultValues.lastRestockDate);
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
            <label htmlFor="productName" className={labelStyle}>Nombre del Producto <span className="text-red-500">*</span></label>
            <input id="productName" type="text" {...register('productName')} className={`${inputStyle} ${errors.productName ? 'border-red-500' : ''}`} />
            {errors.productName && <p className={errorStyle}>{errors.productName.message}</p>}
        </div>

        <div>
            <label htmlFor="currentStock" className={labelStyle}>Stock Actual</label>
            <input id="currentStock" type="number" {...register('currentStock')} className={`${inputStyle} ${errors.currentStock ? 'border-red-500' : ''}`} />
            {errors.currentStock && <p className={errorStyle}>{errors.currentStock.message}</p>}
        </div>

        <div>
            <label htmlFor="model" className={labelStyle}>Modelo</label>
            <input id="model" type="text" {...register('model')} className={`${inputStyle} ${errors.model ? 'border-red-500' : ''}`} />
            {errors.model && <p className={errorStyle}>{errors.model.message}</p>}
        </div>

        <div>
            <label htmlFor="purchasePrice" className={labelStyle}>Precio de Compra</label>
            <input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice')} className={`${inputStyle} ${errors.purchasePrice ? 'border-red-500' : ''}`} />
            {errors.purchasePrice && <p className={errorStyle}>{errors.purchasePrice.message}</p>}
        </div>

        <div>
            <label htmlFor="sellingPrice" className={labelStyle}>Precio de Venta</label>
            <input id="sellingPrice" type="number" step="0.01" {...register('sellingPrice')} className={`${inputStyle} ${errors.sellingPrice ? 'border-red-500' : ''}`} />
            {errors.sellingPrice && <p className={errorStyle}>{errors.sellingPrice.message}</p>}
        </div>

        <div>
            <label htmlFor="lastRestockDate" className={labelStyle}>Última Fecha de Reposición</label>
            <input id="lastRestockDate" type="text" placeholder="DD-MM-AAAA" {...register('lastRestockDate')} className={`${inputStyle} ${errors.lastRestockDate ? 'border-red-500' : ''}`} />
            {errors.lastRestockDate && <p className={errorStyle}>{errors.lastRestockDate.message}</p>}
        </div>

        <div className="flex items-center justify-end space-x-4">
            <Link href="/products" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
            {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Producto' : 'Guardar Producto')}
            </button>
        </div>
    </form>
  );
} 