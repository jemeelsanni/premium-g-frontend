/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/UserManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, User } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { UserRole } from '../../types';

interface UserFormData {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

export const UserManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        email: '',
        password: '',
        role: UserRole.DISTRIBUTION_SALES_REP,
    });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            username: '',
            email: '',
            password: '',
            role: UserRole.DISTRIBUTION_SALES_REP,
        });
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
            key: 'createdAt',
            title: 'Created',
            render: (value: string) => new Date(value).toLocaleDateString(),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage system users and their roles
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <Table
                    columns={userColumns}
                    data={usersData?.data?.users || []}
                    emptyMessage="No users found"
                />
            )}

            {/* Pagination */}
            {usersData?.data?.pagination && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage >= usersData.data.pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                                <span className="font-medium">{usersData.data.pagination.totalPages}</span>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={currentPage >= usersData.data.pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create New User"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Username *"
                        value={formData.username}
                        onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                        }
                        required
                    />

                    <Input
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        required
                    />

                    <Input
                        label="Password *"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role *
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) =>
                                setFormData({ ...formData, role: e.target.value as UserRole })
                            }
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            {Object.values(UserRole).map((role) => (
                                <option key={role} value={role}>
                                    {role.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createMutation.isPending}>
                            Create User
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};