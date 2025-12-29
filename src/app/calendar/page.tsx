'use client';

import { useState } from 'react';
import CalendarView from './CalendarView';
import ResourceSidebar from './ResourceSidebar';
import { ClientProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function CalendarPage() {
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

    const { level } = useAuthStore();
    const isLevel123 = level === '1' || level === '2' || level === '3';

    const handleSelectClient = (client: ClientProfile | null) => {
        setSelectedClient(client);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white shadow-xl rounded-xl border border-gray-200">
            {/* Sidebar: ERP Resources */}
            {!isLevel123 && (
                <ResourceSidebar
                    onSelectClient={handleSelectClient}
                    selectedClient={selectedClient}
                />
            )}

            {/* Main Content: Calendar */}
            <div className="flex-1 flex flex-col min-w-0">
                <CalendarView
                    selectedClient={selectedClient}
                    onClearClient={() => setSelectedClient(null)}
                />
            </div>
        </div>
    );
}
