'use client';

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Select from 'react-select';
import { Appointment, ClientProfile, Employee, getEmployees, getServices, Service } from '@/lib/api';
import { useEffect, useState } from 'react';

const appointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'La fecha es requerida').refine(val => {
    return /^\d{2}-\d{2}-\d{4}$/.test(val);
  }, { message: 'La fecha debe ser DD-MM-AAAA' }),
  attendedEmployee: z.string().min(1, 'El empleado es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientId: z.string().min(1, 'El ID del cliente es requerido'),
  arrivalTime: z.string().optional(),
  leaveTime: z.string().optional(),
  serviceConsumed: z.string().min(1, 'El servicio es requerido'),
  serviceQuantities: z.string().optional(),
  usedDiscount: z.string().optional(),
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
    
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

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
      })() : getTodayDate(),
      arrivalTime: defaultValues?.arrivalTime || getCurrentTime(),
      leaveTime: defaultValues?.leaveTime || getCurrentTime(),
    },
  });

  const selectedClientId = watch('clientId');
  const serviceConsumed = watch('serviceConsumed');
  const serviceQuantities = watch('serviceQuantities');
  const usedDiscount = watch('usedDiscount');

  // Calculate total price based on selected services, quantities, and discounts
  const calculateTotalPrice = () => {
    if (!serviceConsumed) return 0;
    
    const servicesArray = serviceConsumed.split(',').filter(s => s.trim());
    const quantitiesArray = serviceQuantities ? serviceQuantities.split(',').filter(q => q.trim()) : [];
    const discountsArray = usedDiscount ? usedDiscount.split(',').filter(d => d.trim()) : [];
    
    let total = 0;
    servicesArray.forEach((serviceName, index) => {
      const service = services.find(s => s.name === serviceName.trim());
      if (service) {
        const quantity = parseInt(quantitiesArray[index]) || 1;
        const discount = parseFloat(discountsArray[index]) || 0;
        const price = Number(service.price) || 0;
        const discountedPrice = price * quantity * (1 - discount / 100);
        total += discountedPrice;
      }
    });
    
    return total;
  };

  const totalPrice = calculateTotalPrice();

  // Update totalAmount in form whenever it changes
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
      setValue('clientName', ''); // Clear if no client is selected
    }
  }, [selectedClientId, clients, setValue]);

  // Sync discounts and quantities with services
  useEffect(() => {
    if (serviceConsumed) {
      const servicesArray = serviceConsumed.split(',').filter(s => s.trim());
      const currentDiscounts = watch('usedDiscount');
      const currentQuantities = watch('serviceQuantities');
      const discountsArray = currentDiscounts ? currentDiscounts.split(',').filter(d => d.trim()) : [];
      const quantitiesArray = currentQuantities ? currentQuantities.split(',').filter(q => q.trim()) : [];
      
      // Adjust discounts array to match services length
      if (servicesArray.length !== discountsArray.length) {
        const newDiscounts = servicesArray.map((_, index) => 
          discountsArray[index] || '0'
        );
        setValue('usedDiscount', newDiscounts.join(','));
      }
      
      // Adjust quantities array to match services length
      if (servicesArray.length !== quantitiesArray.length) {
        const newQuantities = servicesArray.map((_, index) => 
          quantitiesArray[index] || '1'
        );
        setValue('serviceQuantities', newQuantities.join(','));
      }
    } else {
      setValue('usedDiscount', '');
      setValue('serviceQuantities', '');
    }
  }, [serviceConsumed, setValue]);

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
                            // Auto-fill clientName when client is selected
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
                render={({ field }) => {
                    const servicesArray = field.value ? field.value.split(',').filter(s => s.trim()) : [];
                    
                    const handleAddService = (serviceName: string) => {
                        if (serviceName) {
                            const newServices = [...servicesArray, serviceName];
                            field.onChange(newServices.join(','));
                        }
                    };
                    
                    const handleRemoveService = (index: number) => {
                        const newServices = servicesArray.filter((_, i) => i !== index);
                        field.onChange(newServices.join(','));
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
                                    {servicesArray.map((service, index) => (
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
          <label htmlFor="usedDiscount" className={labelStyle}>Cantidad y Descuento por Servicio</label>
          <Controller
              name="usedDiscount"
              control={control}
              render={({ field: discountField }) => {
                const servicesArray = serviceConsumed ? serviceConsumed.split(',').filter(s => s.trim()) : [];
                const discountsArray = discountField.value ? discountField.value.split(',').filter(d => d.trim()) : [];
                const quantitiesArray = serviceQuantities ? serviceQuantities.split(',').filter(q => q.trim()) : [];
                
                // Ensure arrays match services length
                while (discountsArray.length < servicesArray.length) {
                  discountsArray.push('0');
                }
                while (discountsArray.length > servicesArray.length) {
                  discountsArray.pop();
                }
                while (quantitiesArray.length < servicesArray.length) {
                  quantitiesArray.push('1');
                }
                while (quantitiesArray.length > servicesArray.length) {
                  quantitiesArray.pop();
                }

                const handleDiscountChange = (index: number, value: string) => {
                  const newDiscounts = [...discountsArray];
                  newDiscounts[index] = value;
                  discountField.onChange(newDiscounts.join(','));
                };

                const handleQuantityChange = (index: number, value: string) => {
                  const newQuantities = [...quantitiesArray];
                  newQuantities[index] = value;
                  setValue('serviceQuantities', newQuantities.join(','));
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
                    {servicesArray.map((service, index) => (
                      <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md gap-3">
                        <span className="flex-1 text-sm text-gray-700 font-medium truncate">{service}</span>
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
                          <select
                            value={discountsArray[index] || '0'}
                            onChange={(e) => handleDiscountChange(index, e.target.value)}
                            className="px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-sm"
                          >
                            {Array.from({ length: 21 }, (_, i) => i * 5).map(value => (
                              <option key={value} value={value.toString()}>{value}%</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
          />
          {errors.usedDiscount && <p className={errorStyle}>{errors.usedDiscount.message}</p>}
        </div>

        {/* Total Price Display */}
        <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">Precio Total:</span>
            <span className="text-2xl font-bold text-pink-600">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          {serviceConsumed && (
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium">Desglose:</p>
              {serviceConsumed.split(',').filter(s => s.trim()).map((serviceName, index) => {
                const service = services.find(s => s.name === serviceName.trim());
                const quantitiesArray = serviceQuantities ? serviceQuantities.split(',').filter(q => q.trim()) : [];
                const discountsArray = usedDiscount ? usedDiscount.split(',').filter(d => d.trim()) : [];
                const quantity = parseInt(quantitiesArray[index]) || 1;
                const discount = parseFloat(discountsArray[index]) || 0;
                const originalPrice = Number(service?.price) || 0;
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