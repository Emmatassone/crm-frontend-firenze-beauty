'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
    getAppointmentSchedules,
    createAppointmentSchedule,
    updateAppointmentSchedule,
    deleteAppointmentSchedule,
    getEmployees,
    getServices,
    getClientProfiles,
    getEmployeeDurations,
    getSettingByKey,
    AppointmentSchedule,
    CreateAppointmentScheduleDto,
    ClientProfile,
    Employee,
    Service
} from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatToLocalISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

import { EMPLOYEE_COLORS, getEmployeeColor } from '@/lib/utils';

interface CalendarViewProps {
    selectedClient: ClientProfile | null;
    onClearClient: () => void;
}

export default function CalendarView({ selectedClient, onClearClient }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<AppointmentSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AppointmentSchedule | null>(null);
    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [availableClients, setAvailableClients] = useState<ClientProfile[]>([]);
    const [selectedServices, setSelectedServices] = useState<any[]>([]);
    const [serviceDataSources, setServiceDataSources] = useState<Record<string, 'personal' | 'default'>>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [selectedEventForAction, setSelectedEventForAction] = useState<AppointmentSchedule | null>(null);
    const [visibleDays, setVisibleDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Default Mon-Sat
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [isLongDurationConfirmOpen, setIsLongDurationConfirmOpen] = useState(false);
    const [pendingSaveData, setPendingSaveData] = useState<CreateAppointmentScheduleDto | null>(null);
    const [mounted, setMounted] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [isWeekView, setIsWeekView] = useState(false); // Week view for mobile
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null); // For tap-to-expand on mobile
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Auto-enable week view on mobile
        const checkMobile = () => {
            setIsWeekView(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close expanded day panel when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (expandedDay !== null) {
                const target = e.target as HTMLElement;
                if (!target.closest('[data-expanded-panel]') && !target.closest('[data-expand-btn]')) {
                    setExpandedDay(null);
                }
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && expandedDay !== null) {
                setExpandedDay(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [expandedDay]);

    // Close expanded day when month changes
    useEffect(() => {
        setExpandedDay(null);
    }, [currentDate]);

    // Form state
    const [formData, setFormData] = useState<CreateAppointmentScheduleDto>({
        title: '',
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        notes: '',
        isAllDay: false,
        clientName: '',
        clientId: undefined,
        employeeId: undefined,
        serviceId: undefined,
        deposit: undefined,
        status: 'pending',
    });

    const { token, isTokenValid, level, name, email } = useAuthStore();
    const isLevel123 = level === '1' || level === '2' || level === '3';

    useEffect(() => {
        if (token && isTokenValid()) {
            fetchData();
        }
    }, [token, isTokenValid]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [eventsData, employeesData, servicesData, clientsData, settingData] = await Promise.all([
                getAppointmentSchedules(),
                getEmployees(),
                getServices(),
                getClientProfiles(),
                getSettingByKey('calendar_days').catch(() => null)
            ]);

            if (settingData && Array.isArray(settingData.value)) {
                setVisibleDays(settingData.value);
            }

            setEvents(eventsData || []);
            const activeEmployees = (employeesData || []).filter(e => e.status === 'active');
            setAvailableEmployees(activeEmployees);
            setAvailableServices(servicesData || []);
            setAvailableClients(clientsData || []);

            // Fix filter for level 1, 2, 3
            if (isLevel123) {
                const currentUserEmployee = activeEmployees.find(e =>
                    e.email === email || e.name === name
                );
                if (currentUserEmployee) {
                    setFilterEmployeeId(currentUserEmployee.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch calendar data', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate End Time based on services and professional performance
    useEffect(() => {
        const calculateDuration = async () => {
            if (!formData.employeeId || selectedServices.length === 0 || !formData.start) {
                setServiceDataSources({});
                return;
            }

            const employee = availableEmployees.find(e => e.id === formData.employeeId);
            if (!employee) return;

            try {
                // Fetch historical performance for this employee
                const performanceData = await getEmployeeDurations(employee.name);

                const newSources: Record<string, 'personal' | 'default'> = {};
                let totalDuration = 0;

                for (const svcOption of selectedServices) {
                    const serviceName = svcOption.label;
                    const serviceId = svcOption.value;
                    let serviceDuration = null;
                    let source: 'personal' | 'default' | null = null;

                    // 1. Look for personal time across the last 4 months
                    if (performanceData && performanceData.length > 0) {
                        for (const performance of performanceData) {
                            const breakdown = typeof performance.service_time_breakdown === 'string'
                                ? JSON.parse(performance.service_time_breakdown)
                                : performance.service_time_breakdown;

                            const match = (breakdown || []).find((s: any) => s.service === serviceName);
                            if (match) {
                                serviceDuration = match.avg_duration_minutes;
                                source = 'personal';
                                break;
                            }
                        }
                    }

                    // 2. If no personal time, check service default duration
                    if (serviceDuration === null) {
                        const serviceDef = availableServices.find(s => s.id === serviceId);
                        if (serviceDef && serviceDef.duration) {
                            serviceDuration = serviceDef.duration;
                            source = 'default';
                        }
                    }

                    if (serviceDuration !== null) {
                        totalDuration += serviceDuration;
                        if (source) {
                            newSources[serviceName] = source;
                        }
                    }
                }

                setServiceDataSources(newSources);

                if (totalDuration > 0) {
                    const startDate = new Date(formData.start);
                    const endDate = new Date(startDate.getTime() + totalDuration * 60000);

                    setFormData(prev => ({
                        ...prev,
                        end: formatToLocalISO(endDate)
                    }));
                }
            } catch (err) {
                console.error("Error calculating duration:", err);
            }
        };

        calculateDuration();
    }, [formData.employeeId, selectedServices, formData.start, availableEmployees]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    // Get start and end of current week
    const getWeekBounds = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start: monday, end: sunday };
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };


    const openModal = (
        date: Date,
        prefilledData: Partial<CreateAppointmentScheduleDto> = {}
    ) => {
        // Set default times (9:00 AM to 10:00 AM)
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(date);
        end.setHours(10, 0, 0, 0);

        setFormData({
            title: prefilledData.clientName ? `Cita con ${prefilledData.clientName}` :
                prefilledData.title || '',
            start: formatToLocalISO(start),
            end: formatToLocalISO(end),
            notes: '',
            isAllDay: false,
            employeeId: undefined,
            serviceId: undefined,
            deposit: undefined,
            status: 'pending',
            ...prefilledData
        });
        setSelectedServices([]);
        setServiceDataSources({});
        setErrorMessage(null);
        setEditingEvent(null);
        setIsModalOpen(true);
    };

    const handleDayClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

        const prefill: Partial<CreateAppointmentScheduleDto> = {};
        if (selectedClient) {
            prefill.clientName = selectedClient.name;
            prefill.clientId = selectedClient.id;
        }

        openModal(clickedDate, prefill);
    };

    const handleDrop = (e: React.DragEvent, day: number) => {
        e.preventDefault();
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

        try {
            const rawData = e.dataTransfer.getData('application/json');
            if (!rawData) return;

            const { type, data } = JSON.parse(rawData);
            const prefill: Partial<CreateAppointmentScheduleDto> = {};

            if (type === 'client') {
                const client = data as ClientProfile;
                prefill.clientName = client.name;
                prefill.clientId = client.id;
            } else if (type === 'employee') {
                const employee = data as Employee;
                prefill.employeeId = employee.id;
                prefill.title = `Bloqueo/Cita - ${employee.name}`;
            }

            openModal(clickedDate, prefill);
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleEventClick = (e: React.MouseEvent, event: AppointmentSchedule) => {
        e.stopPropagation();

        // Restrict access for levels 1, 2, 3
        if (isLevel123) {
            return;
        }

        setSelectedEventForAction(event);
        setIsActionModalOpen(true);
    };

    const handleEditSelectedEvent = () => {
        if (!selectedEventForAction) return;
        const event = selectedEventForAction;
        setEditingEvent(event);
        setErrorMessage(null);
        setFormData({
            title: event.title,
            start: formatToLocalISO(new Date(event.start)),
            end: formatToLocalISO(new Date(event.end)),
            notes: event.notes || '',
            isAllDay: event.isAllDay,
            clientName: event.clientName || '',
            clientId: event.clientId,
            employeeId: event.employeeId,
            serviceId: event.serviceId,
            deposit: event.deposit,
            status: event.status || 'pending',
        });

        // Try to identify selected services from availableServices if title contains them
        const foundServices = availableServices.filter(s => event.title.includes(s.name));
        setSelectedServices(foundServices.map(s => ({ value: s.id, label: s.name })));

        setIsActionModalOpen(false);
        setIsModalOpen(true);
    };

    const handleConfirmSelectedEvent = () => {
        if (!selectedEventForAction) return;
        const event = selectedEventForAction;

        if (!event.clientId) {
            // New Client: Redirect to /clients/new to register them first
            const params = new URLSearchParams();
            if (event.clientName) params.set('name', event.clientName);
            router.push(`/clients/new?${params.toString()}`);
            return;
        }

        const date = new Date(event.start);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${year}-${month}-${day}`;

        const startTime = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        // Get employee name
        const employee = availableEmployees.find(e => e.id === event.employeeId);

        // Map services
        // If we have selectedServices in state for the current editing event it might be better, 
        // but here we just have selectedEventForAction.
        // We'll try to find services matching the title or the serviceId
        const servicesInTitle = availableServices.filter(s => event.title.includes(s.name));
        const serviceNames = servicesInTitle.map(s => s.name).join(',');

        const params = new URLSearchParams();
        params.set('date', formattedDate);
        params.set('start', startTime);
        params.set('end', endTime);
        if (event.clientId) params.set('clientId', String(event.clientId));
        if (event.clientName) params.set('clientName', event.clientName);
        if (employee) params.set('employee', employee.name);
        if (serviceNames) params.set('services', serviceNames);

        router.push(`/appointments/new?${params.toString()}`);
    };

    const handleConfirmAbsence = async () => {
        if (!selectedEventForAction) return;

        try {
            await updateAppointmentSchedule(selectedEventForAction.id, {
                status: 'canceled'
            });
            setIsActionModalOpen(false);
            fetchData();
            showSuccess('Turno marcado como ausencia (cancelado)');
        } catch (error) {
            console.error('Error canceling event', error);
            alert('Error al cancelar el turno');
        }
    };

    const handleDeleteFromAction = async () => {
        if (!selectedEventForAction) return;
        setEventToDelete(selectedEventForAction.id);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await deleteAppointmentSchedule(eventToDelete);
            setIsDeleteConfirmOpen(false);
            setIsActionModalOpen(false);
            setIsModalOpen(false);
            setEventToDelete(null);
            fetchData();
            showSuccess('Turno eliminado correctamente');
        } catch (error) {
            console.error('Error deleting event', error);
            alert('Error al eliminar el turno');
        }
    };

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Helper function to perform the actual save
    const performSave = async (finalData: CreateAppointmentScheduleDto) => {
        try {
            // Ensure dates are sent as UTC ISO strings
            const startISO = new Date(finalData.start).toISOString();
            const endISO = new Date(finalData.end).toISOString();
            finalData.start = startISO;
            finalData.end = endISO;

            if (editingEvent) {
                await updateAppointmentSchedule(editingEvent.id, finalData);
            } else {
                await createAppointmentSchedule(finalData);
            }
            setIsModalOpen(false);
            setIsLongDurationConfirmOpen(false);
            setPendingSaveData(null);
            onClearClient();
            fetchData();
        } catch (error) {
            console.error('Error saving event', error);
            alert('Error al guardar el evento');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalData = { ...formData };
            // If we have selected services, use their names for the title
            if (selectedServices.length > 0) {
                const serviceNames = selectedServices.map(s => s.label).join(', ');
                finalData.title = formData.clientName
                    ? `Cita ${formData.clientName}: ${serviceNames}`
                    : serviceNames;

                // Set serviceId to the first selected service for relation consistency
                finalData.serviceId = selectedServices[0].value;
            }

            if (finalData.employeeId && !finalData.isAllDay) {
                const newStart = new Date(finalData.start).getTime();
                const newEnd = new Date(finalData.end).getTime();

                // Check if employee allows overlapping appointments
                const employee = availableEmployees.find(e => e.id === finalData.employeeId);
                const allowOverlap = employee?.allow_overlap || false;

                if (!allowOverlap) {
                    const hasOverlap = events.some(event => {
                        // Skip the current event being edited
                        if (editingEvent && event.id === editingEvent.id) return false;
                        // Only check for the same employee and non-all-day events
                        if (event.employeeId !== finalData.employeeId || event.isAllDay || event.status === 'canceled') return false;

                        const existStart = new Date(event.start).getTime();
                        const existEnd = new Date(event.end).getTime();

                        // Standard overlap check: (StartA < EndB) and (EndA > StartB)
                        return newStart < existEnd && newEnd > existStart;
                    });

                    if (hasOverlap) {
                        const employeeName = employee?.name || 'el profesional';
                        setErrorMessage(`El horario seleccionado coincide con otro turno de ${employeeName}.`);
                        return;
                    }
                }

                // Check if appointment is within employee working hours
                if (employee?.weekly_work_hours) {
                    const startDate = new Date(finalData.start);
                    const endDate = new Date(finalData.end);

                    // Get day of week in English (Sunday, Monday, etc.)
                    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayName = daysOfWeek[startDate.getDay()];

                    const workHours = employee.weekly_work_hours[dayName];
                    if (workHours && workHours['check-in'] && workHours['check-out']) {
                        // Parse work hours
                        const [checkInHour, checkInMinute] = workHours['check-in'].split(':').map(Number);
                        const [checkOutHour, checkOutMinute] = workHours['check-out'].split(':').map(Number);

                        // Create Date objects for comparison
                        const workStart = new Date(startDate);
                        workStart.setHours(checkInHour, checkInMinute, 0, 0);

                        const workEnd = new Date(startDate);
                        workEnd.setHours(checkOutHour, checkOutMinute, 0, 0);

                        // Check if appointment is outside working hours
                        if (startDate < workStart || endDate > workEnd) {
                            setErrorMessage(
                                `El turno está fuera del horario de trabajo de ${employee.name}. ` +
                                `Horario disponible: ${workHours['check-in']} - ${workHours['check-out']}`
                            );
                            return;
                        }
                    }
                }
            }

            setErrorMessage(null);

            // Check if duration is greater than 3 hours (180 minutes)
            const startTime = new Date(finalData.start).getTime();
            const endTime = new Date(finalData.end).getTime();
            const durationMinutes = (endTime - startTime) / (1000 * 60);
            const THREE_HOURS_IN_MINUTES = 180;

            if (durationMinutes > THREE_HOURS_IN_MINUTES && !finalData.isAllDay) {
                // Store the data and show confirmation modal
                setPendingSaveData(finalData);
                setIsLongDurationConfirmOpen(true);
                return;
            }

            // Proceed with save
            await performSave(finalData);
        } catch (error) {
            console.error('Error saving event', error);
            alert('Error al guardar el evento');
        }
    };

    const confirmLongDurationSave = async () => {
        if (pendingSaveData) {
            await performSave(pendingSaveData);
        }
    };

    const cancelLongDurationSave = () => {
        setIsLongDurationConfirmOpen(false);
        setPendingSaveData(null);
    };



    const handleDelete = async () => {
        if (!editingEvent) return;
        setEventToDelete(editingEvent.id);
        setIsDeleteConfirmOpen(true);
    };

    const serviceOptions = useMemo(() => {
        if (!formData.employeeId) {
            return availableServices.map(s => ({ value: s.id, label: s.name }));
        }

        const employee = availableEmployees.find(e => e.id === formData.employeeId);
        if (!employee || !employee.jobTitle || employee.jobTitle.length === 0) {
            return availableServices.map(s => ({ value: s.id, label: s.name }));
        }

        // Filter services where the area matches one of the employee's job titles
        const filtered = availableServices.filter(s =>
            s.area && employee.jobTitle.includes(s.area)
        );

        return filtered.map(s => ({ value: s.id, label: s.name }));
    }, [availableServices, formData.employeeId, availableEmployees]);

    // Clear services if they are no longer in the filtered list when professional changes
    useEffect(() => {
        if (selectedServices.length > 0 && serviceOptions.length > 0) {
            const validServiceIds = new Set(serviceOptions.map(o => o.value));
            const filteredSelection = selectedServices.filter(s => validServiceIds.has(s.value));

            if (filteredSelection.length !== selectedServices.length) {
                setSelectedServices(filteredSelection);
            }
        } else if (selectedServices.length > 0 && formData.employeeId && serviceOptions.length === 0) {
            // If employee selected but has NO matching services, clear all
            setSelectedServices([]);
        }
    }, [serviceOptions, formData.employeeId]);

    const clientOptions = useMemo(() =>
        availableClients.map(c => ({ value: c.id, label: c.name || c.phoneNumber })),
        [availableClients]);

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days: React.ReactNode[] = [];

        // Get selected employee for work hours display
        const selectedEmployee = filterEmployeeId !== 'all'
            ? availableEmployees.find(e => e.id === filterEmployeeId)
            : null;

        const daysOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Calculate total rows to determine if a day is in the last row
        const visibleDayCount = visibleDays.length || 7;

        if (!isWeekView) {
            // MONTH VIEW
            // Add padding cells for proper alignment
            let paddingCount = 0;
            if (visibleDays.length > 0) {
                for (let i = 0; i < firstDay; i++) {
                    if (visibleDays.includes(i)) {
                        paddingCount++;
                    }
                }
            } else {
                paddingCount = firstDay;
            }

            for (let i = 0; i < paddingCount; i++) {
                days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-100"></div>);
            }

            // Calculate total rows including padding
            const totalCells = paddingCount + daysInMonth;
            const totalRows = Math.ceil(totalCells / visibleDayCount);

            // Maximum appointments to show before "+X more"
            const MAX_VISIBLE_APPOINTMENTS = 3;

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = date.getDay();

                // Only render days that are in the visible days configuration
                if (visibleDays.length > 0 && !visibleDays.includes(dayOfWeek)) {
                    continue;
                }

                const dayEvents = events.filter(e => {
                    const eDate = new Date(e.start);
                    const isSameDay = eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
                    const matchesFilter = filterEmployeeId === 'all' || String(e.employeeId) === filterEmployeeId;
                    return isSameDay && matchesFilter;
                }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                renderDayCell(days as React.ReactNode[], day, date, dayEvents, isToday(date), totalRows, visibleDayCount, selectedEmployee || null, daysOfWeekNames, MAX_VISIBLE_APPOINTMENTS);
            }
        } else {
            // WEEK VIEW
            const { start: weekStart } = getWeekBounds(currentDate);

            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + i);
                const dayOfWeek = date.getDay();

                // Only render days that are in the visible days configuration
                if (visibleDays.length > 0 && !visibleDays.includes(dayOfWeek)) {
                    continue;
                }

                const dayEvents = events.filter(e => {
                    const eDate = new Date(e.start);
                    const isSameDay = eDate.getDate() === date.getDate() && eDate.getMonth() === date.getMonth() && eDate.getFullYear() === date.getFullYear();
                    const matchesFilter = filterEmployeeId === 'all' || String(e.employeeId) === filterEmployeeId;
                    return isSameDay && matchesFilter;
                }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                renderDayCell(days as React.ReactNode[], date.getDate(), date, dayEvents, isToday(date), 1, visibleDayCount, selectedEmployee || null, daysOfWeekNames, 99); // More space in week view
            }
        }

        return days;
    };

    const isToday = (date: Date) => {
        return new Date().toDateString() === date.toDateString();
    };

    const renderDayCell = (
        days: any[],
        day: number,
        date: Date,
        dayEvents: AppointmentSchedule[],
        isToday: boolean,
        totalRows: number,
        visibleDayCount: number,
        selectedEmployee: Employee | null,
        daysOfWeekNames: string[],
        maxVisible: number
    ) => {
        const isExpanded = expandedDay === day;
        const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, maxVisible);
        const hasMoreAppointments = dayEvents.length > maxVisible;
        const hiddenCount = dayEvents.length - maxVisible;
        const rowIndex = Math.floor(days.length / visibleDayCount);
        const isBottomRow = rowIndex >= totalRows - 1;

        // Get work hours for this day
        let workHoursDisplay = null;
        if (selectedEmployee && selectedEmployee.weekly_work_hours) {
            const dayName = daysOfWeekNames[date.getDay()];
            const hours = selectedEmployee.weekly_work_hours[dayName];
            if (hours && hours['check-in'] && hours['check-out']) {
                workHoursDisplay = (
                    <span className="ml-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {hours['check-in']} - {hours['check-out']}
                    </span>
                );
            }
        }

        days.push(
            <div
                key={`${date.getTime()}-${day}`}
                onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('[data-event-item]') &&
                        !(e.target as HTMLElement).closest('[data-expand-btn]')) {
                        setExpandedDay(null);
                        setExpandedEventId(null);
                        handleDayClick(day);
                    }
                }}
                onDrop={(e) => handleDrop(e, day)}
                onDragOver={handleDragOver}
                className={`min-h-[120px] md:h-32 border border-gray-200 p-1 md:p-2 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors relative ${isToday ? 'bg-pink-50' : 'bg-white'} ${isExpanded ? 'overflow-visible z-[100]' : 'overflow-hidden hover:overflow-visible hover:z-[40]'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                        <span className={`text-xs md:text-sm font-semibold ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                            {/* Show full day name on mobile week view, just number on desktop/month view */}
                            <span className="md:hidden font-bold mr-1">{DAYS[date.getDay()]}</span>
                            {day}
                        </span>
                        <span className="hidden md:inline">{workHoursDisplay}</span>
                    </div>
                    {dayEvents.length > 0 && (
                        <span className="text-[8px] md:text-[9px] font-medium text-gray-400 bg-gray-100 px-1 md:px-1.5 py-0.5 rounded">
                            {dayEvents.length}
                        </span>
                    )}
                </div>
                <div className="mt-1 space-y-1">
                    {visibleEvents.map(event => {
                        const clientName = event.clientName || availableClients.find(c => c.id === event.clientId)?.name || 'Sin cliente';
                        const employeeName = availableEmployees.find(emp => emp.id === event.employeeId)?.name || 'Sin asignar';
                        const startTime = mounted && !event.isAllDay ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        const endTime = mounted && !event.isAllDay ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                        const isEventExpanded = expandedEventId === event.id;

                        return (
                            <div
                                key={event.id}
                                data-event-item="true"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Soft click opens expanded detail on mobile (hover imitation)
                                    // Second click or direct click on action buttons opens modal
                                    if (window.innerWidth < 768) {
                                        if (expandedEventId === event.id) {
                                            handleEventClick(e, event);
                                        } else {
                                            setExpandedEventId(event.id);
                                        }
                                    } else {
                                        handleEventClick(e, event);
                                    }
                                }}
                                className={`group text-[11px] md:text-xs p-1 md:p-1.5 rounded text-white shadow-sm transition-all duration-200 cursor-pointer active:scale-95 md:hover:scale-[1.05] hover:shadow-xl hover:z-[50] relative ${event.status === 'canceled' ? 'bg-red-600' :
                                    event.status === 'unavailable' ? 'bg-black' :
                                        (event.status === 'confirmed' || event.deposit) ? 'bg-emerald-600' :
                                            'bg-amber-500'
                                    } ${isEventExpanded ? 'ring-2 ring-white ring-offset-2 ring-offset-pink-400 z-[60]' : ''}`}
                            >
                                {/* Mobile Optimized Horizontal Layout (Week View) */}
                                <div className="flex md:hidden items-center gap-2">
                                    {mounted && !event.isAllDay && (
                                        <span className="font-mono text-[10px] font-bold w-20 text-right shrink-0 leading-tight">
                                            {startTime}<br />{endTime}
                                        </span>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <span className="text-[11px] font-bold truncate leading-tight">
                                            {clientName}
                                        </span>
                                        <span className="text-[10px] opacity-90 truncate leading-tight">
                                            {event.title.includes(':') ? event.title.split(':')[1] : employeeName}
                                        </span>
                                    </div>
                                </div>

                                {/* Desktop / Standard Layout */}
                                <div className="hidden md:block">
                                    <div className="flex items-center justify-between gap-1">
                                        {mounted && !event.isAllDay && (
                                            <span className="font-mono text-[9px] md:text-[10px] font-bold whitespace-nowrap">
                                                {startTime}-{endTime}
                                            </span>
                                        )}
                                        <span className={`text-[10px] md:text-[11px] font-medium truncate flex-1 ${isEventExpanded ? 'whitespace-normal' : ''}`}>
                                            {clientName}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded content for mobile tap or desktop hover */}
                                <div className={`${isEventExpanded ? 'block' : 'hidden md:group-hover:block'} mt-1.5 pt-1.5 border-t border-white/20 animate-in fade-in slide-in-from-top-1 duration-200`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] opacity-90 font-bold uppercase">Fin: {endTime}</span>
                                        {event.deposit && <span className="text-[9px] bg-white text-emerald-700 px-1 rounded font-bold">${event.deposit}</span>}
                                    </div>
                                    <div className="text-[9px] font-medium opacity-90 truncate">
                                        👩‍💼 {employeeName}
                                    </div>
                                    {event.title.includes(': ') && (
                                        <div className="text-[9px] font-medium mt-1 italic opacity-80 leading-tight">
                                            ✨ {event.title.split(': ')[1]}
                                        </div>
                                    )}
                                    {isEventExpanded && (
                                        <div className="mt-2 flex gap-2">
                                            {!isLevel123 && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEventClick(e, event); }}
                                                    className="flex-1 bg-white/20 hover:bg-white/30 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
                                                >
                                                    Opciones
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedEventId(null); }}
                                                className={`bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[9px] ${isLevel123 ? 'flex-1' : ''}`}
                                            >
                                                {isLevel123 ? 'Cerrar' : '✕'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {hasMoreAppointments && !isExpanded && (
                        <button
                            data-expand-btn="true"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDay(day);
                            }}
                            className="absolute bottom-1 left-1 right-1 mx-auto w-[95%] text-[10px] font-bold text-pink-600 bg-white/90 hover:bg-pink-50 py-0.5 rounded border border-pink-100 shadow-sm transition-all z-[30]"
                        >
                            +{hiddenCount} más
                        </button>
                    )}
                </div>

                {isExpanded && (
                    <div
                        data-expanded-panel="true"
                        className={`absolute left-0 right-0 z-[200] bg-white border border-gray-300 rounded-lg shadow-2xl p-3 ${isBottomRow ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                        style={{ minWidth: '280px', maxHeight: '300px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                            <span className="font-bold text-gray-800 text-sm">
                                {day} {MONTHS[date.getMonth()]} - {dayEvents.length} citas
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedDay(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '240px' }}>
                            {dayEvents.map(event => {
                                const employeeName = availableEmployees.find(emp => emp.id === event.employeeId)?.name || 'Sin asignar';
                                const clientName = event.clientName || availableClients.find(c => c.id === event.clientId)?.name || 'Sin cliente';
                                const startTime = mounted && !event.isAllDay ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                const endTime = mounted && !event.isAllDay ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                                return (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedDay(null);
                                            handleEventClick(e, event);
                                        }}
                                        className={`group p-2 rounded-lg text-white shadow-sm cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all ${event.status === 'canceled' ? 'bg-red-600' :
                                            event.status === 'unavailable' ? 'bg-black' :
                                                (event.status === 'confirmed' || event.deposit) ? 'bg-emerald-600' :
                                                    'bg-amber-500'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            {mounted && !event.isAllDay && (
                                                <span className="font-mono text-xs font-bold">
                                                    {startTime}-{endTime}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs font-medium">{clientName}</div>
                                        <div className="text-[10px] opacity-90 mt-1">Prof: {employeeName}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="h-full flex flex-col bg-white">
            {/* Mobile-Responsive Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center p-3 md:p-6 border-b border-gray-200 gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 capitalize text-center md:text-left">
                    {MONTHS[currentDate.getMonth()]} <span className="text-gray-400 font-light">{currentDate.getFullYear()}</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                    {/* Employee Filter - Full width on mobile */}
                    <div className={`flex items-center space-x-2 p-1.5 rounded-xl border transition-all duration-300 ${filterEmployeeId === 'all'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-pink-50 border-pink-200 shadow-sm ring-4 ring-pink-500/5'
                        }`}>
                        <span className={`text-[10px] font-bold px-2 uppercase tracking-widest whitespace-nowrap ${filterEmployeeId === 'all' ? 'text-gray-400' : 'text-pink-600'
                            }`}>
                            Filtrar:
                        </span>
                        <select
                            value={filterEmployeeId}
                            onChange={(e) => setFilterEmployeeId(e.target.value)}
                            disabled={isLevel123}
                            className={`text-xs md:text-sm border-none bg-transparent focus:ring-0 font-bold flex-1 min-w-0 cursor-pointer ${filterEmployeeId === 'all' ? 'text-gray-700' : 'text-pink-700'
                                } ${isLevel123 ? 'cursor-not-allowed opacity-70' : ''}`}
                        >
                            {!isLevel123 && <option value="all">Todos los Profesionales</option>}
                            {availableEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setIsWeekView(false)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${!isWeekView ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            MES
                        </button>
                        <button
                            onClick={() => setIsWeekView(true)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${isWeekView ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            SEM
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex space-x-2 justify-center">
                        <button
                            onClick={isWeekView ? handlePrevWeek : handlePrevMonth}
                            className="px-3 md:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 text-sm font-bold active:scale-95 transition-transform"
                        >
                            ◀
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 md:px-4 py-2 bg-pink-50 text-pink-700 border border-pink-200 rounded-md hover:bg-pink-100 text-xs md:text-sm font-medium active:scale-95 transition-transform">
                            Hoy
                        </button>
                        <button
                            onClick={isWeekView ? handleNextWeek : handleNextMonth}
                            className="px-3 md:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 text-sm font-bold active:scale-95 transition-transform"
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid - Responsive padding */}
            <div className="flex-1 overflow-auto p-2 md:p-6 pb-16 md:pb-16">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                    {/* Day Headers - Responsive text */}
                    {/* Day Headers - Responsive text - Hidden on mobile week view (agenda style) */}
                    <div
                        className={`grid gap-px text-center text-[10px] md:text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 ${isWeekView ? 'hidden md:grid' : ''}`}
                        style={{ gridTemplateColumns: `repeat(${visibleDays.length || 7}, minmax(0, 1fr))` }}
                    >
                        {DAYS.map((day, index) => {
                            if (visibleDays.length > 0 && !visibleDays.includes(index)) return null;
                            return <div key={day} className="py-1.5 md:py-2.5 uppercase tracking-wide">{day}</div>
                        })}
                    </div>

                    {/* Calendar Days Grid */}
                    <div
                        className={`grid gap-px bg-gray-200 border-b border-l border-r border-gray-200 overflow-visible ${isWeekView ? 'grid-cols-1 md:grid-cols-7' : ''}`}
                        style={isWeekView && window.innerWidth < 768 ? {} : { gridTemplateColumns: `repeat(${visibleDays.length || 7}, minmax(0, 1fr))` }}
                    >
                        {renderDays()}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 md:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className={`px-4 md:px-6 py-3 md:py-4 flex-shrink-0 flex justify-between items-center ${formData.status === 'unavailable' ? 'bg-gray-800' :
                            formData.clientId ? 'bg-purple-600' : 'bg-pink-600'
                            }`}>
                            <h3 className="text-base md:text-lg font-bold text-white">
                                {formData.status === 'unavailable' ? 'Bloqueo / No Disponible' : (editingEvent ? 'Editar Turno' : 'Nuevo Turno')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors p-1">
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto flex-1">
                            {errorMessage && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700 font-medium">
                                                {errorMessage}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setErrorMessage(null)}
                                            className="ml-auto pl-3"
                                        >
                                            <svg className="h-4 w-4 text-red-400 hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Fixed Date Display */}
                            <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-100 rounded-2xl p-4 flex items-center space-x-4 shadow-sm">
                                <div className="bg-pink-600 p-3 rounded-xl shadow-md shadow-pink-200">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-0.5">Día Seleccionado</p>
                                    <p className="text-base font-extrabold text-gray-900 capitalize">
                                        {formData.start ? (() => {
                                            const [datePart] = formData.start.split('T');
                                            const [y, m, d] = datePart.split('-').map(Number);
                                            return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            });
                                        })() : '-'}
                                    </p>
                                </div>
                            </div>

                            {formData.status !== 'unavailable' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Seña (Monto)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm font-bold">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 pl-7 border"
                                            placeholder="Ingrese monto o dejar en blanco para 'NA'"
                                            value={formData.deposit || ''}
                                            onChange={(e) => setFormData({ ...formData, deposit: e.target.value === '' ? undefined : Number(e.target.value) })}
                                        />
                                    </div>
                                    <p className="mt-1 text-[10px] text-gray-400">Si el campo queda vacío aparecerá como 'NA' y el turno será amarillo.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {formData.status !== 'unavailable' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                        <CreatableSelect
                                            isClearable
                                            options={clientOptions}
                                            value={formData.clientId
                                                ? { value: formData.clientId, label: formData.clientName }
                                                : formData.clientName
                                                    ? { value: '', label: formData.clientName }
                                                    : null
                                            }
                                            onChange={(selected: any) => {
                                                if (selected) {
                                                    setFormData({
                                                        ...formData,
                                                        clientId: selected.value || undefined,
                                                        clientName: selected.label
                                                    });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        clientId: undefined,
                                                        clientName: ''
                                                    });
                                                }
                                            }}
                                            onCreateOption={(inputValue) => {
                                                setFormData({
                                                    ...formData,
                                                    clientId: undefined,
                                                    clientName: inputValue
                                                });
                                            }}
                                            placeholder="Buscar o escribir nombre..."
                                            formatCreateLabel={(inputValue) => `Nuevo cliente: "${inputValue}"`}
                                            className="text-sm"
                                            theme={(theme) => ({
                                                ...theme,
                                                colors: {
                                                    ...theme.colors,
                                                    primary: '#db2777',
                                                }
                                            })}
                                        />
                                    </div>
                                )}
                                <div className={formData.status === 'unavailable' ? "col-span-2" : ""}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border"
                                        value={formData.employeeId || ''}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value || undefined })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {availableEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {formData.status !== 'unavailable' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Servicio(s)</label>
                                    <Select
                                        isMulti
                                        options={serviceOptions}
                                        value={selectedServices}
                                        onChange={(selected, actionMeta) => {
                                            // Allow duplicate services by adding unique IDs
                                            if (actionMeta.action === 'select-option' && actionMeta.option) {
                                                const newService = {
                                                    ...actionMeta.option,
                                                    uniqueId: `${actionMeta.option.value}-${Date.now()}-${Math.random()}`
                                                };
                                                setSelectedServices([...selectedServices, newService]);
                                            } else if (actionMeta.action === 'remove-value' && actionMeta.removedValue) {
                                                setSelectedServices(selectedServices.filter(s => s.uniqueId !== actionMeta.removedValue.uniqueId));
                                            } else if (actionMeta.action === 'clear') {
                                                setSelectedServices([]);
                                            }
                                        }}
                                        placeholder="Seleccionar servicios..."
                                        className="text-sm"
                                        getOptionLabel={(option) => option.label}
                                        getOptionValue={(option) => option.uniqueId || option.value}
                                        styles={{
                                            multiValue: (base, state) => {
                                                const source = serviceDataSources[state.data.label];
                                                let bgColor = base.backgroundColor;
                                                let borderColor = base.border;

                                                if (source === 'personal') {
                                                    bgColor = '#ecfdf5'; // emerald-50
                                                    borderColor = '1px solid #10b981'; // emerald-500
                                                } else if (source === 'default') {
                                                    bgColor = '#fefce8'; // yellow-50
                                                    borderColor = '1px solid #eab308'; // yellow-500
                                                }

                                                return {
                                                    ...base,
                                                    backgroundColor: bgColor,
                                                    border: borderColor,
                                                    borderRadius: '6px',
                                                };
                                            },
                                            multiValueLabel: (base, state) => {
                                                const source = serviceDataSources[state.data.label];
                                                let color = base.color;
                                                let fontWeight = base.fontWeight;

                                                if (source === 'personal') {
                                                    color = '#065f46'; // emerald-800
                                                    fontWeight = '600';
                                                } else if (source === 'default') {
                                                    color = '#854d0e'; // yellow-800
                                                    fontWeight = '600';
                                                }

                                                return {
                                                    ...base,
                                                    color,
                                                    fontWeight,
                                                };
                                            },
                                            multiValueRemove: (base, state) => {
                                                const source = serviceDataSources[state.data.label];
                                                let color = base.color;
                                                let hoverBg = base[':hover']?.backgroundColor;

                                                if (source === 'personal') {
                                                    color = '#065f46';
                                                    hoverBg = '#10b981';
                                                } else if (source === 'default') {
                                                    color = '#854d0e';
                                                    hoverBg = '#eab308';
                                                }

                                                return {
                                                    ...base,
                                                    color: color,
                                                    ':hover': {
                                                        backgroundColor: hoverBg,
                                                        color: 'white',
                                                    },
                                                };
                                            },
                                        }}
                                        theme={(theme) => ({
                                            ...theme,
                                            colors: {
                                                ...theme.colors,
                                                primary: '#db2777', // pink-600
                                            }
                                        })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        required
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border"
                                        value={formData.start?.split('T')[1]?.substring(0, 5) || ''}
                                        onChange={(e) => {
                                            const time = e.target.value;
                                            const datePart = formData.start.split('T')[0];
                                            setFormData({ ...formData, start: `${datePart}T${time}` });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
                                    <input
                                        type="time"
                                        required
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border"
                                        value={formData.end?.split('T')[1]?.substring(0, 5) || ''}
                                        onChange={(e) => {
                                            const time = e.target.value;
                                            const datePart = formData.end.split('T')[0];
                                            setFormData({ ...formData, end: `${datePart}T${time}` });
                                        }}
                                    />
                                </div>
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Detalles</label>
                                <textarea
                                    rows={3}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border resize-none"
                                    placeholder="Detalles adicionales..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="mt-6 flex justify-between pt-4 border-t border-gray-100">
                                {editingEvent ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 transition-colors rounded hover:bg-red-50"
                                    >
                                        Eliminar
                                    </button>
                                ) : <div></div>}
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="unavailable-checkbox-footer"
                                            className="w-4 h-4 text-pink-600 bg-white border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                                            checked={formData.status === 'unavailable'}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData({
                                                    ...formData,
                                                    status: checked ? 'unavailable' : (formData.deposit ? 'confirmed' : 'pending'),
                                                    title: checked ? (formData.employeeId ? `BLOQUEO - ${availableEmployees.find(emp => emp.id === formData.employeeId)?.name}` : 'BLOQUEO') : (formData.title.startsWith('BLOQUEO') ? '' : formData.title)
                                                });
                                            }}
                                        />
                                        <label htmlFor="unavailable-checkbox-footer" className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
                                            Bloquear horario
                                        </label>
                                    </div>
                                    <div className="space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="text-gray-700 hover:text-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-pink-600 text-white px-5 py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-sm text-sm font-medium"
                                        >
                                            Guardar Turno
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isActionModalOpen && selectedEventForAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Opciones de Turno</h3>
                            <p className="text-sm text-gray-500 mb-6">{selectedEventForAction.title}</p>

                            <div className="space-y-3">
                                {selectedEventForAction.status !== 'canceled' && selectedEventForAction.status !== 'unavailable' && (
                                    <>
                                        <button
                                            onClick={handleConfirmSelectedEvent}
                                            className="w-full flex items-center justify-center space-x-2 bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-md active:scale-95"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>Confirmar Turno</span>
                                        </button>

                                        <button
                                            onClick={handleConfirmAbsence}
                                            className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-md active:scale-95"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>Confirmar Ausencia</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={handleEditSelectedEvent}
                                    className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 border-2 border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    <span>Editar Reserva</span>
                                </button>

                                <button
                                    onClick={handleDeleteFromAction}
                                    className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold hover:bg-red-100 transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    <span>Eliminar Turno</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Confirmar eliminación?</h3>
                            <p className="text-gray-500 mb-8">Esta acción no se puede deshacer. ¿Estás seguro de eliminar este turno programado?</p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteConfirmOpen(false);
                                        setEventToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isLongDurationConfirmOpen && pendingSaveData && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Turno de larga duración</h3>
                            <p className="text-gray-500 mb-4">
                                El turno tiene una duración mayor a 3 horas.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                                <p className="text-sm text-amber-800 font-medium">
                                    Duración: {(() => {
                                        const start = new Date(pendingSaveData.start).getTime();
                                        const end = new Date(pendingSaveData.end).getTime();
                                        const minutes = Math.round((end - start) / (1000 * 60));
                                        const hours = Math.floor(minutes / 60);
                                        const remainingMinutes = minutes % 60;
                                        return `${hours}h ${remainingMinutes}min`;
                                    })()}
                                </p>
                            </div>
                            <p className="text-gray-500 mb-6 text-sm">
                                ¿Estás seguro de que la hora de fin es correcta?
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={cancelLongDurationSave}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Corregir
                                </button>
                                <button
                                    onClick={confirmLongDurationSave}
                                    className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="fixed bottom-8 right-8 z-[80] animate-in slide-in-from-right-full duration-300">
                    <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400/20">
                        <div className="bg-white/20 rounded-full p-1">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-bold tracking-wide">{successMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
