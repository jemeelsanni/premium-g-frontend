import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Info } from 'lucide-react';
import { Button } from './Button';

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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                                    variant="ghost"
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
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = getIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <Icon className={`h-5 w-5 mt-0.5 ${getIconColor(notification.type)}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <button
                                                        onClick={() => removeNotification(notification.id)}
                                                        className="text-gray-400 hover:text-gray-600"
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
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
<Button
    variant="outline"
    onClick={() => navigate('/distribution/orders')}
>
    Cancel
</Button>
      </div >

    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Order Details */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    label="Customer"
                    error={form.formState.errors.customerId?.message}
                    required
                >
                    <Select
                        {...form.register('customerId')}
                        placeholder="Select customer"
                        options={customerOptions}
                    />
                </FormField>

                <FormField
                    label="Delivery Location"
                    error={form.formState.errors.locationId?.message}
                    required
                >
                    <Select
                        {...form.register('locationId')}
                        placeholder="Select location"
                        options={locationOptions}
                    />
                </FormField>
            </div>

            <div className="mt-4">
                <FormField
                    label="Remarks"
                    error={form.formState.errors.remark?.message}
                >
                    <textarea
                        {...form.register('remark')}
                        placeholder="Order remarks or special instructions"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </FormField>
            </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Order Items</h2>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: '', pallets: 0, packs: 0, amount: 0 })}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-medium">Item {index + 1}</h3>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <FormField
                                    label="Product"
                                    error={form.formState.errors.orderItems?.[index]?.productId?.message}
                                    required
                                >
                                    <Select
                                        {...form.register(`orderItems.${index}.productId`)}
                                        placeholder="Select product"
                                        options={productOptions}
                                        onChange={(e) => {
                                            form.setValue(`orderItems.${index}.productId`, e.target.value);
                                            calculateItemAmount(index);
                                        }}
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Pallets"
                                error={form.formState.errors.orderItems?.[index]?.pallets?.message}
                            >
                                <Input
                                    type="number"
                                    {...form.register(`orderItems.${index}.pallets`, { valueAsNumber: true })}
                                    placeholder="0"
                                    min="0"
                                />
                            </FormField>

                            <FormField
                                label="Packs"
                                error={form.formState.errors.orderItems?.[index]?.packs?.message}
                                required
                            >
                                <Input
                                    type="number"
                                    {...form.register(`orderItems.${index}.packs`, { valueAsNumber: true })}
                                    placeholder="0"
                                    min="1"
                                    onChange={(e) => {
                                        form.setValue(`orderItems.${index}.packs`, parseInt(e.target.value) || 0);
                                        calculateItemAmount(index);
                                    }}
                                />
                            </FormField>
                        </div>

                        <div className="mt-4">
                            <FormField
                                label="Amount"
                                error={form.formState.errors.orderItems?.[index]?.amount?.message}
                            >
                                <div className="relative">
                                    <Input
                                        type="number"
                                        {...form.register(`orderItems.${index}.amount`, { valueAsNumber: true })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        readOnly
                                        className="bg-gray-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => calculateItemAmount(index)}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                        title="Recalculate amount"
                                    >
                                        <Calculator className="h-4 w-4" />
                                    </button>
                                </div>
                            </FormField>
                        </div>
                    </div>
                ))}
            </div>
        </div