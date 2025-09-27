import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FormFieldProps {
    label?: string;
    error?: string;
    helper?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}

export const FormField = ({
    label,
    error,
    helper,
    required,
    children,
    className
}: FormFieldProps) => {
    return (
        <div className={clsx('space-y-1', className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {children}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            {helper && !error && (
                <p className="text-sm text-gray-500">{helper}</p>
            )}
        </div>
    );
};