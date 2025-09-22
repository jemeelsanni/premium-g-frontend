import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    description?: string;
    action?: ReactNode;
}

export const Card = ({ children, className, title, description, action }: CardProps) => {
    return (
        <div className={cn('bg-white rounded-lg shadow', className)}>
            {(title || description || action) && (
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            {title && (
                                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            )}
                            {description && (
                                <p className="mt-1 text-sm text-gray-500">{description}</p>
                            )}
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                </div>
            )}
            <div className="px-6 py-4">{children}</div>
        </div>
    );
};