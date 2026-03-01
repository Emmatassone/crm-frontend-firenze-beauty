import React, { useState, useMemo } from 'react';
import { Employee, AppointmentSchedule } from '@/lib/api';

interface AvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    events: AppointmentSchedule[];
    onSelectSlot: (employeeId: string, startIso: string, endIso: string) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityModal({ isOpen, onClose, employees, events, onSelectSlot }: AvailabilityModalProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
    const [durationMinutes, setDurationMinutes] = useState<number>(30); // Default 30 min

    const uniqueJobTitles = useMemo(() => {
        const titles = new Set<string>();
        employees.forEach(emp => {
            if (emp.jobTitle) {
                emp.jobTitle.forEach(t => titles.add(t));
            }
        });
        return Array.from(titles).sort();
    }, [employees]);

    // Automatically select first job title if none selected
    useMemo(() => {
        if (!selectedJobTitle && uniqueJobTitles.length > 0) {
            setSelectedJobTitle(uniqueJobTitles[0]);
        }
    }, [uniqueJobTitles, selectedJobTitle]);

    const availabilityData = useMemo(() => {
        if (!selectedDate || !selectedJobTitle) return [];

        const targetDate = new Date(selectedDate);
        const dayOfWeekName = DAYS_OF_WEEK[targetDate.getDay()]; // e.g., 'Monday'

        const matchingEmployees = employees.filter(emp =>
            emp.status === 'active' &&
            emp.jobTitle &&
            emp.jobTitle.includes(selectedJobTitle)
        );

        const targetDateString = targetDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

        return matchingEmployees.map(employee => {
            // Find working hours for this employee on this day
            const workHours = employee.weekly_work_hours?.[dayOfWeekName];
            if (!workHours || !workHours['check-in'] || !workHours['check-out']) {
                return { employee, slots: [] }; // No working hours
            }

            // Create Date objects for shift start and end on the selected date
            const [inH, inM] = workHours['check-in'].split(':').map(Number);
            const [outH, outM] = workHours['check-out'].split(':').map(Number);

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(inH, inM, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(outH, outM, 0, 0);

            // Filter relevant events for this employee on this date
            const employeeEvents = events.filter(e => {
                if (e.employeeId !== employee.id || e.status === 'canceled') return false;
                const eStart = new Date(e.start);
                // Check if event is on the same day (simple check using split('T')[0] but handling timezones might be tricky, so let's use local date components)
                return eStart.getFullYear() === targetDate.getFullYear() &&
                    eStart.getMonth() === targetDate.getMonth() &&
                    eStart.getDate() === targetDate.getDate() &&
                    !e.isAllDay;
            });

            const slots: { start: Date, end: Date }[] = [];
            // Generate slots every 15 minutes
            let currentSlotStart = new Date(startOfDay);

            // To prevent past slots if date is today
            const now = new Date();
            if (currentSlotStart < now && targetDateString === now.toISOString().split('T')[0]) {
                const remainder = 15 - (now.getMinutes() % 15);
                currentSlotStart = new Date(now.getTime() + remainder * 60000);
            }

            while (currentSlotStart.getTime() + durationMinutes * 60000 <= endOfDay.getTime()) {
                const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60000);

                // Check overlap
                const overlap = employeeEvents.some(e => {
                    const eStart = new Date(e.start).getTime();
                    const eEnd = new Date(e.end).getTime();
                    // Overlap happens if: start < eEnd AND end > eStart
                    return currentSlotStart.getTime() < eEnd && currentSlotEnd.getTime() > eStart;
                });

                if (!overlap) {
                    slots.push({
                        start: new Date(currentSlotStart),
                        end: new Date(currentSlotEnd)
                    });
                }

                // Advance by 15 minutes for overlapping possible starts (e.g. 09:00, 09:15)
                // Actually, frontdesk might want 30-min intervals. Let's step by 15 mins for maximum flexibility.
                currentSlotStart = new Date(currentSlotStart.getTime() + 15 * 60000);
            }

            return { employee, slots };
        });

    }, [selectedDate, selectedJobTitle, durationMinutes, employees, events]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex-shrink-0 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Consultar Disponibilidad</h2>
                        <p className="text-white/80 text-sm">Encuentra espacios compartidos por puesto</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Fecha</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-2.5"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Puesto / Servicio</label>
                            <select
                                value={selectedJobTitle}
                                onChange={(e) => setSelectedJobTitle(e.target.value)}
                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-2.5 bg-white"
                            >
                                {uniqueJobTitles.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 md:max-w-xs">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Duración aprox. (min)</label>
                            <select
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-sm p-2.5 bg-white"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>1 hora</option>
                                <option value={90}>1 hora 30 min</option>
                                <option value={120}>2 horas</option>
                                <option value={150}>2 horas 30 min</option>
                                <option value={180}>3 horas</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white space-y-6">
                    {availabilityData.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔍</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay resultados</h3>
                            <p className="text-gray-500 text-sm">Prueba seleccionando otra fecha o especialidad.</p>
                        </div>
                    ) : (
                        availabilityData.map(({ employee, slots }) => (
                            <div key={employee.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs uppercase">
                                            {employee.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{employee.name}</h4>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                                                {employee.jobTitle.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-500">
                                        {slots.length} espacios libres
                                    </div>
                                </div>
                                <div className="p-4">
                                    {slots.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic text-center py-2">Sin disponibilidad en este día.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {slots.map((slot, index) => {
                                                const timeStr = slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                // Calculate if this is a consecutive slot to group nicely (optional, skipping for now)
                                                return (
                                                    <button
                                                        key={`${employee.id}-${slot.start.getTime()}`}
                                                        onClick={() => {
                                                            const formatLocalISO = (d: Date) => {
                                                                const pad = (n: number) => String(n).padStart(2, '0');
                                                                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                            };
                                                            onSelectSlot(employee.id, formatLocalISO(slot.start), formatLocalISO(slot.end));
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-pink-200 bg-pink-50 text-pink-700 text-xs font-bold hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        {timeStr}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
