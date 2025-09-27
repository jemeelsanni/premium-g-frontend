import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read?: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Mock notifications - replace with real data
    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                id: '1',
                type: 'warning',
                title: 'Low Stock Alert',
                message: 'Bigi drinks (35cl) inventory is running low',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                read: false
            },
            {
                id: '2',
                type: 'success',
                title: 'Order Delivered',
                message: 'Order #12345 has been successfully delivered',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                read: false
            },
            {
                id: '3',
                type: 'info',
                title: 'Weekly Target Update',
                message: 'You are 85% towards your weekly target',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                read: true
            }
        ];
        setNotifications(mockNotifications);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return Check;
            case 'warning': return AlertTriangle;
            case 'error': return AlertTriangle;
            default: return Info;
        }
    };

    const getIconColor = (type: Notification['type']) => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-blue-600';
        }
    };

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isOpen && !target.closest('[data-notification-center]')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" data-notification-center>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = getIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getIconColor(notification.type)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900 pr-2">
                                                        {notification.title}
                                                    </p>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                        aria-label="Remove notification"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {notification.timestamp.toLocaleTimeString()}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                    {notification.actionLabel && notification.onAction && (
                                                        <button
                                                            onClick={notification.onAction}
                                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            {notification.actionLabel}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-gray-200 text-center">
                            <button
                                onClick={() => {
                                    setNotifications([]);
                                    setIsOpen(false);
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};