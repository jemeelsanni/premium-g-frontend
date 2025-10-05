/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/SystemConfig.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Edit, Save, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';

interface ConfigEdit {
    key: string;
    value: string;
}

export const SystemConfig: React.FC = () => {
    const [editingConfig, setEditingConfig] = useState<ConfigEdit | null>(null);
    const queryClient = useQueryClient();

    // ✅ NOW USING: adminService.getSystemConfig()
    const { data: configData, isLoading } = useQuery({
        queryKey: ['system-config'],
        queryFn: () => adminService.getSystemConfig(),
    });

    // ✅ NOW USING: adminService.updateSystemConfig()
    const updateMutation = useMutation({
        mutationFn: ({ key, value }: ConfigEdit) =>
            adminService.updateSystemConfig(key, value),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-config'] });
            globalToast.success('Configuration updated successfully!');
            setEditingConfig(null);
        },
        onError: (error: any) => {
            globalToast.error(
                error.response?.data?.message || 'Failed to update configuration'
            );
        },
    });

    const handleEdit = (config: any) => {
        setEditingConfig({
            key: config.key,
            value: config.value,
        });
    };

    const handleSave = () => {
        if (editingConfig) {
            updateMutation.mutate(editingConfig);
        }
    };

    const handleCancel = () => {
        setEditingConfig(null);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const configs = configData?.data?.configs || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
                    <p className="text-gray-600">Manage system-wide settings and parameters</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6 space-y-4">
                    {configs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No system configurations found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {configs.map((config: any) => (
                                <div
                                    key={config.key}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Settings className="h-4 w-4 text-gray-400" />
                                                <h3 className="text-sm font-medium text-gray-900">
                                                    {config.key}
                                                </h3>
                                            </div>

                                            {editingConfig?.key === config.key ? (
                                                <div className="space-y-3">
                                                    <Input
                                                        type="text"
                                                        value={editingConfig?.value || ''}
                                                        onChange={(e) =>
                                                            editingConfig && setEditingConfig({
                                                                ...editingConfig,
                                                                value: e.target.value,
                                                            })
                                                        }
                                                        className="font-mono text-sm"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSave}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            <Save className="h-3 w-3 mr-1" />
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={handleCancel}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">
                                                        {config.value}
                                                    </p>
                                                    {config.description && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {config.description}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {editingConfig?.key !== config.key && (
                                            <button
                                                onClick={() => handleEdit(config)}
                                                className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Configuration Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        System Settings
                    </h3>
                    <p className="text-xs text-blue-700">
                        Core system parameters and global configurations
                    </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">
                        Business Rules
                    </h3>
                    <p className="text-xs text-green-700">
                        Pricing, taxes, and business logic parameters
                    </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-purple-900 mb-2">
                        Integration Settings
                    </h3>
                    <p className="text-xs text-purple-700">
                        Third-party service configurations and API keys
                    </p>
                </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Settings className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Configuration Warning
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Changes to system configuration may affect all modules and users.
                            Please ensure you understand the impact before making modifications.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};