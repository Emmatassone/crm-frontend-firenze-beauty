'use client';

import { useState } from 'react';
import CalendarView from './CalendarView';
import ResourceSidebar from './ResourceSidebar';
import { ClientProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function CalendarPage() {
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { level } = useAuthStore();
    const isLevel123 = level === '1' || level === '2' || level === '3';

    const handleSelectClient = (client: ClientProfile | null) => {
        setSelectedClient(client);
        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] md:h-[calc(100vh-100px)] overflow-hidden bg-white shadow-xl rounded-xl border border-gray-200 relative">
            {/* Mobile Sidebar Toggle Button */}
            {!isLevel123 && (
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden fixed bottom-6 right-6 z-50 bg-pink-600 text-white p-4 rounded-full shadow-2xl hover:bg-pink-700 transition-all active:scale-95"
                    aria-label="Toggle Resources"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </button>
            )}

            {/* Sidebar: ERP Resources - Hidden on mobile by default, shown on desktop */}
            {!isLevel123 && (
                <>
                    {/* Mobile Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                    
                    {/* Sidebar */}
                    <div className={`
                        fixed md:relative inset-y-0 left-0 z-40 
                        transform transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <ResourceSidebar
                            onSelectClient={handleSelectClient}
                            selectedClient={selectedClient}
                        />
                    </div>
                </>
            )}

            {/* Main Content: Calendar */}
            <div className="flex-1 flex flex-col min-w-0 w-full">
                <CalendarView
                    selectedClient={selectedClient}
                    onClearClient={() => setSelectedClient(null)}
                />
            </div>
        </div>
    );
}
