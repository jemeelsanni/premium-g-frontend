import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { warehouseApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ProductSelector } from '../../components/warehouse/ProductSelector';
import { DiscountCalculator } from '../../components/warehouse/DiscountCalculator';

const saleSchema = z.object({
    customerId: z.string().optional(),
    customerName: z.string().min(1, 'Customer name is required'),
    customerPhone: z.string().optional(),
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitType: z.enum(['PALLETS', 'PACKS', 'UNITS']),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'MOBILE_MONEY']),
    discountPercentage: z.number().min(0).max(100).default(0),
    discountReason: z.string().optional()
});

type SaleFormData = z.infer<typeof saleSchema>;

export const CreateSale = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [calculatedPrice, setCalculatedPrice] = useState<any>(null);

    const form = useForm<SaleFormData>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            unitType: 'UNITS',
            paymentMethod: 'CASH',
            discountPercentage: 0
        }
    });

    const onSubmit = async (data: SaleFormData) => {
        try {
            setLoading(true);

            const saleData = {
                ...data,
                unitPrice: calculatedPrice?.finalPrice || selectedProduct?.pricePerPack,
                totalAmount: calculatedPrice?.totalAmount || (data.quantity * selectedProduct?.pricePerPack),
                discountAmount: calculatedPrice?.discountAmount || 0
            };

            await warehouseApi.createSale(saleData);
            navigate('/warehouse/sales');
        } catch (error) {
            console.error('Failed to create sale:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Create New Sale</h1>
                <Button
                    variant="outline"
                    onClick={() => navigate('/warehouse/sales')}
                >
                    Cancel
                </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Customer Name"
                            {...form.register('customerName')}
                            error={form.formState.errors.customerName?.message}
                        />
                        <Input
                            label="Phone Number"
                            {...form.register('customerPhone')}
                            error={form.formState.errors.customerPhone?.message}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Product & Pricing</h2>
                    <div className="space-y-4">
                        <ProductSelector
                            onProductSelect={(product) => {
                                setSelectedProduct(product);
                                form.setValue('productId', product.id);
                            }}
                        />

                        {selectedProduct && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Quantity"
                                    type="number"
                                    {...form.register('quantity', { valueAsNumber: true })}
                                    error={form.formState.errors.quantity?.message}
                                />
                                <Select
                                    label="Unit Type"
                                    {...form.register('unitType')}
                                    options={[
                                        { value: 'UNITS', label: 'Units' },
                                        { value: 'PACKS', label: 'Packs' },
                                        { value: 'PALLETS', label: 'Pallets' }
                                    ]}
                                />
                                <Select
                                    label="Payment Method"
                                    {...form.register('paymentMethod')}
                                    options={[
                                        { value: 'CASH', label: 'Cash' },
                                        { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                                        { value: 'CARD', label: 'Card' },
                                        { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                                        { value: 'CHECK', label: 'Check' }
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {selectedProduct && (
                    <DiscountCalculator
                        product={selectedProduct}
                        quantity={form.watch('quantity')}
                        onPriceCalculated={setCalculatedPrice}
                        discountPercentage={form.watch('discountPercentage')}
                        onDiscountChange={(percentage) => form.setValue('discountPercentage', percentage)}
                    />
                )}

                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/warehouse/sales')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!selectedProduct || !form.watch('quantity')}
                    >
                        Create Sale
                    </Button>
                </div>
            </form>
        </div>
    );
};