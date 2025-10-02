/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Plus, Calendar, AlertCircle } from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export const TargetsPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        totalPacksTarget: 0,
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
    });

    const queryClient = useQueryClient();

    const { data: currentTargetData, isLoading } = useQuery({
        queryKey: ['current-target'],
        queryFn: () => distributionService.getCurrentTarget(),
        retry: 1,
    });

    const { data: targetsHistory } = useQuery({
        queryKey: ['targets-history'],
        queryFn: () => distributionService.getTargets(1, 12),
    });

    const createTargetMutation = useMutation({
        mutationFn: (data: any) => distributionService.createTarget(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['current-target'] });
            queryClient.invalidateQueries({ queryKey: ['targets-history'] });
            toast.success('Target created successfully!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create target');
        }
    });

    const resetForm = () => {
        setFormData({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            totalPacksTarget: 0,
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
        });
    };

    const handleInputChange = (field: string, value: number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const weeklyTotal = formData.week1 + formData.week2 + formData.week3 + formData.week4;

        if (weeklyTotal !== formData.totalPacksTarget) {
            toast.error('Weekly targets must sum up to total monthly target!');
            return;
        }

        createTargetMutation.mutate({
            year: formData.year,
            month: formData.month,
            totalPacksTarget: formData.totalPacksTarget,
            weeklyTargets: [formData.week1, formData.week2, formData.week3, formData.week4]
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const currentTarget = currentTargetData?.target;
    const summary = currentTargetData?.summary;
    const weeklyPerformances = currentTarget?.weeklyPerformances || [];
    const historicalTargets = targetsHistory?.data?.targets || [];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Distribution Targets
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Set and track monthly sales targets and weekly performance
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={() => setIsModalOpen(true)} className="inline-flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Set New Target
                    </Button>
                </div>
            </div>

            {/* Current Month Target */}
            {currentTarget && summary ? (
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Target className="h-6 w-6 text-indigo-600" />
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Current Month Performance
                                </h3>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${summary.percentageAchieved >= 100 ? 'bg-green-100 text-green-800' :
                                    summary.percentageAchieved >= 75 ? 'bg-blue-100 text-blue-800' :
                                        summary.percentageAchieved >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                }`}>
                                {summary.percentageAchieved.toFixed(1)}% Achieved
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">
                                    {summary.totalTarget.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Target Packs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-indigo-600">
                                    {summary.totalActual.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Actual Packs</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${summary.remainingTarget <= 0 ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                                    {Math.abs(summary.remainingTarget).toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {summary.remainingTarget <= 0 ? 'Exceeded by' : 'Remaining'}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className={`h-4 rounded-full transition-all ${summary.percentageAchieved >= 100 ? 'bg-green-600' :
                                            summary.percentageAchieved >= 75 ? 'bg-blue-600' :
                                                summary.percentageAchieved >= 50 ? 'bg-yellow-600' :
                                                    'bg-red-600'
                                        }`}
                                    style={{ width: `${Math.min(summary.percentageAchieved, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Weekly Performance */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {weeklyPerformances.map((week: any) => (
                                <div key={week.weekNumber} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">
                                            Week {week.weekNumber}
                                        </span>
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {week.actualPacks.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                of {week.targetPacks.toLocaleString()} target
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${week.percentageAchieved >= 100 ? 'bg-green-600' :
                                                        week.percentageAchieved >= 75 ? 'bg-blue-600' :
                                                            'bg-yellow-600'
                                                    }`}
                                                style={{ width: `${Math.min(week.percentageAchieved, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className={`text-sm font-semibold ${week.percentageAchieved >= 100 ? 'text-green-600' :
                                                week.percentageAchieved >= 75 ? 'text-blue-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {week.percentageAchieved.toFixed(1)}% Complete
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Target Set</h3>
                    <p className="text-gray-500 mb-4">
                        Set a monthly target to start tracking your distribution performance
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Set Monthly Target
                    </Button>
                </div>
            )}

            {/* Historical Targets */}
            {historicalTargets.length > 0 && (
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Target History
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Target
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Achieved
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Performance
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {historicalTargets.map((target: any) => {
                                    const totalAchieved = target.weeklyPerformances?.reduce(
                                        (sum: number, w: any) => sum + w.actualPacks, 0
                                    ) || 0;
                                    const percentage = target.totalPacksTarget > 0
                                        ? (totalAchieved / target.totalPacksTarget) * 100
                                        : 0;

                                    return (
                                        <tr key={target.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {months[target.month - 1]} {target.year}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {target.totalPacksTarget.toLocaleString()} packs
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {totalAchieved.toLocaleString()} packs
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${percentage >= 100 ? 'bg-green-100 text-green-800' :
                                                        percentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                                            percentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Target Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Set Monthly Target"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year
                            </label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                                min={2020}
                                max={2050}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Month
                            </label>
                            <select
                                value={formData.month}
                                onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {months.map((month, idx) => (
                                    <option key={idx} value={idx + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Monthly Target (Packs)
                        </label>
                        <Input
                            type="number"
                            value={formData.totalPacksTarget}
                            onChange={(e) => handleInputChange('totalPacksTarget', parseInt(e.target.value) || 0)}
                            min={0}
                            required
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((week) => (
                                <div key={week}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Week {week}
                                    </label>
                                    <Input
                                        type="number"
                                        value={formData[`week${week}` as keyof typeof formData]}
                                        onChange={(e) =>
                                            handleInputChange(`week${week}`, parseInt(e.target.value) || 0)
                                        }
                                        min={0}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                            Weekly Total: {(formData.week1 + formData.week2 + formData.week3 + formData.week4).toLocaleString()} packs
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createTargetMutation.isPending}
                        >
                            {createTargetMutation.isPending ? 'Creating...' : 'Create Target'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};