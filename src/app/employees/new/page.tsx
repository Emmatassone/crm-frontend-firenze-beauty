'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SubmitHandler } from 'react-hook-form';
import { createEmployee, CreateEmployeeDto } from '@/lib/api';
import EmployeeForm, { EmployeeFormValues } from '../EmployeeForm';

export default function NewEmployeePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);

    if (data.password === '') {
        setError('La contraseña es requerida para nuevos empleados.');
        setIsLoading(false);
        return;
    }

    try {
      const payload: CreateEmployeeDto = {
        ...data,
        level: data.level === '' ? undefined : data.level,
        phoneNumber: data.phoneNumber === '' ? undefined : data.phoneNumber,
        address: data.address === '' ? undefined : data.address,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('-').reverse().join('-') : undefined,
        password: data.password, 
      };
      const newEmployee = await createEmployee(payload);
      router.push(`/employees/${newEmployee.id}`);
    } catch (e: any) {
      setError(e.message || 'Error al crear empleado.');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Agregar Nuevo Empleado</h1>
        <Link href="/employees" className="text-pink-600 hover:text-pink-700 transition">
          &larr; Volver a Empleados
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <EmployeeForm 
        onSubmit={onSubmit} 
        isLoading={isLoading} 
        defaultValues={{ 
          status: 'active',
          dateOfBirth: new Date().toISOString(),
        }} 
      />
    </div>
  );
} 