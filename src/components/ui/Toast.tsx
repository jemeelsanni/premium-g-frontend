/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
// src/components/ui/Toast.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Simplified toast functions for ease of use
export const toast = {
    success: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'success', title, message });
        }
    },
    error: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'error', title, message });
        }
    },
    info: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'info', title, message });
        }
    },
    warning: (title: string, message?: string) => {
        const context = useContext(ToastContext);
        if (context) {
            context.addToast({ type: 'warning', title, message });
        }
    },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
    toast,
    onRemove,
}) => {
    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle,
    };

    const Icon = icons[toast.type];

    const colorClasses = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    };

    const iconClasses = {
        success: 'text-green-400',
        error: 'text-red-400',
        info: 'text-blue-400',
        warning: 'text-yellow-400',
    };

    React.useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <div
            className={clsx(
                'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
                colorClasses[toast.type]
            )}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={clsx('h-6 w-6', iconClasses[toast.type])} />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium">{toast.title}</p>
                        {toast.message && (
                            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => onRemove(toast.id)}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const contextValue: ToastContextValue = {
        toasts,
        addToast,
        removeToast,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast Container */}
            <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
                <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};

// Hook for using toast outside of React components
let globalToastContext: ToastContextValue | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export const setGlobalToastContext = (context: ToastContextValue) => {
    globalToastContext = context;
};

export const globalToast = {
    success: (title: string, message?: string) => {
        globalToastContext?.addToast({ type: 'success', title, message });
    },
    error: (title: string, message?: string) => {
        globalToastContext?.addToast({ type: 'error', title, message });
    },
    info: (title: string, message?: string) => {
        globalToastContext?.addToast({ type: 'info', title, message });
    },
    warning: (title: string, message?: string) => {
        globalToastContext?.addToast({ type: 'warning', title, message });
    },
};