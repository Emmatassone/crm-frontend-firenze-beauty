'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Select from 'react-select';
import { CreateProductSaleDto, Product, Employee, getEmployees, getProducts, ClientProfile } from '@/lib/api';
import { useEffect, useState } from 'react';

const saleSchema = z.object({
    dateTime: z.string().optional(),
    sellerEmployeeId: z.string().optional(),
    clientId: z.string().optional(),
    items: z.array(z.object({
        productId: z.string().min(1, 'Producto requerido'),
        quantity: z.number().min(1, 'Cantidad mínima 1'),
        price: z.number().min(0, 'Precio no puede ser negativo'),
        discount: z.string().optional(),
    })).min(1, 'Debe agregar al menos un producto'),
    comment: z.string().optional(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

interface SaleFormProps {
    onSubmit: (data: CreateProductSaleDto) => void;
    isLoading: boolean;
    defaultValues?: Partial<SaleFormValues>;
    clients?: ClientProfile[];
}

export default function SaleForm({ onSubmit, isLoading, defaultValues, clients = [] }: SaleFormProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [employeeData, productData] = await Promise.all([
                    getEmployees(),
                    getProducts(),
                ]);
                setEmployees(employeeData.filter(e => e.status === 'active'));
                setProducts(productData);
            } catch (e) {
                console.error("Error al cargar datos", e);
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
        control,
        getValues
    } = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            items: [],
            dateTime: new Date().toISOString().split('T')[0],
            ...defaultValues,
        },
    });

    const items = watch('items') || [];

    const calculateTotals = () => {
        let total = 0;
        let originalTotal = 0;

        items.forEach(item => {
            const quantity = item.quantity || 0;
            const price = item.price || 0;
            const discount = parseFloat(item.discount || '0');

            const lineOriginal = price * quantity;
            const lineFinal = lineOriginal * (1 - discount / 100);

            originalTotal += lineOriginal;
            total += lineFinal;
        });

        return { total, originalTotal };
    };

    const { total, originalTotal } = calculateTotals();

    const handleFormSubmit: SubmitHandler<SaleFormValues> = (data) => {
        const dto: CreateProductSaleDto = {
            productId: data.items.map(i => i.productId),
            quantitySold: data.items.map(i => i.quantity),
            sellingPricePerUnit: data.items.map(i => i.price),
            totalSaleAmount: data.items.map(i => i.price * i.quantity),
            discountApplied: data.items.map(i => i.discount || '0'),
            finalAmount: total,
            clientId: data.clientId || undefined,
            sellerEmployeeId: data.sellerEmployeeId || undefined,
            dateTime: data.dateTime,
            comment: data.comment,
        };
        onSubmit(dto);
    };

    const addItem = () => {
        const currentItems = getValues('items');
        setValue('items', [...currentItems, { productId: '', quantity: 1, price: 0, discount: '0' }]);
    };

    const removeItem = (index: number) => {
        const currentItems = getValues('items');
        setValue('items', currentItems.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input type="date" {...register('dateTime')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                    <select {...register('sellerEmployeeId')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                        <option value="">Seleccione...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Select
                            options={clients.map(c => ({ value: c.id, label: c.name || c.phoneNumber }))}
                            onChange={opt => field.onChange(opt ? opt.value : '')}
                            value={clients.find(c => c.id === field.value) ? { value: field.value, label: clients.find(c => c.id === field.value)?.name || clients.find(c => c.id === field.value)?.phoneNumber } : null}
                            placeholder="Buscar cliente..."
                            isClearable
                            className="mt-1"
                        />
                    )}
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                    <button type="button" onClick={addItem} className="text-sm text-pink-600 hover:text-pink-700 font-medium">+ Agregar Producto</button>
                </div>

                {items.map((item, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-md border border-gray-200">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500">Producto</label>
                            <Controller
                                name={`items.${index}.productId`}
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={products.map(p => ({ value: p.id, label: `${p.productName} ($${p.sellingPrice})`, price: p.sellingPrice }))}
                                        onChange={(opt: any) => {
                                            field.onChange(opt ? opt.value : '');
                                            if (opt) {
                                                setValue(`items.${index}.price`, opt.price || 0);
                                            }
                                        }}
                                        value={products.find(p => p.id === field.value) ? { value: field.value, label: products.find(p => p.id === field.value)?.productName } : null}
                                        placeholder="Seleccionar..."
                                        className="mt-1"
                                    />
                                )}
                            />
                        </div>
                        <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500">Cant.</label>
                            <input
                                type="number"
                                {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium text-gray-500">Precio Unit.</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    {...register(`items.${index}.price`, { valueAsNumber: true })}
                                    className="focus:ring-pink-500 focus:border-pink-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="w-28">
                            <label className="block text-xs font-medium text-gray-500">Desc. (%)</label>
                            <Controller
                                name={`items.${index}.discount`}
                                control={control}
                                render={({ field }) => {
                                    const handleDiscountChange = (val: string) => {
                                        // Allow digits and optional decimal point
                                        if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;

                                        let cleanValue = val;
                                        // Remove leading zero if it's not the only character and not followed by a decimal point
                                        if (cleanValue.length > 1 && cleanValue.startsWith('0') && cleanValue[1] !== '.') {
                                            cleanValue = cleanValue.substring(1);
                                        }

                                        // Ensure max value is 100
                                        if (parseFloat(cleanValue) > 100) {
                                            cleanValue = '100';
                                        }

                                        field.onChange(cleanValue);
                                    };

                                    return (
                                        <>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                autoComplete="off"
                                                value={field.value ?? '0'}
                                                onChange={(e) => handleDiscountChange(e.target.value)}
                                                onFocus={(e) => {
                                                    if (e.target.value === '0') {
                                                        handleDiscountChange('');
                                                    } else {
                                                        e.target.select();
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        handleDiscountChange('0');
                                                    }
                                                }}
                                                placeholder="0"
                                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-right"
                                                list={`sale-discount-options-${index}`}
                                            />
                                            <datalist id={`sale-discount-options-${index}`}>
                                                {[0, 5, 10, 15, 20, 25, 30, 40, 50].map((value) => (
                                                    <option key={value} value={value} />
                                                ))}
                                            </datalist>
                                        </>
                                    );
                                }}
                            />
                        </div>
                        <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800 mb-2">
                            ✕
                        </button>
                    </div>
                ))}
                {errors.items && <p className="text-sm text-red-600">{errors.items.message}</p>}
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Precio Final:</span>
                    <div className="flex flex-col items-end">
                        {originalTotal > total && (
                            <span className="text-sm text-gray-500 line-through">${originalTotal.toFixed(2)}</span>
                        )}
                        <span className="text-2xl font-bold text-pink-600">${total.toFixed(2)}</span>
                    </div>
                </div>
                {items && items.length > 0 && (
                    <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500 font-medium">Desglose:</p>
                        {items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            const productName = product ? product.productName : '';
                            const quantity = item.quantity || 0;
                            const price = item.price || 0;
                            const discount = parseFloat(item.discount || '0');

                            const lineOriginal = price * quantity;
                            const lineFinal = lineOriginal * (1 - discount / 100);

                            if (!item.productId) return null;

                            return (
                                <div key={index} className="flex justify-between text-sm text-gray-600">
                                    <span>
                                        {productName}
                                        {quantity > 1 && <span className="text-pink-500 font-medium ml-1">×{quantity}</span>}
                                    </span>
                                    <span>
                                        {discount > 0 ? (
                                            <>
                                                <span className="line-through text-gray-400 mr-2">${lineOriginal.toFixed(2)}</span>
                                                <span className="text-pink-600">${lineFinal.toFixed(2)}</span>
                                                <span className="text-green-600 ml-1">(-{discount}%)</span>
                                            </>
                                        ) : (
                                            <span>${lineOriginal.toFixed(2)}</span>
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Comentarios</label>
                <textarea {...register('comment')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm h-24" />
            </div>

            <div className="flex justify-end space-x-4">
                <Link href="/sales" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</Link>
                <button type="submit" disabled={isLoading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 disabled:opacity-50">
                    {isLoading ? 'Guardando...' : 'Registrar Venta'}
                </button>
            </div>
        </form>
    );
}
