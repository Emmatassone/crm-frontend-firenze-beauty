import { useEffect, useRef } from 'react';

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
).trim().replace(/\/+$/, '');

/**
 * Hook that subscribes to the appointment-schedule SSE stream.
 * Calls `onChange` whenever another client creates, updates, or deletes a schedule.
 * Automatically reconnects on errors with exponential back-off (max 30 s).
 */
export function useCalendarSSE(onChangeCallback: () => void) {
    const onChangeRef = useRef(onChangeCallback);
    onChangeRef.current = onChangeCallback;

    useEffect(() => {
        let es: EventSource | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let reconnectDelay = 1000; // start at 1 s
        let isCancelled = false;

        const connect = () => {
            if (isCancelled) return;

            es = new EventSource(`${API_BASE_URL}/appointment-schedule/events`);

            es.onmessage = () => {
                // Any message means something changed → refetch
                onChangeRef.current();
            };

            es.onopen = () => {
                // Reset backoff on successful connection
                reconnectDelay = 1000;
            };

            es.onerror = () => {
                // EventSource auto-closes on error; reconnect manually with back-off
                es?.close();
                if (!isCancelled) {
                    reconnectTimeout = setTimeout(() => {
                        connect();
                    }, reconnectDelay);
                    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                }
            };
        };

        connect();

        return () => {
            isCancelled = true;
            es?.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);
}
