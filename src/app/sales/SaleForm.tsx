'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ProductSale, Product, ClientProfile, getProducts, getClientProfiles } from '@/lib/api';
import { useEffect, useState } from 'react';

const saleSchema = z.object({
  dateTime: z.string().optional().refine(val => {
    if (!val || val.trim() === '') return true;
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  productId: z.string().min(1, 'El producto es requerido'),
  clientId: z.string().optional(),
  quantitySold: z.string().min(1, 'La cantidad es requerida'),
  sellingPricePerUnit: z.string().min(1, 'El precio es requerido'),
  totalSaleAmount: z.string().min(1, 'El total es requerido'),
  finalAmount: z.string().min(1, 'El total final es requerido'),
  discountApplied: z.string().optional(),
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
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [priceNotDefined, setPriceNotDefined] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const productData = await getProducts();
        setProducts(productData);
        const clientData = await getClientProfiles();
        setClients(clientData);
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
    watch,
    setValue,
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

  // Watch for product selection changes and quantity
  const selectedProductId = watch('productId');
  const quantitySold = watch('quantitySold');
  const sellingPricePerUnit = watch('sellingPricePerUnit');
  const totalSaleAmount = watch('totalSaleAmount');
  const discountApplied = watch('discountApplied');

  // Auto-fill selling price when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const selectedProduct = products.find(p => p.id === selectedProductId);
      if (selectedProduct) {
        if (selectedProduct.sellingPrice !== undefined && selectedProduct.sellingPrice !== null) {
          setValue('sellingPricePerUnit', selectedProduct.sellingPrice.toString());
          setPriceNotDefined(false);
        } else {
          setValue('sellingPricePerUnit', '');
          setPriceNotDefined(true);
        }
      }
    } else {
      setPriceNotDefined(false);
    }
  }, [selectedProductId, products, setValue]);

  // Calculate total sale amount when quantity or price changes
  useEffect(() => {
    const quantity = Number(quantitySold);
    const price = Number(sellingPricePerUnit);
    
    if (quantity > 0 && price > 0) {
      const total = quantity * price;
      setValue('totalSaleAmount', total.toFixed(2));
    }
  }, [quantitySold, sellingPricePerUnit, setValue]);

  // Calculate final amount when total or discount changes
  useEffect(() => {
    const total = Number(totalSaleAmount);
    const discount = Number(discountApplied) || 0;
    
    if (total > 0) {
      const final = total * (1 - discount / 100);
      setValue('finalAmount', final.toFixed(2));
    }
  }, [totalSaleAmount, discountApplied, setValue]);

  const inputStyle = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm";
  const readOnlyInputStyle = "mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-700 cursor-not-allowed sm:text-sm";
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
            <label htmlFor="clientId" className={labelStyle}>Cliente</label>
            <select id="clientId" {...register('clientId')} className={`${inputStyle} ${errors.clientId ? 'border-red-500' : ''}`}>
                <option value="">Seleccione un cliente (opcional)</option>
                {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name || client.phoneNumber}</option>
                ))}
            </select>
            {errors.clientId && <p className={errorStyle}>{errors.clientId.message}</p>}
        </div>

        <div>
            <label htmlFor="quantitySold" className={labelStyle}>Cantidad Vendida</label>
            <input id="quantitySold" type="number" {...register('quantitySold')} className={`${inputStyle} ${errors.quantitySold ? 'border-red-500' : ''}`} />
            {errors.quantitySold && <p className={errorStyle}>{errors.quantitySold.message}</p>}
        </div>

        <div>
            <label htmlFor="sellingPricePerUnit" className={labelStyle}>
                Precio de Venta por Unidad <span className="text-xs text-gray-500">(calculado automáticamente)</span>
            </label>
            {priceNotDefined ? (
                <div className="mt-1 block w-full px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-md shadow-sm text-yellow-800 sm:text-sm">
                    Precio del producto no definido
                </div>
            ) : (
                <input id="sellingPricePerUnit" type="number" step="0.01" {...register('sellingPricePerUnit')} className={readOnlyInputStyle} readOnly />
            )}
            {errors.sellingPricePerUnit && <p className={errorStyle}>{errors.sellingPricePerUnit.message}</p>}
        </div>

        <div>
            <label htmlFor="totalSaleAmount" className={labelStyle}>
                Monto Total de la Venta <span className="text-xs text-gray-500">(calculado automáticamente)</span>
            </label>
            <input id="totalSaleAmount" type="number" step="0.01" {...register('totalSaleAmount')} className={readOnlyInputStyle} readOnly />
            {errors.totalSaleAmount && <p className={errorStyle}>{errors.totalSaleAmount.message}</p>}
        </div>

        <div>
            <label htmlFor="discountApplied" className={labelStyle}>Descuento Aplicado (%)</label>
            <input id="discountApplied" type="number" step="0.01" {...register('discountApplied')} className={`${inputStyle} ${errors.discountApplied ? 'border-red-500' : ''}`} />
            {errors.discountApplied && <p className={errorStyle}>{errors.discountApplied.message}</p>}
        </div>

        {/* Final Amount - Highlighted at the bottom */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <label htmlFor="finalAmount" className="block text-lg font-bold text-gray-900">
                Monto Final <span className="text-sm text-gray-500 font-normal">(calculado automáticamente)</span>
            </label>
            {priceNotDefined ? (
                <div className="mt-2 block w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-md shadow-sm text-yellow-800 font-bold text-xl">
                    Precio del producto no definido
                </div>
            ) : (
                <input 
                    id="finalAmount" 
                    type="number" 
                    step="0.01" 
                    {...register('finalAmount')} 
                    className="mt-2 block w-full px-4 py-3 bg-green-50 border-2 border-green-500 rounded-md shadow-sm text-green-900 font-bold text-xl cursor-not-allowed" 
                    readOnly 
                />
            )}
            {errors.finalAmount && <p className={errorStyle}>{errors.finalAmount.message}</p>}
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