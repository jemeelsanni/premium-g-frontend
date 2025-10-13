/* eslint-disable @typescript-eslint/no-explicit-any */
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
    expenseType: z.enum(['TRIP', 'NON_TRIP']),
    category: z.string().min(1, 'Category is required'),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    expenseDate: z.string().min(1, 'Expense date is required'),
    receiptNumber: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export const CreateExpense: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            expenseType: 'NON_TRIP',
            expenseDate: new Date().toISOString().split('T')[0]
        }
    });

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
        // Transform empty strings to undefined for optional fields
        const sanitizedData = {
            ...data,
            truckId: data.truckId?.trim() || undefined,
            locationId: data.locationId?.trim() || undefined,
            receiptNumber: data.receiptNumber?.trim() || undefined
        };

        createMutation.mutate(sanitizedData);
    };

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
                    {/* Expense Type - Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expense Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('expenseType')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select expense type...</option>
                            <option value="TRIP">Trip Expense</option>
                            <option value="NON_TRIP">Non-Trip Expense</option>
                        </select>
                        {errors.expenseType && (
                            <p className="mt-1 text-sm text-red-600">{errors.expenseType.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category - Text Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category <span className="text-red-500">*</span>
                            </label>
                            <Input
                                {...register('category')}
                                placeholder="e.g., Fuel, Maintenance, Driver Wages"
                                error={errors.category?.message}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Trip: Fuel, Driver Wages, Tolls, Trip Allowance<br />
                                Non-Trip: Maintenance, Repairs, Insurance, Parts
                            </p>
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
                                placeholder="0.00"
                                error={errors.amount?.message}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Truck (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Truck (Optional)
                            </label>
                            <select
                                {...register('truckId')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select truck...</option>
                                {trucks?.map((truck: any) => (
                                    <option key={truck.id} value={truck.truckId}>  {/* ✅ Changed from truck.id to truck.truckId */}
                                        {truck.registrationNumber} - {truck.make} {truck.model}
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select location...</option>
                                {locations?.map((location: any) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* Receipt Number (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Receipt Number (Optional)
                            </label>
                            <Input
                                {...register('receiptNumber')}
                                placeholder="REC-001"
                            />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Provide details about this expense..."
                        />
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/transport/expenses')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Creating...' : 'Create Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};