'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { getEmployeeById, Employee } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

export default function ProfilePage() {
    const router = useRouter();
    const { token, userId, logout } = useAuthStore();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                let id = userId;

                // Fallback: decode token if userId is missing in store (e.g. old session)
                if (!id) {
                    try {
                        const decoded: any = jwtDecode(token);
                        id = decoded.sub;
                    } catch (e) {
                        console.error("Token decode failed", e);
                        logout();
                        router.push('/login');
                        return;
                    }
                }

                if (!id) {
                    setError('No se pudo identificar al usuario.');
                    setLoading(false);
                    return;
                }

                const data = await getEmployeeById(id);
                setEmployee(data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Error al cargar la información del perfil.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token, userId, router, logout]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <p>{error}</p>
            </div>
        );
    }

    if (!employee) {
        return <div className="p-8 text-center">No se encontró el perfil.</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 h-screen p-8">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="h-32 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-center -mt-12 mb-6">
                            <div className="flex items-center">
                                <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5">
                                    <div className="h-full w-full rounded-xl bg-pink-50 flex items-center justify-center text-3xl font-bold text-pink-600 uppercase">
                                        {employee.name.charAt(0)}
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{employee.name}</h1>
                                    <p className="text-sm font-medium text-gray-500">{employee.jobTitle?.join(', ') || 'Sin puesto definido'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
                                    Información Personal
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Fecha de Inicio</p>
                                        <p className="font-medium text-gray-900">
                                            {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Horas Semanales</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-900 text-lg">{employee.weeklyWorkingHours || 0}</span>
                                            <span className="text-xs text-gray-400 font-medium">hrs</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Email</p>
                                    <p className="font-medium text-gray-900 truncate">{employee.email}</p>
                                </div>
                            </div>

                            {/* Vacation Stats */}
                            <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                                <h3 className="text-sm font-bold text-pink-800 uppercase tracking-wide mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Estado de Vacaciones
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                        <span className="text-sm text-gray-600 font-medium">Días Tomados</span>
                                        <span className="text-lg font-bold text-gray-900">{employee.vacationTaken || 0}</span>
                                    </div>

                                    <div className="flex justify-between items-center bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-lg shadow-md text-white">
                                        <span className="text-sm font-medium opacity-90">Balance Disponible</span>
                                        <span className="text-xl font-extrabold">{employee.vacationBalance || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info Card (Optional placeholder for future) */}
                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Detalles Adicionales</h2>
                    <p className="text-gray-500 text-sm">Más información puede ser agregada aquí...</p>
                </div> */}
            </div>
        </div>
    );
}
