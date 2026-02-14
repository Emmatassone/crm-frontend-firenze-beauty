'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimePickerAMPMProps {
    value: string; // HH:mm format (24-hour)
    onChange: (value: string) => void;
    className?: string;
    required?: boolean;
}

export default function TimePickerAMPM({ value, onChange, className = '', required = false }: TimePickerAMPMProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Convert 24-hour format to 12-hour display
    const convert24to12 = (time24: string): { hour12: number; minute: number; period: 'AM' | 'PM' } => {
        if (!time24 || !time24.includes(':')) {
            return { hour12: 9, minute: 0, period: 'AM' };
        }
        const [hours, minutes] = time24.split(':').map(Number);
        const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
        let hour12 = hours % 12;
        if (hour12 === 0) hour12 = 12;
        return { hour12, minute: minutes, period };
    };

    // Convert 12-hour format to 24-hour for storage
    const convert12to24 = (hour12: number, minute: number, period: 'AM' | 'PM'): string => {
        let hours24 = hour12;
        if (period === 'AM') {
            if (hour12 === 12) hours24 = 0;
        } else {
            if (hour12 !== 12) hours24 = hour12 + 12;
        }
        return `${hours24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const { hour12, minute, period } = convert24to12(value);

    // Generate time options
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = [0, 15, 30, 45]; // Common minute intervals

    const handleHourChange = (newHour: number) => {
        const newTime = convert12to24(newHour, minute, period);
        onChange(newTime);
    };

    const handleMinuteChange = (newMinute: number) => {
        const newTime = convert12to24(hour12, newMinute, period);
        onChange(newTime);
    };

    const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
        const newTime = convert12to24(hour12, minute, newPeriod);
        onChange(newTime);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Display Input */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2.5 border cursor-pointer bg-white flex items-center justify-between hover:border-pink-300 transition-colors"
            >
                <span className="font-medium text-gray-700">{displayValue}</span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex divide-x divide-gray-100">
                        {/* Hours Column */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                            <div className="sticky top-0 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Hora
                            </div>
                            {/* Manual Hour Input */}
                            <div className="px-1 py-1 border-b border-gray-100 bg-gray-50/50">
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={hour12}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1 && val <= 12) {
                                            handleHourChange(val);
                                        }
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full text-center py-1 text-sm border-pink-200 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-300"
                                    placeholder="--"
                                    title="Escribir hora manualmente"
                                />
                            </div>
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleHourChange(h)}
                                    className={`w-full text-center py-2 text-sm transition-colors ${h === hour12
                                        ? 'bg-pink-600 text-white font-bold'
                                        : 'hover:bg-pink-50 text-gray-700'
                                        }`}
                                >
                                    {h.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* Minutes Column */}
                        <div className="flex-1 max-h-48 overflow-y-auto">
                            <div className="sticky top-0 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Min
                            </div>
                            {/* Manual Minute Input */}
                            <div className="px-1 py-1 border-b border-gray-100 bg-gray-50/50">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={minute}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 59) {
                                            handleMinuteChange(val);
                                        }
                                    }}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full text-center py-1 text-sm border-pink-200 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all placeholder:text-gray-300"
                                    placeholder="--"
                                    title="Escribir minutos manualmente"
                                />
                            </div>
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleMinuteChange(m)}
                                    className={`w-full text-center py-2 text-sm transition-colors ${m === minute
                                        ? 'bg-pink-600 text-white font-bold'
                                        : 'hover:bg-pink-50 text-gray-700'
                                        }`}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                        </div>

                        {/* AM/PM Column */}
                        <div className="w-16">
                            <div className="sticky top-0 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                                &nbsp;
                            </div>
                            {(['AM', 'PM'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => handlePeriodChange(p)}
                                    className={`w-full text-center py-3 text-sm font-bold transition-colors ${p === period
                                        ? 'bg-pink-600 text-white'
                                        : 'hover:bg-pink-50 text-gray-500'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick close button */}
                    <div className="border-t border-gray-100 p-2 bg-gray-50">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full py-1.5 text-xs font-semibold text-pink-600 hover:bg-pink-100 rounded transition-colors"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden native input for form validation */}
            {required && (
                <input
                    type="hidden"
                    value={value}
                    required
                />
            )}
        </div>
    );
}
