import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { distributionApi } from '../../api/distribution.api';
import { adminApi } from '../../api/admin.api';

interface OrderItem {
    productId: string;
    pallets: number;
    packs: number;
}

interface ApiOrderItem {
    productId: string;
    pallets: number;
    packs: number;
    product?: {
        id: string;
        name: string;
    };
}

export const CreateOrder = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Get order ID from URL
    const isEditMode = Boolean(id);
    const [customerId, setCustomerId] = useState('');
    const [locationId, setLocationId] = useState('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([
        { productId: '', pallets: 0, packs: 0 }
    ]);
    const [remark, setRemark] = useState('');

    const { data: orderData } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionApi.getOrderById(id!),
        enabled: isEditMode,
    });

    // Populate form when order data is loaded
    useEffect(() => {
        if (orderData?.data?.order) {
            const order = orderData.data.order;
            setCustomerId(order.customerId || '');
            setLocationId(order.locationId || '');
            setRemark(order.remark || '');

            if (order.orderItems && order.orderItems.length > 0) {
                setOrderItems(order.orderItems.map((item: ApiOrderItem) => ({
                    productId: item.productId,
                    pallets: item.pallets || 0,
                    packs: item.packs || 0,
                })));
            }
        }
    }, [orderData]);

    // Fetch customers, locations, and products
    const { data: customersData, isLoading: loadingCustomers } = useQuery({
        queryKey: ['customers'],
        queryFn: () => adminApi.getCustomers({ limit: 1000 }),
    });

    const { data: locationsData, isLoading: loadingLocations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => adminApi.getLocations({ limit: 1000 }),
    });

    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['distribution-products'],
        queryFn: () => distributionApi.getProducts(),
    });

    // Safely extract data from responses
    const customers = Array.isArray(customersData?.data?.customers)
        ? customersData.data.customers
        : [];

    const locations = Array.isArray(locationsData?.data?.locations)
        ? locationsData.data.locations
        : [];

    const products = Array.isArray(productsData?.data?.products)
        ? productsData.data.products
        : [];

    const createOrderMutation = useMutation({
        mutationFn: (data: {
            customerId: string;
            locationId: string;
            orderItems: OrderItem[];
            remark?: string;
        }) => distributionApi.createOrder(data),
        onSuccess: () => {
            navigate('/distribution/orders');
        },
        onError: (error) => {
            console.error('Error creating order:', error);
            alert('Failed to create order. Please try again.');
        }
    });

    const addOrderItem = () => {
        setOrderItems([...orderItems, { productId: '', pallets: 0, packs: 0 }]);
    };

    const removeOrderItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
        const updated = [...orderItems];
        updated[index] = { ...updated[index], [field]: value };
        setOrderItems(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!customerId || !locationId || orderItems.some(item => !item.productId)) {
            alert('Please fill in all required fields');
            return;
        }

        createOrderMutation.mutate({
            customerId,
            locationId,
            orderItems,
            remark: remark || undefined,
        });
    };

    const isLoading = loadingCustomers || loadingLocations || loadingProducts;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/distribution/orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Distribution Order</h1>
                    <p className="text-gray-600 mt-1">Fill in the details to create a new order</p>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">Loading form data...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                    {/* Customer & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select Customer</option>
                                {customers.map((customer: { id: string; name: string }) => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Select Location</option>
                                {locations.map((location: { id: string; name: string }) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Order Items <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={addOrderItem}
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {orderItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-3 items-end">
                                    <div className="col-span-5">
                                        <label className="block text-xs text-gray-600 mb-1">Product</label>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        >
                                            <option value="">Select Product</option>
                                            {products.map((product: { id: string; name: string; productNo: string }) => (
                                                <option key={product.id} value={product.id}>
                                                    {product.productNo} - {product.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs text-gray-600 mb-1">Pallets</label>
                                        <input
                                            type="number"
                                            value={item.pallets}
                                            onChange={(e) => updateOrderItem(index, 'pallets', parseInt(e.target.value) || 0)}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs text-gray-600 mb-1">Extra Packs</label>
                                        <input
                                            type="number"
                                            value={item.packs}
                                            onChange={(e) => updateOrderItem(index, 'packs', parseInt(e.target.value) || 0)}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        {orderItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeOrderItem(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Remark */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remark (Optional)
                        </label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Add any additional notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/distribution/orders')}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createOrderMutation.isPending}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};