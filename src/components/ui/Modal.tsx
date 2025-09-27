import React from 'react';
import { clsx } from 'clsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div
                    className={clsx(
                        'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle',
                        {
                            'sm:max-w-sm': size === 'sm',
                            'sm:max-w-lg': size === 'md',
                            'sm:max-w-2xl': size === 'lg',
                            'sm:max-w-4xl': size === 'xl',
                        },
                        'sm:w-full'
                    )}
                >
                    {title && (
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {title}
                            </h3>
                        </div>
                    )}
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6">{children}</div>
                </div>
            </div>
        </div>
    );
};