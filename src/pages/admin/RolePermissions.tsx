// src/pages/admin/RolePermissions.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/authStore';
import { usePermissionsStore } from '../../store/permissionsStore';
import { UserRole } from '../../types';

// ─── Role definitions ─────────────────────────────────────────────────────────

const ROLES = [
    { key: 'MANAGING_DIRECTOR',       label: 'Managing Director' },
    { key: 'GENERAL_MANAGER',         label: 'General Manager' },
    { key: 'ACCOUNTANT',              label: 'Accountant' },
    { key: 'CASHIER',                 label: 'Cashier' },
    { key: 'DISTRIBUTORSHIP_SALES_REP', label: 'Sales Rep' },
];

// ─── Feature definitions grouped by module then category ─────────────────────

interface Feature { key: string; label: string }
interface Category { label: string; features: Feature[] }
interface ModuleDef { key: string; label: string; color: string; categories: Category[] }

const MODULES: ModuleDef[] = [
    {
        key: 'distribution',
        label: 'Distribution',
        color: 'indigo',
        categories: [
            {
                label: 'Overview',
                features: [
                    { key: 'view_dashboard',  label: 'View Dashboard' },
                    { key: 'view_analytics',  label: 'View Analytics' },
                ],
            },
            {
                label: 'Orders',
                features: [
                    { key: 'view_orders',    label: 'View Orders' },
                    { key: 'create_order',   label: 'Create Order' },
                    { key: 'edit_order',     label: 'Edit Order' },
                    { key: 'delete_order',   label: 'Delete Order' },
                ],
            },
            {
                label: 'Payments',
                features: [
                    { key: 'record_payment',  label: 'Record Payment' },
                    { key: 'confirm_payment', label: 'Confirm Payment' },
                    { key: 'adjust_price',    label: 'Adjust Price' },
                ],
            },
            {
                label: 'Logistics',
                features: [
                    { key: 'assign_transport',       label: 'Assign Transport' },
                    { key: 'record_delivery',        label: 'Record Delivery' },
                    { key: 'update_supplier_status', label: 'Update Supplier Status' },
                ],
            },
            {
                label: 'Customers & Suppliers',
                features: [
                    { key: 'view_customers',  label: 'View Customers' },
                    { key: 'view_suppliers',  label: 'View Suppliers' },
                    { key: 'manage_suppliers', label: 'Manage Suppliers' },
                ],
            },
            {
                label: 'Targets',
                features: [
                    { key: 'view_targets',   label: 'View Targets' },
                    { key: 'manage_targets', label: 'Manage Targets' },
                ],
            },
            {
                label: 'Truck Loads',
                features: [
                    { key: 'view_truck_loads',   label: 'View Truck Loads' },
                    { key: 'create_truck_load',  label: 'Create Truck Load' },
                    { key: 'manage_truck_loads', label: 'Manage Truck Loads (add/remove orders, update status)' },
                ],
            },
            {
                label: 'Dashboard Stat Cards',
                features: [
                    { key: 'stat_total_revenue',    label: 'Show Total Revenue Card' },
                    { key: 'stat_total_orders',     label: 'Show Total Orders Card' },
                    { key: 'stat_total_packs',      label: 'Show Total Packs Card' },
                    { key: 'stat_active_customers', label: 'Show Active Customers Card' },
                ],
            },
        ],
    },
    {
        key: 'transport',
        label: 'Transport',
        color: 'amber',
        categories: [
            {
                label: 'Overview',
                features: [
                    { key: 'view_dashboard', label: 'View Dashboard' },
                    { key: 'view_analytics', label: 'View Analytics' },
                ],
            },
            {
                label: 'Orders',
                features: [
                    { key: 'view_orders',  label: 'View Orders' },
                    { key: 'create_order', label: 'Create Order' },
                    { key: 'edit_order',   label: 'Edit Order' },
                ],
            },
            {
                label: 'Expenses',
                features: [
                    { key: 'view_expenses',   label: 'View Expenses' },
                    { key: 'create_expense',  label: 'Create Expense' },
                    { key: 'approve_expense', label: 'Approve / Reject Expense' },
                ],
            },
            {
                label: 'Fleet',
                features: [
                    { key: 'view_trucks',   label: 'View Trucks' },
                    { key: 'manage_trucks', label: 'Manage Trucks' },
                ],
            },
            {
                label: 'Locations',
                features: [
                    { key: 'view_locations',   label: 'View Locations' },
                    { key: 'manage_locations', label: 'Manage Locations' },
                ],
            },
            {
                label: 'Dashboard Stat Cards',
                features: [
                    { key: 'stat_active_trips',   label: 'Show Active Trips Card' },
                    { key: 'stat_total_revenue',  label: 'Show Total Revenue Card' },
                    { key: 'stat_fleet_size',     label: 'Show Fleet Size Card' },
                    { key: 'stat_profit_margin',  label: 'Show Profit Margin Card' },
                ],
            },
        ],
    },
    {
        key: 'warehouse',
        label: 'Warehouse',
        color: 'green',
        categories: [
            {
                label: 'Overview',
                features: [
                    { key: 'view_dashboard', label: 'View Dashboard' },
                    { key: 'view_cashflow',  label: 'View Cash Flow' },
                    { key: 'view_low_stock', label: 'View Low Stock Alerts' },
                    { key: 'view_expiring',  label: 'View Expiring Products' },
                ],
            },
            {
                label: 'Sales',
                features: [
                    { key: 'view_sales',    label: 'View Sales' },
                    { key: 'record_sales',  label: 'Record Sales' },
                    { key: 'edit_sales',    label: 'Edit Sales' },
                    { key: 'delete_sales',  label: 'Delete Sales' },
                ],
            },
            {
                label: 'Purchases',
                features: [
                    { key: 'record_purchases', label: 'Record Purchases' },
                    { key: 'edit_purchases',   label: 'Edit Purchases' },
                    { key: 'delete_purchases', label: 'Delete Purchases' },
                ],
            },
            {
                label: 'Inventory',
                features: [
                    { key: 'manage_inventory', label: 'Manage Inventory' },
                ],
            },
            {
                label: 'Debtors',
                features: [
                    { key: 'view_debtors', label: 'View Debtors' },
                    { key: 'edit_debtors', label: 'Edit Debtors' },
                ],
            },
            {
                label: 'Discounts',
                features: [
                    { key: 'request_discount', label: 'Request Discount' },
                    { key: 'approve_discount',  label: 'Approve / Reject Discount' },
                ],
            },
            {
                label: 'Expenses',
                features: [
                    { key: 'view_expenses',    label: 'View Expenses' },
                    { key: 'manage_expenses',  label: 'Submit Expenses' },
                    { key: 'approve_expenses', label: 'Approve / Reject Expenses' },
                ],
            },
            {
                label: 'Opening Stock',
                features: [
                    { key: 'view_opening_stock',    label: 'View Opening Stock' },
                    { key: 'submit_opening_stock',  label: 'Submit Opening Stock' },
                    { key: 'approve_opening_stock', label: 'Approve Opening Stock' },
                ],
            },
            {
                label: 'Dashboard Stat Cards',
                features: [
                    { key: 'stat_packs_sold',       label: 'Show Packs Sold Card' },
                    { key: 'stat_revenue',          label: 'Show Total Revenue Card' },
                    { key: 'stat_net_profit',       label: 'Show Net Profit Card' },
                    { key: 'stat_gross_margin',     label: 'Show Gross Margin Card' },
                    { key: 'stat_expenses',         label: 'Show Total Expenses Card' },
                    { key: 'stat_debt',             label: 'Show Outstanding Debt Card' },
                    { key: 'stat_inventory_items',  label: 'Show Inventory Items Card' },
                    { key: 'stat_active_customers', label: 'Show Active Customers Card' },
                ],
            },
        ],
    },
    {
        key: 'admin',
        label: 'Admin',
        color: 'purple',
        categories: [
            {
                label: 'Dashboard',
                features: [
                    { key: 'view_dashboard', label: 'View Dashboard' },
                    { key: 'view_audit',     label: 'View Audit Trail' },
                ],
            },
            {
                label: 'Users',
                features: [
                    { key: 'manage_users',    label: 'Manage Users' },
                    { key: 'reset_passwords', label: 'Reset Passwords' },
                ],
            },
            {
                label: 'Data Management',
                features: [
                    { key: 'manage_products',  label: 'Manage Products' },
                    { key: 'manage_customers', label: 'Manage Customers' },
                    { key: 'manage_locations', label: 'Manage Locations' },
                ],
            },
            {
                label: 'System',
                features: [
                    { key: 'manage_config',            label: 'System Configuration' },
                    { key: 'manage_role_permissions',   label: 'Manage Role Permissions' },
                ],
            },
        ],
    },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, { header: string; badge: string; check: string; border: string }> = {
    distribution: {
        header: 'bg-indigo-600',
        badge:  'bg-indigo-50 text-indigo-700 border-indigo-200',
        check:  'text-indigo-600 bg-indigo-50 border-indigo-400',
        border: 'border-indigo-200',
    },
    transport: {
        header: 'bg-amber-500',
        badge:  'bg-amber-50 text-amber-700 border-amber-200',
        check:  'text-amber-600 bg-amber-50 border-amber-400',
        border: 'border-amber-200',
    },
    warehouse: {
        header: 'bg-green-600',
        badge:  'bg-green-50 text-green-700 border-green-200',
        check:  'text-green-600 bg-green-50 border-green-400',
        border: 'border-green-200',
    },
    admin: {
        header: 'bg-purple-600',
        badge:  'bg-purple-50 text-purple-700 border-purple-200',
        check:  'text-purple-600 bg-purple-50 border-purple-400',
        border: 'border-purple-200',
    },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionsMap = Record<string, Record<string, Record<string, boolean>>>;

// ─── Component ────────────────────────────────────────────────────────────────

export const RolePermissions: React.FC = () => {
    const { user } = useAuthStore();
    const { loadPermissions } = usePermissionsStore();
    const queryClient = useQueryClient();
    const isMD = user?.role === UserRole.MANAGING_DIRECTOR;

    const [draft, setDraft] = useState<PermissionsMap>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

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
        mutationFn: (p: PermissionsMap) => adminService.updateRolePermissions(p),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
            loadPermissions(); // refresh the store used by UI checks
            globalToast.success('Permissions saved successfully!');
            setHasChanges(false);
            if (res.data?.permissions) {
                setDraft(JSON.parse(JSON.stringify(res.data.permissions)));
            }
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to save permissions');
        },
    });

    const isGranted = (role: string, mod: string, feature: string) =>
        draft[role]?.[mod]?.[feature] === true;

    const toggle = (role: string, mod: string, feature: string) => {
        if (!isMD) return;
        setDraft(prev => {
            const next = JSON.parse(JSON.stringify(prev)) as PermissionsMap;
            if (!next[role]) next[role] = {};
            if (!next[role][mod]) next[role][mod] = {};
            next[role][mod][feature] = !next[role][mod][feature];
            return next;
        });
        setHasChanges(true);
    };

    // Toggle every feature in a category for a given role
    const toggleCategory = (role: string, mod: string, features: Feature[]) => {
        if (!isMD) return;
        const allOn = features.every(f => isGranted(role, mod, f.key));
        setDraft(prev => {
            const next = JSON.parse(JSON.stringify(prev)) as PermissionsMap;
            if (!next[role]) next[role] = {};
            if (!next[role][mod]) next[role][mod] = {};
            features.forEach(f => { next[role][mod][f.key] = !allOn; });
            return next;
        });
        setHasChanges(true);
    };

    // Toggle every feature in a module for a given role
    const toggleModule = (role: string, mod: ModuleDef) => {
        if (!isMD) return;
        const allFeatures = mod.categories.flatMap(c => c.features);
        const allOn = allFeatures.every(f => isGranted(role, mod.key, f.key));
        setDraft(prev => {
            const next = JSON.parse(JSON.stringify(prev)) as PermissionsMap;
            if (!next[role]) next[role] = {};
            if (!next[role][mod.key]) next[role][mod.key] = {};
            allFeatures.forEach(f => { next[role][mod.key][f.key] = !allOn; });
            return next;
        });
        setHasChanges(true);
    };

    const handleReset = () => {
        if (data?.data?.permissions) {
            setDraft(JSON.parse(JSON.stringify(data.data.permissions)));
            setHasChanges(false);
        }
    };

    const toggleModuleCollapse = (modKey: string) => {
        setCollapsedModules(prev => ({ ...prev, [modKey]: !prev[modKey] }));
    };

    // Count granted features per role per module
    const grantedCount = (role: string, mod: ModuleDef) =>
        mod.categories.flatMap(c => c.features).filter(f => isGranted(role, mod.key, f.key)).length;
    const totalCount = (mod: ModuleDef) =>
        mod.categories.flatMap(c => c.features).length;

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
                    </div>
                    <p className="text-gray-500 mt-1 text-sm">
                        {isMD
                            ? 'Click any checkbox to grant or revoke a feature for a role.'
                            : 'View-only. Only the Managing Director can edit permissions.'}
                    </p>
                </div>
                {isMD && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
                        </Button>
                        <Button onClick={() => saveMutation.mutate(draft)} disabled={!hasChanges || saveMutation.isPending}>
                            <Save className="h-4 w-4 mr-1.5" />
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* One card per module */}
            {MODULES.map(mod => {
                const colors = MODULE_COLORS[mod.key];
                const collapsed = collapsedModules[mod.key];

                return (
                    <div key={mod.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Module header */}
                        <div
                            className={`${colors.header} px-5 py-3 flex items-center justify-between cursor-pointer select-none`}
                            onClick={() => toggleModuleCollapse(mod.key)}
                        >
                            <span className="text-white font-semibold text-base">{mod.label}</span>
                            <div className="flex items-center gap-4">
                                {/* Per-role granted counts */}
                                <div className="hidden md:flex gap-3">
                                    {ROLES.map(role => (
                                        <span key={role.key} className="text-white/80 text-xs">
                                            {role.label.split(' ')[0]}: {grantedCount(role.key, mod)}/{totalCount(mod)}
                                        </span>
                                    ))}
                                </div>
                                {collapsed
                                    ? <ChevronRight className="h-5 w-5 text-white" />
                                    : <ChevronDown className="h-5 w-5 text-white" />}
                            </div>
                        </div>

                        {!collapsed && (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    {/* Role column headers */}
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-56">
                                                Feature
                                            </th>
                                            {ROLES.map(role => {
                                                const allOn = mod.categories.flatMap(c => c.features).every(f => isGranted(role.key, mod.key, f.key));
                                                return (
                                                    <th key={role.key} className="px-3 py-3 text-center min-w-[120px]">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-xs font-semibold text-gray-700">{role.label}</span>
                                                            {isMD && (
                                                                <button
                                                                    onClick={() => toggleModule(role.key, mod)}
                                                                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                                                        allOn
                                                                            ? `${colors.badge} border-current`
                                                                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                                                    }`}
                                                                >
                                                                    {allOn ? 'All on' : 'All off'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {mod.categories.map((cat, catIdx) => (
                                            <React.Fragment key={cat.label}>
                                                {/* Category sub-header */}
                                                <tr className="bg-gray-50/60 border-t border-gray-100">
                                                    <td className="px-4 py-1.5">
                                                        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${colors.badge}`}>
                                                            {cat.label}
                                                        </span>
                                                    </td>
                                                    {ROLES.map(role => {
                                                        const allOn = cat.features.every(f => isGranted(role.key, mod.key, f.key));
                                                        const someOn = cat.features.some(f => isGranted(role.key, mod.key, f.key));
                                                        return (
                                                            <td key={role.key} className="px-3 py-1.5 text-center">
                                                                {isMD && (
                                                                    <button
                                                                        onClick={() => toggleCategory(role.key, mod.key, cat.features)}
                                                                        title={`${allOn ? 'Disable' : 'Enable'} all in ${cat.label} for ${role.label}`}
                                                                        className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                                                                            allOn
                                                                                ? `${colors.badge} border-current`
                                                                                : someOn
                                                                                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                                                    : 'bg-white text-gray-300 border-gray-200 hover:text-gray-500'
                                                                        }`}
                                                                    >
                                                                        {allOn ? '✓ all' : someOn ? '~ some' : '— none'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>

                                                {/* Feature rows */}
                                                {cat.features.map((feat, featIdx) => (
                                                    <tr
                                                        key={feat.key}
                                                        className={`border-t border-gray-50 transition-colors hover:bg-gray-50/40 ${
                                                            catIdx === mod.categories.length - 1 && featIdx === cat.features.length - 1
                                                                ? ''
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="px-4 py-2.5 text-sm text-gray-700 pl-8">
                                                            {feat.label}
                                                        </td>
                                                        {ROLES.map(role => {
                                                            const granted = isGranted(role.key, mod.key, feat.key);
                                                            return (
                                                                <td key={role.key} className="px-3 py-2.5 text-center">
                                                                    <button
                                                                        onClick={() => toggle(role.key, mod.key, feat.key)}
                                                                        disabled={!isMD}
                                                                        title={
                                                                            isMD
                                                                                ? `${granted ? 'Revoke' : 'Grant'} "${feat.label}" for ${role.label}`
                                                                                : `${role.label}: ${feat.label} — ${granted ? 'Granted' : 'Not granted'}`
                                                                        }
                                                                        className={`
                                                                            w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-all duration-150
                                                                            ${granted
                                                                                ? `${colors.check} border-current`
                                                                                : 'bg-white border-gray-200 text-transparent'
                                                                            }
                                                                            ${isMD ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                                                                        `}
                                                                    >
                                                                        {granted && (
                                                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Floating save bar when there are unsaved changes */}
            {hasChanges && isMD && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-full shadow-xl z-50">
                    <span className="text-sm">You have unsaved changes</span>
                    <Button size="sm" variant="outline" onClick={handleReset} className="border-white/30 text-white hover:bg-white/10">
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                    </Button>
                    <Button size="sm" onClick={() => saveMutation.mutate(draft)} disabled={saveMutation.isPending} className="bg-white text-gray-900 hover:bg-gray-100">
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saveMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            )}
        </div>
    );
};
