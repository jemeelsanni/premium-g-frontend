/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/CustomerForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// ✅ Updated schema - only fields that exist in database
const customerSchema = z.object({
    name: z.string().trim().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required').optional().or(z.literal('')),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    customerType: z.enum(['BUSINESS', 'ENTERPRISE', 'GOVERNMENT']).optional(),
    territory: z.string().trim().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    initialData?: Partial<CustomerFormData>;
    onSubmit: (data: CustomerFormData) => void;
    onCancel: () => void;
    isLoading?: boolean;
    isEditing?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    isEditing = false
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            customerType: 'BUSINESS',
            territory: '',
            ...initialData,
        }
    });

    const handleFormSubmit = (data: CustomerFormData) => {
        // Clean up empty strings to undefined for optional fields
        const cleanedData = {
            name: data.name.trim(),
            email: data.email?.trim() || undefined,
            phone: data.phone?.trim() || undefined,
            address: data.address?.trim() || undefined,
            customerType: data.customerType || undefined,
            territory: data.territory?.trim() || undefined,
        };
        onSubmit(cleanedData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Customer Name - REQUIRED */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Customer Name *
                        </label>
                        <Input
                            {...register('name')}
                            placeholder="Enter customer name"
                            className="mt-1"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            {...register('email')}
                            type="email"
                            placeholder="Enter email address"
                            className="mt-1"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <Input
                            {...register('phone')}
                            placeholder="Enter phone number"
                            className="mt-1"
                        />
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                        )}
                    </div>

                    {/* Customer Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Customer Type
                        </label>
                        <select
                            {...register('customerType')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">Select type</option>
                            <option value="BUSINESS">Business</option>
                            <option value="ENTERPRISE">Enterprise</option>
                            <option value="GOVERNMENT">Government</option>
                        </select>
                        {errors.customerType && (
                            <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
                        )}
                    </div>

                    {/* Territory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Territory
                        </label>
                        <Input
                            {...register('territory')}
                            placeholder="e.g., Lagos, Oyo, Abuja"
                            className="mt-1"
                        />
                        {errors.territory && (
                            <p className="mt-1 text-sm text-red-600">{errors.territory.message}</p>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Address
                    </label>
                    <textarea
                        {...register('address')}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter customer address"
                    />
                    {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        isEditing ? 'Update Customer' : 'Create Customer'
                    )}
                </Button>
            </div>
        </form>
    );
};