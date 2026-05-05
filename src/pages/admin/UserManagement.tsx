/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, User, Trash2, ChevronLeft, ChevronRight, KeyRound } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface UserFormData {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

interface PasswordResetTarget {
    id: string;
    username: string;
}

export const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordResetTarget, setPasswordResetTarget] = useState<PasswordResetTarget | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        email: '',
        password: '',
        role: UserRole.DISTRIBUTORSHIP_SALES_REP,
    });

    const canChangePassword = currentUser?.role === UserRole.MANAGING_DIRECTOR || currentUser?.role === UserRole.GENERAL_MANAGER;

    const queryClient = useQueryClient();
    const pageSize = 10;

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['admin-users', currentPage, searchTerm],
        queryFn: () =>
            adminService.getUsers({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
            }),
    });

    // Calculate pagination values
    const totalPages = usersData?.data?.pagination?.totalPages || 1;
    const total = usersData?.data?.pagination?.total || 0;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    const createMutation = useMutation({
        mutationFn: (data: UserFormData) => adminService.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            globalToast.success('User created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create user');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            globalToast.success('User deleted successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to delete user');
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
            adminService.resetUserPassword(id, newPassword),
        onSuccess: () => {
            globalToast.success('Password reset successfully!');
            handleClosePasswordModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to reset password');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            username: '',
            email: '',
            password: '',
            role: UserRole.DISTRIBUTORSHIP_SALES_REP,
        });
    };

    const handleOpenPasswordModal = (user: PasswordResetTarget) => {
        setPasswordResetTarget(user);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setIsPasswordModalOpen(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setPasswordResetTarget(null);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    const handlePasswordReset = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setPasswordError('Password must contain at least one uppercase letter');
            return;
        }
        if (!/[a-z]/.test(newPassword)) {
            setPasswordError('Password must contain at least one lowercase letter');
            return;
        }
        if (!/[0-9]/.test(newPassword)) {
            setPasswordError('Password must contain at least one number');
            return;
        }

        resetPasswordMutation.mutate({ id: passwordResetTarget!.id, newPassword });
    };

    const formatLastLogin = (lastLoginAt?: string) => {
        if (!lastLoginAt) return 'Never';

        const date = new Date(lastLoginAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    const userColumns = [
        {
            key: 'username',
            title: 'Username',
            render: (value: string) => (
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900">{value}</span>
                </div>
            ),
        },
        {
            key: 'email',
            title: 'Email',
            render: (value: string) => (
                <span className="text-gray-600">{value}</span>
            ),
        },
        {
            key: 'role',
            title: 'Role',
            render: (value: string) => (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {value.replace(/_/g, ' ')}
                </span>
            ),
        },
        {
            key: 'lastLoginAt',
            title: 'Last Login',
            render: (value: string) => (
                <div className="text-sm">
                    <div className="text-gray-900">{formatLastLogin(value)}</div>
                    {value && (
                        <div className="text-xs text-gray-500">
                            {new Date(value).toLocaleString()}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (value: boolean) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${value
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_: any, user: any) => (
                <div className="flex gap-2">
                    {canChangePassword && (
                        <button
                            onClick={() => handleOpenPasswordModal({ id: user.id, username: user.username })}
                            className="p-1 text-indigo-600 hover:text-indigo-800"
                            title="Change Password"
                        >
                            <KeyRound className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete User"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Manage system users and permissions</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Table
                    data={usersData?.data?.users || []}
                    columns={userColumns}
                />

                {/* Custom Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 sm:px-6">
                    <div className="flex items-center justify-between">
                        {/* Mobile Pagination */}
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={!hasPrev}
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={!hasNext}
                                variant="outline"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>

                        {/* Desktop Pagination */}
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                    <span className="font-medium">{totalPages}</span>
                                    {' '}({total || 0} total records)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={!hasPrev}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        {currentPage}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={!hasNext}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={handleClosePasswordModal}
                title={`Reset Password — ${passwordResetTarget?.username}`}
            >
                <form onSubmit={handlePasswordReset} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Set a new password for <span className="font-semibold">{passwordResetTarget?.username}</span>.
                        The user will be logged out of all active sessions.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password *
                        </label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 8 chars, uppercase, lowercase, number"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password *
                        </label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleClosePasswordModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={resetPasswordMutation.isPending}>
                            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Add New User"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username *
                        </label>
                        <Input
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password *
                        </label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role *
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({ ...formData, role: e.target.value as UserRole })
                            }
                            required
                        >
                            <option value={UserRole.MANAGING_DIRECTOR}>Managing Director</option>
                            <option value={UserRole.GENERAL_MANAGER}>General Manager</option>
                            <option value={UserRole.ACCOUNTANT}>Accountant</option>
                            <option value={UserRole.CASHIER}>Cashier</option>
                            <option value={UserRole.DISTRIBUTORSHIP_SALES_REP}>Distributorship Sales Rep</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};