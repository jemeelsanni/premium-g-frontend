/* eslint-disable react-refresh/only-export-components */
// src/components/BackendStatusChecker.tsx
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface BackendStatusProps {
    onStatusChange?: (isOnline: boolean) => void;
}

export const BackendStatusChecker: React.FC<BackendStatusProps> = ({ onStatusChange }) => {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const checkBackendStatus = async () => {
        try {
            const response = await fetch('/api/v1/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (response.ok) {
                setStatus('online');
                onStatusChange?.(true);
            } else {
                setStatus('offline');
                onStatusChange?.(false);
            }
        } catch (error) {
            console.warn('Backend health check failed:', error);
            setStatus('offline');
            onStatusChange?.(false);
        } finally {
            setLastChecked(new Date());
        }
    };

    useEffect(() => {
        // Initial check
        checkBackendStatus();

        // Check every 30 seconds
        const interval = setInterval(checkBackendStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    if (status === 'checking') {
        return (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking backend...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
                {status === 'online' ? (
                    <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Backend Online</span>
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Backend Offline</span>
                    </>
                )}
            </div>
            {lastChecked && (
                <span className="text-xs text-gray-400">
                    Last checked: {lastChecked.toLocaleTimeString()}
                </span>
            )}
        </div>
    );
};

// Helper hook for backend status
export const useBackendStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);

    const checkStatus = async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/v1/health', {
                method: 'GET',
                signal: AbortSignal.timeout(3000),
            });
            return response.ok;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        checkStatus().then(setIsOnline);
    }, []);

    return { isOnline, checkStatus };
};