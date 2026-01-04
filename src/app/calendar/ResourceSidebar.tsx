'use client';

import { useState, useEffect } from 'react';
import {
    getClientProfiles,
    getEmployees,
    getServices,
    getAppointments,
    ClientProfile,
    Employee,
    Service,
    Appointment
} from '@/lib/api';
import { getEmployeeColor } from '@/lib/utils';

interface ResourceSidebarProps {
    onSelectClient: (client: ClientProfile | null) => void;
    selectedClient: ClientProfile | null;
}

export default function ResourceSidebar({ onSelectClient, selectedClient }: ResourceSidebarProps) {
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [lastProfessionals, setLastProfessionals] = useState<Record<string, { name: string, color: string }>>({});
    const [activeTab, setActiveTab] = useState<'clients' | 'employees'>('clients');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const [clientsData, employeesData, servicesData, appointmentsData] = await Promise.all([
                getClientProfiles(),
                getEmployees(),
                getServices(),
                getAppointments(),
            ]);
            setClients(clientsData || []);
            setEmployees(employeesData || []);
            setServices(servicesData || []);

            // Map employee name to ID for color lookup
            const employeeMap: Record<string, string> = {};
            (employeesData || []).forEach(emp => {
                employeeMap[emp.name] = emp.id;
            });

            // Calculate last professional for each client
            const lastProfMap: Record<string, { name: string, color: string }> = {};

            // Sort appointments by date DESC
            const sortedAppointments = [...(appointmentsData || [])].sort((a, b) =>
                new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
            );

            sortedAppointments.forEach(app => {
                if (app.clientId && !lastProfMap[app.clientId] && app.attendedEmployee) {
                    const empId = employeeMap[app.attendedEmployee];
                    lastProfMap[app.clientId] = {
                        name: app.attendedEmployee,
                        color: getEmployeeColor(empId)
                    };
                }
            });

            setLastProfessionals(lastProfMap);

        } catch (error) {
            console.error('Error fetching resources:', error);
        }
    };

    const filteredClients = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEmployees = employees.filter(e =>
        (e.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, type: 'client' | 'employee', data: ClientProfile | Employee) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="bg-white border-r border-gray-200 h-full flex flex-col w-80 shadow-sm z-30 flex-shrink-0">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-3">Recursos (Arrastrar)</h3>
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-3">
                    <button
                        onClick={() => setActiveTab('clients')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'clients' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Clientes
                    </button>
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'employees' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Profesionales
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeTab === 'clients' && (
                    <div className="divide-y divide-gray-100">
                        {filteredClients.map(client => (
                            <div
                                key={client.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'client', client)}
                                onClick={() => onSelectClient(selectedClient?.id === client.id ? null : client)}
                                className={`p-3 cursor-grab active:cursor-grabbing transition-colors hover:bg-pink-50 ${selectedClient?.id === client.id ? 'bg-pink-100 border-l-4 border-pink-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 text-sm truncate">{client.name || 'Sin Nombre'}</div>
                                    </div>
                                    {lastProfessionals[client.id] && (
                                        <div className="ml-2 flex flex-col items-end">
                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mb-1">Últ. Turno:</span>
                                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm whitespace-nowrap ${lastProfessionals[client.id].color}`}>
                                                {lastProfessionals[client.id].name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 inline-block px-1 rounded border border-gray-100">
                                    ⋮⋮ Arrastrar al calendario
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'employees' && (
                    <div className="divide-y divide-gray-100">
                        {filteredEmployees.map(emp => (
                            <div
                                key={emp.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'employee', emp)}
                                className="p-3 hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                            >
                                <div className="font-medium text-gray-800 text-sm">{emp.name}</div>
                                <div className="text-xs text-gray-500">{Array.isArray(emp.jobTitle) ? emp.jobTitle.join(', ') : (emp.jobTitle || 'Profesional')}</div>
                                <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 inline-block px-1 rounded border border-gray-100">
                                    ⋮⋮ Arrastrar al calendario
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
