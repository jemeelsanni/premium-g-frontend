// src/pages/admin/RolePermissions.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, RotateCcw, Info } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const ROLES = [
    { key: 'MANAGING_DIRECTOR', label: 'Managing Director' },
    { key: 'GENERAL_MANAGER', label: 'General Manager' },
    { key: 'ACCOUNTANT', label: 'Accountant' },
    { key: 'CASHIER', label: 'Cashier' },
    { key: 'DISTRIBUTORSHIP_SALES_REP', label: 'Sales Rep' },
];

const MODULES = [
    { key: 'distribution', label: 'Distribution' },
    { key: 'transport', label: 'Transport' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'admin', label: 'Admin' },
];

const PERMISSION_LEVELS = [
    { key: 'read', label: 'Read', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { key: 'write', label: 'Write', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { key: 'admin', label: 'Admin', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
];

type PermissionsMap = Record<string, Record<string, string[]>>;

const emptyPermissions = (): PermissionsMap => {
    const map: PermissionsMap = {};
    for (const role of ROLES) {
        map[role.key] = {};
        for (const mod of MODULES) {
            map[role.key][mod.key] = [];
        }
    }
    return map;
};

export const RolePermissions: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isMD = user?.role === UserRole.MANAGING_DIRECTOR;

    const [draft, setDraft] = useState<PermissionsMap>(emptyPermissions());
    const [hasChanges, setHasChanges] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['role-permissions'],
        queryFn: () => adminService.getRolePermissions(),
    });

    useEffect(() => {
        if (data?.data?.permissions) {
            setDraft(JSON.parse(JSON.stringify(data.data.permissions)));
            setHasChanges(false);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: (permissions: PermissionsMap) => adminService.updateRolePermissions(permissions),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
            globalToast.success('Role permissions saved successfully!');
            setHasChanges(false);
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to save permissions');
        },
    });

    const hasPermission = (role: string, module: string, perm: string) => {
        return (draft[role]?.[module] || []).includes(perm);
    };

    const toggle = (role: string, module: string, perm: string) => {
        if (!isMD) return; // GM can view but not edit

        setDraft(prev => {
            const updated = JSON.parse(JSON.stringify(prev)) as PermissionsMap;
            const current = updated[role][module] || [];

            if (current.includes(perm)) {
                // Remove the permission — also remove higher-level permissions that depend on it
                // (removing 'read' also removes 'write' and 'admin'; removing 'write' also removes 'admin')
                const permOrder = ['read', 'write', 'admin'];
                const permIdx = permOrder.indexOf(perm);
                updated[role][module] = current.filter(p => permOrder.indexOf(p) < permIdx);
            } else {
                // Add the permission — also add all lower-level permissions required
                // (adding 'write' requires 'read'; adding 'admin' requires 'read' and 'write')
                const permOrder = ['read', 'write', 'admin'];
                const permIdx = permOrder.indexOf(perm);
                const required = permOrder.slice(0, permIdx + 1);
                const merged = Array.from(new Set([...current, ...required]));
                updated[role][module] = merged;
            }

            return updated;
        });
        setHasChanges(true);
    };

    const handleReset = () => {
        if (data?.data?.permissions) {
            setDraft(JSON.parse(JSON.stringify(data.data.permissions)));
            setHasChanges(false);
        }
    };

    const handleSave = () => {
        saveMutation.mutate(draft);
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
                    </div>
                    <p className="text-gray-600 mt-1">
                        {isMD
                            ? 'Assign or remove module-level permissions for each role.'
                            : 'View current role permissions. Only the Managing Director can make changes.'}
                    </p>
                </div>

                {isMD && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={!hasChanges}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saveMutation.isPending}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <Info className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex items-center gap-4 text-sm">
                    {PERMISSION_LEVELS.map(p => (
                        <span key={p.key} className="flex items-center gap-1.5">
                            <span className={`inline-block w-3 h-3 rounded-sm border ${p.bg}`} />
                            <span className={`font-medium ${p.color}`}>{p.label}</span>
                        </span>
                    ))}
                    <span className="text-gray-500 ml-2">
                        Enabling Write auto-enables Read. Enabling Admin auto-enables Read + Write.
                    </span>
                </div>
            </div>

            {/* Permissions Matrix */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-40">
                                    Module
                                </th>
                                {ROLES.map(role => (
                                    <th
                                        key={role.key}
                                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700"
                                        colSpan={3}
                                    >
                                        {role.label}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="px-4 py-2" />
                                {ROLES.map(role =>
                                    PERMISSION_LEVELS.map(perm => (
                                        <th
                                            key={`${role.key}-${perm.key}`}
                                            className={`px-2 py-2 text-center text-xs font-medium w-16 ${perm.color}`}
                                        >
                                            {perm.label}
                                        </th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {MODULES.map((mod, modIdx) => (
                                <tr
                                    key={mod.key}
                                    className={modIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                >
                                    <td className="px-4 py-4 font-medium text-gray-800 text-sm capitalize">
                                        {mod.label}
                                    </td>
                                    {ROLES.map(role =>
                                        PERMISSION_LEVELS.map(perm => {
                                            const active = hasPermission(role.key, mod.key, perm.key);
                                            return (
                                                <td
                                                    key={`${role.key}-${mod.key}-${perm.key}`}
                                                    className="px-2 py-4 text-center"
                                                >
                                                    <button
                                                        onClick={() => toggle(role.key, mod.key, perm.key)}
                                                        disabled={!isMD}
                                                        title={
                                                            isMD
                                                                ? `${active ? 'Remove' : 'Grant'} ${perm.label} on ${mod.label} for ${role.label}`
                                                                : `${role.label} — ${mod.label} ${perm.label}: ${active ? 'Granted' : 'Not granted'}`
                                                        }
                                                        className={`
                                                            w-7 h-7 rounded border-2 flex items-center justify-center mx-auto transition-all
                                                            ${active
                                                                ? `${perm.bg} border-current ${perm.color}`
                                                                : 'bg-white border-gray-200 text-gray-300'
                                                            }
                                                            ${isMD ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                                                        `}
                                                    >
                                                        {active && (
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {ROLES.map(role => {
                    const rolePerms = draft[role.key] || {};
                    const grantedModules = MODULES.filter(m => (rolePerms[m.key] || []).length > 0);

                    return (
                        <div key={role.key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <h3 className="font-semibold text-gray-900 text-sm mb-3">{role.label}</h3>
                            {grantedModules.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No module access</p>
                            ) : (
                                <ul className="space-y-1">
                                    {grantedModules.map(mod => {
                                        const perms = rolePerms[mod.key] || [];
                                        return (
                                            <li key={mod.key} className="flex items-center justify-between text-xs">
                                                <span className="text-gray-600 capitalize">{mod.label}</span>
                                                <span className="flex gap-0.5">
                                                    {PERMISSION_LEVELS.map(p => (
                                                        <span
                                                            key={p.key}
                                                            className={`px-1 py-0.5 rounded text-xs font-medium ${
                                                                perms.includes(p.key)
                                                                    ? `${p.bg} ${p.color}`
                                                                    : 'opacity-0'
                                                            }`}
                                                        >
                                                            {p.label[0]}
                                                        </span>
                                                    ))}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasChanges && isMD && (
                <div className="fixed bottom-6 right-6 flex gap-2 shadow-lg">
                    <Button variant="outline" onClick={handleReset} className="bg-white">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    );
};
