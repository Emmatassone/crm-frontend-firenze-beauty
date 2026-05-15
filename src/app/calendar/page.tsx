'use client';

import CalendarView from './CalendarView';

export default function CalendarPage() {
    return (
        <div className="flex h-[calc(100vh-100px)] md:h-[calc(100vh-100px)] overflow-hidden bg-white shadow-xl rounded-xl border border-gray-200 relative">
            {/* Main Content: Calendar */}
            <div className="flex-1 flex flex-col min-w-0 w-full">
                <CalendarView
                    selectedClient={null}
                    onClearClient={() => {}}
                />
            </div>
        </div>
    );
}
