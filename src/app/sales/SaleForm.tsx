'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ProductSale, Product, Employee, getProducts, getEmployees } from '@/lib/api';
import { useEffect, useState } from 'react';

const saleSchema = z.object({
  dateTime: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^d{2}-d{2}-d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  productId: z.string().min(1, 'El producto es requerido'),
  quantitySold: z.string().min(1, 'La cantidad es requerida'),
  sellingPricePerUnit: z.string().min(1, 'El precio es requerido'),
  totalSaleAmount: z.string().min(1, 'El total es requerido'),
  finalAmount: z.string().min(1, 'El total final es requerido'),
  discountApplied: z.string().optional(),
  sellerEmployeeId: z.string().optional(),
  comment: z.string().optional(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

interface SaleFormProps {
  onSubmit: SubmitHandler<SaleFormValues>;
  isLoading: boolean;
  defaultValues?: Partial<SaleFormValues>;
  isEdit?: boolean;
}

export default function SaleForm({ onSubmit, isLoading, defaultValues, isEdit = false }: SaleFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const productData = await getProducts();
        setProducts(productData);
        const employeeData = await getEmployees();
        setEmployees(employeeData);
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
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      ...defaultValues,
      dateTime: defaultValues?.dateTime ? (() => {
          const date = new Date(defaultValues.dateTime);
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
            <label htmlFor="dateTime" className={labelStyle}>Fecha de Venta</label>
            <input id="dateTime" type="text" placeholder="DD-MM-AAAA" {...register('dateTime')} className={`${inputStyle} ${errors.dateTime ? 'border-red-500' : ''}`} />
            {errors.dateTime && <p className={errorStyle}>{errors.dateTime.message}</p>}
        </div>

        <div>
            <label htmlFor="productId" className={labelStyle}>Producto</label>
            <select id="productId" {...register('productId')} className={`${inputStyle} ${errors.productId ? 'border-red-500' : ''}`}>
                <option value="">Seleccione un producto</option>
                {products.map(product => (
                    <option key={product.id} value={product.id}>{product.productName}</option>
                ))}
            </select>
            {errors.productId && <p className={errorStyle}>{errors.productId.message}</p>}
        </div>

        <div>
            <label htmlFor="quantitySold" className={labelStyle}>Cantidad Vendida</label>
            <input id="quantitySold" type="number" {...register('quantitySold')} className={`${inputStyle} ${errors.quantitySold ? 'border-red-500' : ''}`} />
            {errors.quantitySold && <p className={errorStyle}>{errors.quantitySold.message}</p>}
        </div>

        <div>
            <label htmlFor="sellingPricePerUnit" className={labelStyle}>Precio de Venta por Unidad</label>
            <input id="sellingPricePerUnit" type="number" step="0.01" {...register('sellingPricePerUnit')} className={`${inputStyle} ${errors.sellingPricePerUnit ? 'border-red-500' : ''}`} />
            {errors.sellingPricePerUnit && <p className={errorStyle}>{errors.sellingPricePerUnit.message}</p>}
        </div>

        <div>
            <label htmlFor="totalSaleAmount" className={labelStyle}>Monto Total de la Venta</label>
            <input id="totalSaleAmount" type="number" step="0.01" {...register('totalSaleAmount')} className={`${inputStyle} ${errors.totalSaleAmount ? 'border-red-500' : ''}`} />
            {errors.totalSaleAmount && <p className={errorStyle}>{errors.totalSaleAmount.message}</p>}
        </div>

        <div>
            <label htmlFor="finalAmount" className={labelStyle}>Monto Final</label>
            <input id="finalAmount" type="number" step="0.01" {...register('finalAmount')} className={`${inputStyle} ${errors.finalAmount ? 'border-red-500' : ''}`} />
            {errors.finalAmount && <p className={errorStyle}>{errors.finalAmount.message}</p>}
        </div>

        <div>
            <label htmlFor="discountApplied" className={labelStyle}>Descuento Aplicado</label>
            <input id="discountApplied" type="text" {...register('discountApplied')} className={`${inputStyle} ${errors.discountApplied ? 'border-red-500' : ''}`} />
            {errors.discountApplied && <p className={errorStyle}>{errors.discountApplied.message}</p>}
        </div>

        <div>
            <label htmlFor="sellerEmployeeId" className={labelStyle}>Empleado Vendedor</label>
            <select id="sellerEmployeeId" {...register('sellerEmployeeId')} className={`${inputStyle} ${errors.sellerEmployeeId ? 'border-red-500' : ''}`}>
                <option value="">Seleccione un empleado</option>
                {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
            </select>
            {errors.sellerEmployeeId && <p className={errorStyle}>{errors.sellerEmployeeId.message}</p>}
        </div>

        <div>
            <label htmlFor="comment" className={labelStyle}>Comentario</label>
            <textarea id="comment" {...register('comment')} className={`${inputStyle} ${errors.comment ? 'border-red-500' : ''}`} />
            {errors.comment && <p className={errorStyle}>{errors.comment.message}</p>}
        </div>

        <div className="flex items-center justify-end space-x-4">
            <Link href="/sales" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
            </Link>
            <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
            {isLoading ? 'Guardando...' : (isEdit ? 'Actualizar Venta' : 'Guardar Venta')}
            </button>
        </div>
    </form>
  );
} 