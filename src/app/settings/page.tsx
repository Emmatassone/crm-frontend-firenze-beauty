'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import { getSettingByKey, updateSetting } from '@/lib/api';
import { BsCalendar3, BsCheck2, BsSave2 } from 'react-icons/bs';

const DAYS_OF_WEEK = [
    { id: 0, name: 'Domingo' },
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
];

export default function SettingsPage() {
    const { level, isTokenValid } = useAuthStore();
    const router = useRouter();
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Auth Check
        if (!isTokenValid() || level !== '6') {
            router.push('/');
            return;
        }

        fetchCalendarSettings();
    }, [level, isTokenValid, router]);

    const fetchCalendarSettings = async () => {
        try {
            setLoading(true);
            const setting = await getSettingByKey('calendar_days');
            if (setting && Array.isArray(setting.value)) {
                setSelectedDays(setting.value);
            } else {
                // Fallback or newly created
                setSelectedDays([1, 2, 3, 4, 5, 6]);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId: number) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(id => id !== dayId)
                : [...prev, dayId].sort((a, b) => a - b)
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage(null);
            await updateSetting({
                key: 'calendar_days',
                value: selectedDays
            });
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuración General</h1>
                    <p className="mt-2 text-gray-500">Administra las preferencias globales del sistema.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${saving
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-pink-200'
                        }`}
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <BsSave2 className="text-lg" />
                    )}
                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.type === 'success' ? <BsCheck2 className="text-xl" /> : <span>⚠️</span>}
                    <p className="font-semibold">{message.text}</p>
                </div>
            )}

            {/* Calendar Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                    <div className="p-3 bg-pink-100 rounded-2xl text-pink-600">
                        <BsCalendar3 className="text-2xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Visualización de Agenda</h2>
                        <p className="text-sm text-gray-500 text-pretty">Define qué días de la semana se mostrarán en la vista mensual del calendario.</p>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Días Habilitados</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                        {DAYS_OF_WEEK.map((day) => {
                            const checked = selectedDays.includes(day.id);
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${checked
                                            ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-md shadow-pink-100 ring-4 ring-pink-500/5'
                                            : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:bg-white'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${checked ? 'bg-pink-600 text-white' : 'bg-gray-200 group-hover:bg-gray-300'
                                        }`}>
                                        {day.name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-tight">{day.name}</span>
                                    {checked && (
                                        <div className="absolute -top-2 -right-2 bg-pink-600 text-white rounded-full p-1 shadow-lg border-2 border-white animate-in zoom-in duration-300">
                                            <BsCheck2 size={12} strokeWidth={1} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                        <div className="text-amber-500 text-2xl">💡</div>
                        <p className="text-sm text-amber-800 leading-relaxed font-medium">
                            Los cambios realizados aquí afectarán a todos los terminales. Los turnos agendados en días deshabilitados no serán visibles en la vista mensual hasta que el día sea habilitado nuevamente.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
