import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AppointmentSchedule {
    id: string;
    title: string;
    start: string;
    end: string;
    clientName?: string;
    clientId?: string;
    employeeId?: string;
    serviceId?: string;
    notes?: string;
    isAllDay: boolean;
}

export type CreateAppointmentScheduleDto = Omit<AppointmentSchedule, 'id'>;
export type UpdateAppointmentScheduleDto = Partial<CreateAppointmentScheduleDto>;

const getAuthHeader = () => {
    const token = useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
};

export const appointmentScheduleService = {
    findAll: async (): Promise<AppointmentSchedule[]> => {
        const response = await axios.get(`${API_URL}/appointment-schedule`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    create: async (data: CreateAppointmentScheduleDto): Promise<AppointmentSchedule> => {
        const response = await axios.post(`${API_URL}/appointment-schedule`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    update: async (id: string, data: UpdateAppointmentScheduleDto): Promise<AppointmentSchedule> => {
        const response = await axios.patch(`${API_URL}/appointment-schedule/${id}`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await axios.delete(`${API_URL}/appointment-schedule/${id}`, {
            headers: getAuthHeader(),
        });
    },
};
