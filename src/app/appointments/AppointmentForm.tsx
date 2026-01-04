'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Select from 'react-select';
import { Appointment, ClientProfile, Employee, getEmployees, getServices, Service } from '@/lib/api';
import { useEffect, useState, useCallback } from 'react';

const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'La fecha es requerida').refine(val => {
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  attendedEmployee: z.string().min(1, 'El profesional es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientId: z.string().min(1, 'El ID del cliente es requerido'),
  arrivalTime: z.string().optional(),
  leaveTime: z.string().optional(),
  serviceConsumed: z.array(z.string()).min(1, 'El servicio es requerido'),
  serviceQuantities: z.array(z.string()).optional(),
  usedDiscount: z.array(z.string()).optional(),
  servicePrices: z.array(z.number()).optional(),
  additionalComments: z.string().optional(),
  totalAmount: z.number().optional(),
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

  const getTodayDate = useCallback(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    getValues
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      ...defaultValues,
      appointmentDate: defaultValues?.appointmentDate ? (() => {
        // Handle YYYY-MM-DD or other formats
        const dateStr = defaultValues.appointmentDate;
        if (dateStr.includes('-')) {
          const parts = dateStr.split('-');
          if (parts[0].length === 4) { // YYYY-MM-DD
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        return dateStr;
      })() : getTodayDate(),
      arrivalTime: defaultValues?.arrivalTime || '',
      leaveTime: defaultValues?.leaveTime || '',
      serviceConsumed: defaultValues?.serviceConsumed || [],
      serviceQuantities: defaultValues?.serviceQuantities || [],
      usedDiscount: defaultValues?.usedDiscount || [],
      servicePrices: defaultValues?.servicePrices || [],
      attendedEmployee: defaultValues?.attendedEmployee || '',
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [employeeData, serviceData] = await Promise.all([
          getEmployees(),
          getServices(),
        ]);
        const activeEmployees = employeeData.filter(e => e.status === 'active');
        setEmployees(activeEmployees);
        setServices(serviceData);

        // Sync attendedEmployee if it came from defaultValues
        if (defaultValues?.attendedEmployee) {
          setValue('attendedEmployee', defaultValues.attendedEmployee);
        }

        // Initialize metadata for pre-filled services
        if (defaultValues?.serviceConsumed && defaultValues.serviceConsumed.length > 0) {
          const count = defaultValues.serviceConsumed.length;

          if (!getValues('serviceQuantities') || getValues('serviceQuantities')?.length === 0) {
            setValue('serviceQuantities', Array(count).fill('1'));
          }
          if (!getValues('usedDiscount') || getValues('usedDiscount')?.length === 0) {
            setValue('usedDiscount', Array(count).fill('0'));
          }
          if (!getValues('servicePrices') || getValues('servicePrices')?.length === 0) {
            const initialPrices = defaultValues.serviceConsumed.map(name => {
              const s = serviceData.find(srv => srv.name === name.trim());
              return s ? Number(s.price) : 0;
            });
            setValue('servicePrices', initialPrices);
          }
        }
      } catch (e) {
        console.error("Error al cargar datos para el formulario", e);
      }
    }
    fetchData();
  }, [defaultValues, setValue, getValues]);

  const selectedClientId = watch('clientId');
  const serviceConsumed = watch('serviceConsumed') || [];
  const serviceQuantities = watch('serviceQuantities') || [];
  const usedDiscount = watch('usedDiscount') || [];
  const servicePrices = watch('servicePrices') || [];

  const calculateTotalPrice = useCallback(() => {
    if (!serviceConsumed || serviceConsumed.length === 0) return { total: 0, originalTotal: 0 };

    let total = 0;
    let originalTotal = 0;
    serviceConsumed.forEach((serviceName: string, index: number) => {
      let price = 0;
      if (servicePrices && servicePrices[index] !== undefined && servicePrices[index] !== null) {
        price = Number(servicePrices[index]);
      } else {
        const service = services.find(s => s.name === serviceName.trim());
        price = Number(service?.price) || 0;
      }

      const quantity = parseInt(serviceQuantities[index]) || 1;
      const discount = parseFloat(usedDiscount[index]) || 0;

      const lineOriginal = price * quantity;
      const discountedPrice = lineOriginal * (1 - discount / 100);
      total += discountedPrice;
      originalTotal += lineOriginal;
    });

    return { total, originalTotal };
  }, [serviceConsumed, servicePrices, services, serviceQuantities, usedDiscount]);

  const { total: totalPrice, originalTotal: originalTotalPrice } = calculateTotalPrice();

  useEffect(() => {
    setValue('totalAmount', totalPrice);
  }, [totalPrice, setValue]);

  useEffect(() => {
    if (selectedClientId) {
      const selectedClient = clients.find(c => c.id === selectedClientId);
      if (selectedClient) {
        setValue('clientName', selectedClient.name || selectedClient.phoneNumber || '');
      }
    } else {
      setValue('clientName', '');
    }
  }, [selectedClientId, clients, setValue]);

  useEffect(() => {
    if (!serviceConsumed || serviceConsumed.length === 0) {
      if ((getValues('usedDiscount') || []).length > 0) setValue('usedDiscount', []);
      if ((getValues('serviceQuantities') || []).length > 0) setValue('serviceQuantities', []);
      if ((getValues('servicePrices') || []).length > 0) setValue('servicePrices', []);
    }
  }, [serviceConsumed, setValue, getValues]);

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
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <Select
              options={clients.map(client => ({ value: client.id, label: client.name || client.phoneNumber }))}
              onChange={option => {
                field.onChange(option ? option.value : '');
                if (option) {
                  const selectedClient = clients.find(c => c.id === option.value);
                  if (selectedClient) {
                    setValue('clientName', selectedClient.name || selectedClient.phoneNumber || '');
                  }
                } else {
                  setValue('clientName', '');
                }
              }}
              value={clients.find(c => c.id === field.value) ? { value: field.value, label: clients.find(c => c.id === field.value)?.name || clients.find(c => c.id === field.value)?.phoneNumber || '' } : null}
              isClearable
              placeholder="Seleccione un cliente"
            />
          )}
        />
        {errors.clientId && <p className={errorStyle}>{errors.clientId.message}</p>}
      </div>

      <div>
        <label htmlFor="attendedEmployee" className={labelStyle}>Atendido por</label>
        <select id="attendedEmployee" {...register('attendedEmployee')} className={`${inputStyle} ${errors.attendedEmployee ? 'border-red-500' : ''}`}>
          <option value="">Seleccione un profesional</option>
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
          render={({ field }) => {
            const servicesArray = field.value || [];

            const handleAddService = (serviceName: string) => {
              if (serviceName) {
                const newServices = [...servicesArray, serviceName];
                field.onChange(newServices);

                const currentQuantities = getValues('serviceQuantities') || [];
                const currentDiscounts = getValues('usedDiscount') || [];
                const currentPrices = getValues('servicePrices') || [];

                setValue('serviceQuantities', [...currentQuantities, '1']);
                setValue('usedDiscount', [...currentDiscounts, '0']);

                const s = services.find(srv => srv.name === serviceName);
                const price = s ? Number(s.price) : 0;
                setValue('servicePrices', [...currentPrices, price]);
              }
            };

            const handleRemoveService = (index: number) => {
              const newServices = servicesArray.filter((_: string, i: number) => i !== index);
              field.onChange(newServices);

              const currentQuantities = getValues('serviceQuantities') || [];
              const currentDiscounts = getValues('usedDiscount') || [];
              const currentPrices = getValues('servicePrices') || [];

              setValue('serviceQuantities', currentQuantities.filter((_: string, i: number) => i !== index));
              setValue('usedDiscount', currentDiscounts.filter((_: string, i: number) => i !== index));
              setValue('servicePrices', currentPrices.filter((_: number, i: number) => i !== index));
            };

            return (
              <div className="space-y-2">
                <Select
                  options={services.map(service => ({ value: service.name, label: service.name }))}
                  onChange={(option) => {
                    if (option) {
                      handleAddService(option.value);
                    }
                  }}
                  value={null}
                  placeholder="Agregar servicio..."
                  isClearable={false}
                />
                {servicesArray.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {servicesArray.map((service: string, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-pink-50 px-3 py-2 rounded-md border border-pink-200">
                        <span className="text-sm text-gray-700">{service}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }}
        />
        {errors.serviceConsumed && <p className={errorStyle}>{errors.serviceConsumed.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div>
        <label htmlFor="usedDiscount" className={labelStyle}>Cantidad y Descuento por Servicio</label>
        <Controller
          name="usedDiscount"
          control={control}
          render={({ field: discountField }) => {
            const servicesArray = serviceConsumed || [];
            const discountsArray = discountField.value || [];
            const quantitiesArray = serviceQuantities || [];

            const handlePriceChange = (index: number, value: string) => {
              const newPrices = [...(servicePrices || [])];
              newPrices[index] = parseFloat(value) || 0;
              setValue('servicePrices', newPrices);
            };

            const handleDiscountChange = (index: number, value: string) => {
              if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;

              let cleanValue = value;
              if (cleanValue.length > 1 && cleanValue.startsWith('0') && cleanValue[1] !== '.') {
                cleanValue = cleanValue.substring(1);
              }

              if (parseFloat(cleanValue) > 100) {
                cleanValue = '100';
              }

              const newDiscounts = [...discountsArray];
              newDiscounts[index] = cleanValue;
              discountField.onChange(newDiscounts);
            };

            const handleQuantityChange = (index: number, value: string) => {
              const newQuantities = [...quantitiesArray];
              newQuantities[index] = value;
              setValue('serviceQuantities', newQuantities);
            };

            if (servicesArray.length === 0) {
              return (
                <p className="mt-1 text-sm text-gray-500 italic">
                  Primero seleccione los servicios para configurar cantidad y descuentos
                </p>
              );
            }

            return (
              <div className="space-y-2 mt-2">
                {servicesArray.map((serviceName: string, index: number) => {
                  const currentPrice = servicePrices && servicePrices[index] !== undefined ? servicePrices[index] : 0;

                  return (
                    <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md gap-3 flex-wrap">
                      <span className="flex-1 text-sm text-gray-700 font-medium truncate min-w-[150px]">{serviceName}</span>

                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Precio:</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm text-right"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Cant:</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={quantitiesArray[index] || '1'}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-14 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-gray-500">Desc:</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={discountsArray[index] ?? '0'}
                          onChange={(e) => handleDiscountChange(index, e.target.value)}
                          onFocus={(e) => {
                            if (e.target.value === '0') {
                              handleDiscountChange(index, '');
                            } else {
                              e.target.select();
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              handleDiscountChange(index, '0');
                            }
                          }}
                          placeholder="0"
                          className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm text-right"
                          list={`discount-options-${index}`}
                        />
                        <datalist id={`discount-options-${index}`}>
                          {[0, 5, 10, 15, 20, 25, 30, 40, 50].map((value) => (
                            <option key={value} value={value} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
        {errors.usedDiscount && <p className={errorStyle}>{errors.usedDiscount.message}</p>}
      </div>

      {/* Total Price Display */}
      <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">Precio Final:</span>
          <div className="flex flex-col items-end">
            {originalTotalPrice > totalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${originalTotalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-bold text-pink-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
        {serviceConsumed && serviceConsumed.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500 font-medium">Desglose:</p>
            {serviceConsumed.map((serviceName: string, index: number) => {
              const service = services.find(s => s.name === serviceName.trim());
              const quantity = parseInt(serviceQuantities[index]) || 1;
              const discount = parseFloat(usedDiscount[index]) || 0;
              const storedPrice = servicePrices[index];
              const originalPrice = (storedPrice !== undefined && storedPrice !== null)
                ? Number(storedPrice)
                : (Number(service?.price) || 0);
              const lineTotal = originalPrice * quantity;
              const discountedPrice = lineTotal * (1 - discount / 100);

              return (
                <div key={index} className="flex justify-between text-sm text-gray-600">
                  <span>
                    {serviceName.trim()}
                    {quantity > 1 && <span className="text-pink-500 font-medium ml-1">×{quantity}</span>}
                  </span>
                  <span>
                    {discount > 0 ? (
                      <>
                        <span className="line-through text-gray-400 mr-2">${lineTotal.toFixed(2)}</span>
                        <span className="text-pink-600">${discountedPrice.toFixed(2)}</span>
                        <span className="text-green-600 ml-1">(-{discount}%)</span>
                      </>
                    ) : (
                      <span>${lineTotal.toFixed(2)}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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