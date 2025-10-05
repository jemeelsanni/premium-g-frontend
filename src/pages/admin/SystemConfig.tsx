/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/SystemConfig.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

interface ConfigItem {
    key: string;
    value: string;
    description: string;
    type: 'number' | 'text' | 'percentage';
}

export const SystemConfig: React.FC = () => {
    const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
    const queryClient = useQueryClient();

    const { data: configData, isLoading } = useQuery({
        queryKey: ['admin-config'],
        queryFn: () => adminService.getSystemConfig(),
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) =>
            adminService.updateSystemConfig(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-config'] });
            globalToast.success('Configuration updated successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update configuration');
        },
    });

    // Default system configurations with descriptions
    const systemConfigs: ConfigItem[] = [
        {
            key: 'DEFAULT_SERVICE_CHARGE',
            value: editedConfigs['DEFAULT_SERVICE_CHARGE'] ?? configData?.data?.configs?.DEFAULT_SERVICE_CHARGE ?? '10',
            description: 'Default service charge percentage for transport orders',
            type: 'percentage',
        },
        {
            key: 'MAX_CREDIT_DAYS',
            value: editedConfigs['MAX_CREDIT_DAYS'] ?? configData?.data?.configs?.MAX_CREDIT_DAYS ?? '60',
            description: 'Maximum credit period in days for distribution orders',
            type: 'number',
        },
        {
            key: 'LOW_STOCK_THRESHOLD',
            value: editedConfigs['LOW_STOCK_THRESHOLD'] ?? configData?.data?.configs?.LOW_STOCK_THRESHOLD ?? '20',
            description: 'Inventory threshold for low stock alerts',
            type: 'number',
        },
        {
            key: 'FUEL_PRICE_DEFAULT',
            value: editedConfigs['FUEL_PRICE_DEFAULT'] ?? configData?.data?.configs?.FUEL_PRICE_DEFAULT ?? '700',
            description: 'Default fuel price per liter (₦)',
            type: 'number',
        },
        {
            key: 'MIN_ORDER_AMOUNT',
            value: editedConfigs['MIN_ORDER_AMOUNT'] ?? configData?.data?.configs?.MIN_ORDER_AMOUNT ?? '50000',
            description: 'Minimum order amount for distribution (₦)',
            type: 'number',
        },
    ];

    const handleConfigChange = (key: string, value: string) => {
        setEditedConfigs({ ...editedConfigs, [key]: value });
    };

    const handleSaveConfig = async (key: string, value: string) => {
        await updateMutation.mutateAsync({ key, value });
        const newEdited = { ...editedConfigs };
        delete newEdited[key];
        setEditedConfigs(newEdited);
    };

    const hasUnsavedChanges = Object.keys(editedConfigs).length > 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Settings className="h-6 w-6 mr-2" />
                        System Configuration
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage global system settings and defaults
                    </p>
                </div>
            </div>

            {/* Warning Banner */}
            {hasUnsavedChanges && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-yellow-800">
                                Unsaved Changes
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                You have unsaved configuration changes. Remember to save each setting.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Cards */}
            <div className="space-y-4">
                {systemConfigs.map((config) => {
                    const isEdited = editedConfigs[config.key] !== undefined;
                    const currentValue = config.value;

                    return (
                        <div
                            key={config.key}
                            className={`bg-white shadow rounded-lg p-6 border-2 ${isEdited ? 'border-blue-300' : 'border-transparent'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {config.key.replace(/_/g, ' ')}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {config.description}
                                    </p>

                                    <div className="mt-4 flex items-center space-x-4">
                                        <div className="flex-1 max-w-xs">
                                            <Input
                                                type={config.type === 'text' ? 'text' : 'number'}
                                                value={currentValue}
                                                onChange={(e) =>
                                                    handleConfigChange(config.key, e.target.value)
                                                }
                                                placeholder={`Enter ${config.key.toLowerCase()}`}
                                            />
                                        </div>

                                        {config.type === 'percentage' && (
                                            <span className="text-gray-500">%</span>
                                        )}

                                        {isEdited && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSaveConfig(config.key, currentValue)}
                                                loading={updateMutation.isPending}
                                            >
                                                <Save className="h-4 w-4 mr-1" />
                                                Save
                                            </Button>
                                        )}
                                    </div>

                                    {isEdited && (
                                        <p className="mt-2 text-xs text-blue-600">
                                            * Configuration changed - click Save to apply
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                    <Settings className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-blue-900">
                            About System Configuration
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 space-y-2">
                            <p>
                                These settings control default values and behaviors across the entire system.
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Changes take effect immediately after saving</li>
                                <li>All monetary values are in Nigerian Naira (₦)</li>
                                <li>Percentage values should be entered as whole numbers (e.g., 10 for 10%)</li>
                                <li>Only Super Admin users can modify these settings</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};