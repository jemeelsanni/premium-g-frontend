/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Package,
    MapPin,
    UserCheck,
    Activity,
    Settings,
    FileText,
    BarChart3,
    TrendingUp,
    Clock,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const AdminDashboard: React.FC = () => {
    // Fetch user statistics
    const { data: statsData } = useQuery({
        queryKey: ['user-stats'],
        queryFn: () => adminService.getUserStats(),
    });

    // Fetch users for quick overview
    const { data: usersData } = useQuery({
        queryKey: ['admin-users-overview'],
        queryFn: () => adminService.getUsers({ limit: 5 }),
    });

    const stats = statsData?.data;
    const recentUsers = usersData?.data || [];

    const quickLinks = [
        {
            title: 'User Management',
            description: 'Manage system users and roles',
            icon: Users,
            path: '/admin/users',
            color: 'blue',
        },
        {
            title: 'User Statistics',
            description: 'View user analytics and metrics',
            icon: BarChart3,
            path: '/admin/users/statistics',
            color: 'green',
        },
        {
            title: 'User Activity',
            description: 'Monitor user actions and logs',
            icon: Activity,
            path: '/admin/users/activity',
            color: 'purple',
        },
        {
            title: 'Product Management',
            description: 'Manage products and inventory',
            icon: Package,
            path: '/admin/products',
            color: 'orange',
        },
        {
            title: 'Customer Management',
            description: 'Manage customer information',
            icon: UserCheck,
            path: '/admin/customers',
            color: 'pink',
        },
        {
            title: 'Location Management',
            description: 'Manage delivery locations',
            icon: MapPin,
            path: '/admin/locations',
            color: 'indigo',
        },
        {
            title: 'Audit Trail',
            description: 'View system activity logs',
            icon: FileText,
            path: '/admin/audit',
            color: 'gray',
        },
        {
            title: 'System Configuration',
            description: 'Configure system settings',
            icon: Settings,
            path: '/admin/config',
            color: 'red',
        },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
            green: 'bg-green-100 text-green-600 hover:bg-green-200',
            purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
            orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
            pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
            indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
            gray: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            red: 'bg-red-100 text-red-600 hover:bg-red-200',
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">
                    Welcome to the system administration panel
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalUsers || 0}
                            </p>
                        </div>
                        <Users className="h-10 w-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats?.activeUsers || 0}
                            </p>
                        </div>
                        <UserCheck className="h-10 w-10 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">User Roles</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {stats?.usersByRole?.length || 0}
                            </p>
                        </div>
                        <BarChart3 className="h-10 w-10 text-purple-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Recent Logins</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {stats?.recentLogins?.length || 0}
                            </p>
                        </div>
                        <Clock className="h-10 w-10 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={`p-3 rounded-lg ${getColorClasses(link.color)} transition-colors`}
                                >
                                    <link.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {link.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {link.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
                        <Link
                            to="/admin/users"
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            View All
                        </Link>
                    </div>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentUsers.length > 0 ? (
                        recentUsers.map((user: any) => (
                            <div
                                key={user.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {user.username}
                                            </p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                            {user.role?.replace(/_/g, ' ')}
                                        </span>
                                        {user.lastLoginAt && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Last login:{' '}
                                                {new Date(user.lastLoginAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-green-800 font-medium">System Status</p>
                            <p className="text-xs text-green-600">All systems operational</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-blue-800 font-medium">Activity Level</p>
                            <p className="text-xs text-blue-600">
                                {stats?.recentLogins?.length || 0} users active today
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Settings className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-purple-800 font-medium">
                                Configuration
                            </p>
                            <p className="text-xs text-purple-600">All settings up to date</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};