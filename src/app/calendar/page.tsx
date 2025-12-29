'use client';

import { useState } from 'react';
import CalendarView from './CalendarView';
import ResourceSidebar from './ResourceSidebar';
import { ClientProfile } from '@/lib/api';

export default function CalendarPage() {
    const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);

    const handleSelectClient = (client: ClientProfile | null) => {
        setSelectedClient(client);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-white shadow-xl rounded-xl border border-gray-200">
            {/* Sidebar: ERP Resources */}
            <ResourceSidebar
                onSelectClient={handleSelectClient}
                selectedClient={selectedClient}
            />

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
