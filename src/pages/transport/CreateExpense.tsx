/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/transport/CreateExpense.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { transportService } from '../../services/transportService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { globalToast } from '../../components/ui/Toast';

const expenseSchema = z.object({
    truckId: z.string().optional(),
    locationId: z.string().optional(),
    expenseType: z.enum(['TRIP', 'NON_TRIP'], {
        required_error: 'Expense type is required'
    }),
    category: z.string().min(1, 'Category is required'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    expenseDate: z.string().min(1, 'Expense date is required')
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const EXPENSE_CATEGORIES = {
    TRIP: ['Fuel', 'Driver Wages', 'Trip Allowance', 'Motor Boy Wages', 'Toll Fees', 'Parking'],
    NON_TRIP: ['Maintenance', 'Repairs', 'Insurance', 'Registration', 'Tire Replacement', 'Oil Change', 'Parts', 'Service']
};

export const CreateExpense: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            expenseType: 'NON_TRIP',
            expenseDate: new Date().toISOString().split('T')[0]
        }
    });

    const expenseType = watch('expenseType');

    // Fetch trucks for dropdown
    const { data: trucks } = useQuery({
        queryKey: ['transport-trucks'],
        queryFn: () => transportService.getTrucks(),
    });

    // Fetch locations for dropdown
    const { data: locations } = useQuery({
        queryKey: ['transport-locations'],
        queryFn: () => transportService.getLocations(),
    });

    const createMutation = useMutation({
        mutationFn: (data: ExpenseFormData) => transportService.createExpense(data),
        onSuccess: () => {
            globalToast.success('Expense created successfully!');
            queryClient.invalidateQueries({ queryKey: ['transport-expenses'] });
            navigate('/transport/expenses');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create expense');
        }
    });

    const onSubmit = (data: ExpenseFormData) => {
        createMutation.mutate(data);
    };

    const availableCategories = EXPENSE_CATEGORIES[expenseType] || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/transport/expenses')}
                        className="p-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                            Create Transport Expense
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Record a new transport expense for approval
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Expense Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expense Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                                <input
                                    type="radio"
                                    {...register('expenseType')}
                                    value="TRIP"
                                    className="sr-only"
                                />
                                <span className="flex flex-1">
                                    <span className="flex flex-col">
                                        <span className="block text-sm font-medium text-gray-900">Trip Expense</span>
                                        <span className="mt-1 flex items-center text-sm text-gray-500">
                                            Fuel, wages, tolls, etc.
                                        </span>
                                    </span>
                                </span>
                            </label>
                            <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                                <input
                                    type="radio"
                                    {...register('expenseType')}
                                    value="NON_TRIP"
                                    className="sr-only"
                                />
                                <span className="flex flex-1">
                                    <span className="flex flex-col">
                                        <span className="block text-sm font-medium text-gray-900">Non-Trip Expense</span>
                                        <span className="mt-1 flex items-center text-sm text-gray-500">
                                            Maintenance, repairs, insurance
                                        </span>
                                    </span>
                                </span>
                            </label>
                        </div>
                        {errors.expenseType && (
                            <p className="mt-1 text-sm text-red-600">{errors.expenseType.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('category')}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Select category</option>
                                {availableCategories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                            )}
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (₦) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('amount', { valueAsNumber: true })}
                                error={errors.amount?.message}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Expense Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expense Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                {...register('expenseDate')}
                                error={errors.expenseDate?.message}
                            />
                        </div>

                        {/* Truck (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Truck (Optional)
                            </label>
                            <select
                                {...register('truckId')}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">No specific truck</option>
                                {trucks?.map((truck) => (
                                    <option key={truck.truckId} value={truck.truckId}>
                                        {truck.registrationNumber || truck.truckId}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location (Optional)
                            </label>
                            <select
                                {...register('locationId')}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">No specific location</option>
                                {locations?.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('description')}
                            rows={4}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Provide details about this expense..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/transport/expenses')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Creating...' : 'Create Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};