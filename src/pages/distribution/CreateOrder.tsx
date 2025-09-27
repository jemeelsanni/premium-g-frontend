import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { distributionApi } from '../../api/distribution.api';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { toast } from '../../utils/toast';
import { formatCurrency } from '../../utils/format';

const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    pallets: z.number().min(0, 'Pallets must be 0 or more'),
    packs: z.number().min(1, 'Packs must be at least 1'),
    amount: z.number().min(0, 'Amount must be 0 or more')
});

const orderSchema = z.object({
    customerId: z.string().min(1, 'Customer is required'),
    locationId: z.string().min(1, 'Location is required'),
    orderItems: z.array(orderItemSchema).min(1, 'At least one item is required'),
    remark: z.string().optional()
});

type OrderFormData = z.infer<typeof orderSchema>;

export const CreateOrder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [orderSummary, setOrderSummary] = useState({
        totalPallets: 0,
        totalPacks: 0,
        totalAmount: 0
    });

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            customerId: '',
            locationId: '',
            orderItems: [{ productId: '', pallets: 0, packs: 0, amount: 0 }],
            remark: ''
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'orderItems'
    });

    // Fetch reference data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customersRes, locationsRes, productsRes] = await Promise.all([
                    distributionApi.getCustomers({ limit: 1000 }),
                    adminApi.getLocations({ limit: 1000 }),
                    adminApi.getProducts({ limit: 1000 })
                ]);

                setCustomers(customersRes.data || []);
                setLocations(locationsRes.data || []);
                setProducts(productsRes.data || []);
            } catch (error) {
                console.error('Failed to fetch reference data:', error);
                toast.error('Failed to load form data');
            }
        };

        fetchData();
    }, []);

    // Watch form values for calculations
    const watchedItems = form.watch('orderItems');

    useEffect(() => {
        const calculateSummary = () => {
            const summary = watchedItems.reduce(
                (acc, item) => ({
                    totalPallets: acc.totalPallets + (item.pallets || 0),
                    totalPacks: acc.totalPacks + (item.packs || 0),
                    totalAmount: acc.totalAmount + (item.amount || 0)
                }),
                { totalPallets: 0, totalPacks: 0, totalAmount: 0 }
            );
            setOrderSummary(summary);
        };

        calculateSummary();
    }, [watchedItems]);

    // Calculate item amount when product or quantity changes
    const calculateItemAmount = (index: number) => {
        const item = form.getValues(`orderItems.${index}`);
        const product = products.find((p: any) => p.id === item.productId);

        if (product && item.packs > 0) {
            const amount = item.packs * product.pricePerPack;
            form.setValue(`orderItems.${index}.amount`, amount);
        }
    };

    const onSubmit = async (data: OrderFormData) => {
        try {
            setLoading(true);
            await distributionApi.createOrder(data);
            toast.success('Order created successfully');
            navigate('/distribution/orders');
        } catch (error: any) {
            console.error('Failed to create order:', error);
            toast.error(error.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const customerOptions = customers.map((customer: any) => ({
        value: customer.id,
        label: customer.name
    }));

    const locationOptions = locations.map((location: any) => ({
        value: location.id,
        label: location.name
    }));

    const productOptions = products.map((product: any) => ({
        value: product.id,
        label: `${product.name} - ${formatCurrency(product.pricePerPack)}/pack`
    }));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Distribution Order</h1>
                    <p className="text-gray-600">Create a new B2B customer order</p>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{orderSummary.totalPallets}</div>
                            <div className="text-sm text-gray-600">Total Pallets</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{orderSummary.totalPacks.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Total Packs</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">{formatCurrency(orderSummary.totalAmount)}</div>
                            <div className="text-sm text-blue-600">Total Amount</div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end space-x-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/distribution/orders')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={loading || orderSummary.totalAmount === 0}
                    >
                        Create Order
                    </Button>
                </div>
            </form>
        </div>
    );
};
