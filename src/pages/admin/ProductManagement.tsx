/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { globalToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/formatters';

interface ProductFormData {
    productNo: string;
    name: string;
    description: string;
    packsPerPallet?: number;
    pricePerPack?: number;
    costPerPack?: number;
    module: 'DISTRIBUTION' | 'WAREHOUSE' | 'BOTH';
    // 🔥 NEW FIELDS
    minSellingPrice?: number;
    maxSellingPrice?: number;
}

export const ProductManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        productNo: '',
        name: '',
        description: '',
        packsPerPallet: undefined,
        pricePerPack: undefined,
        costPerPack: undefined,
        module: 'DISTRIBUTION',
        minSellingPrice: undefined,
        maxSellingPrice: undefined,
    });

    const queryClient = useQueryClient();
    const pageSize = 10;

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', currentPage, searchTerm],
        queryFn: () =>
            adminService.getProducts({
                page: currentPage,
                limit: pageSize,
                search: searchTerm || undefined,
            }),
    });

    const { data: productNumberData } = useQuery({
        queryKey: ['next-product-number'],
        queryFn: () => adminService.getNextProductNumber(),
        enabled: isModalOpen && !editingProduct,
    });

    useEffect(() => {
        if (productNumberData && !editingProduct) {
            setFormData(prev => ({
                ...prev,
                productNo: productNumberData.data.productNumber
            }));
        }
    }, [productNumberData, editingProduct]);

    const totalPages = productsData?.data?.pagination?.totalPages || 1;
    const total = productsData?.data?.pagination?.total || 0;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) =>
            adminService.createProduct({
                ...data,
                packsPerPallet: data.packsPerPallet || 0,
                pricePerPack: data.pricePerPack || 0,
                costPerPack: data.costPerPack || 0,
                minSellingPrice: data.minSellingPrice || undefined,
                maxSellingPrice: data.maxSellingPrice || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['next-product-number'] });
            globalToast.success('Product created successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to create product');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
            adminService.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            globalToast.success('Product updated successfully!');
            handleCloseModal();
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to update product');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            globalToast.success('Product deleted successfully!');
        },
        onError: (error: any) => {
            globalToast.error(error.response?.data?.message || 'Failed to delete product');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 🔥 Validation for price range
        if (formData.minSellingPrice && formData.maxSellingPrice) {
            if (formData.minSellingPrice > formData.maxSellingPrice) {
                globalToast.error('Minimum selling price cannot be greater than maximum selling price');
                return;
            }
        }

        const submitData: ProductFormData = {
            productNo: formData.productNo,
            name: formData.name,
            description: formData.description,
            module: formData.module,
            packsPerPallet: formData.packsPerPallet || 0,
            pricePerPack: formData.pricePerPack || 0,
            costPerPack: formData.costPerPack || 0,
            minSellingPrice: formData.minSellingPrice || undefined,
            maxSellingPrice: formData.maxSellingPrice || undefined,
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setFormData({
            productNo: product.productNo,
            name: product.name,
            description: product.description || '',
            packsPerPallet: product.packsPerPallet,
            pricePerPack: product.pricePerPack,
            costPerPack: product.costPerPack || 0,
            module: product.module || 'DISTRIBUTION',
            minSellingPrice: product.minSellingPrice || undefined,
            maxSellingPrice: product.maxSellingPrice || undefined,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({
            productNo: '',
            name: '',
            description: '',
            packsPerPallet: undefined,
            pricePerPack: undefined,
            costPerPack: undefined,
            module: 'DISTRIBUTION',
            minSellingPrice: undefined,
            maxSellingPrice: undefined,
        });
    };

    const productColumns = [
        {
            key: 'productNo',
            title: 'Product #',
            render: (value: string) => (
                <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium text-gray-900">{value}</span>
                </div>
            ),
        },
        {
            key: 'name',
            title: 'Name',
            render: (value: string) => <span className="text-gray-900">{value}</span>,
        },
        {
            key: 'pricePerPack',
            title: 'Price/Pack',
            render: (value: number, product: any) => (
                <div>
                    <span className="font-medium text-gray-900">
                        {value ? formatCurrency(value) : 'N/A'}
                    </span>
                    {(product.minSellingPrice || product.maxSellingPrice) && (
                        <p className="text-xs text-gray-500">
                            Range:{' '}
                            {product.minSellingPrice
                                ? `₦${product.minSellingPrice.toLocaleString()}`
                                : 'N/A'}{' '}
                            -{' '}
                            {product.maxSellingPrice
                                ? `₦${product.maxSellingPrice.toLocaleString()}`
                                : 'N/A'}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'module',
            title: 'Module',
            render: (value: string) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${value === 'DISTRIBUTION'
                            ? 'bg-blue-100 text-blue-800'
                            : value === 'WAREHOUSE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                        }`}
                >
                    {value}
                </span>
            ),
        },
        {
            key: 'isActive',
            title: 'Status',
            render: (value: boolean) => (
                <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                >
                    {value ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (_: any, product: any) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(product)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-600">Manage products across all modules</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <Table data={productsData?.data?.products || []} columns={productColumns} />

                {/* Pagination */}
                <div className="px-4 py-3 border-t bg-gray-50 flex justify-between items-center">
                    <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span> ({total} total)
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            disabled={!hasPrev}
                            onClick={() => setCurrentPage(currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            disabled={!hasNext}
                            onClick={() => setCurrentPage(currentPage + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Module */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Module * (Select First)
                        </label>
                        <select
                            value={formData.module}
                            onChange={(e) =>
                                setFormData({ ...formData, module: e.target.value as any })
                            }
                            className="w-full border px-3 py-2 rounded"
                            required
                            disabled={!!editingProduct}
                        >
                            <option value="DISTRIBUTION">Distribution Product</option>
                            <option value="WAREHOUSE">Warehouse Product</option>
                            <option value="BOTH">Both Modules</option>
                        </select>
                    </div>

                    {/* Product Number */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Product Number
                        </label>
                        <Input
                            type="text"
                            value={formData.productNo}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>

                    {/* Name & Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Name *</label>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="w-full border px-3 py-2 rounded"
                            rows={3}
                        />
                    </div>

                    {/* Warehouse Price Range */}
                    {(formData.module === 'WAREHOUSE' || formData.module === 'BOTH') && (
                        <div className="border-t pt-4 space-y-4">
                            <h3 className="text-md font-semibold">
                                Warehouse Price Range (Optional)
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Minimum Selling Price (₦)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.minSellingPrice || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                minSellingPrice: parseFloat(e.target.value) || undefined,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Maximum Selling Price (₦)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.maxSellingPrice || ''}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                maxSellingPrice: parseFloat(e.target.value) || undefined,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            {formData.minSellingPrice && formData.maxSellingPrice && (
                                <div className="bg-blue-50 border border-blue-200 p-2 rounded text-sm text-blue-700">
                                    ✓ Warehouse sales must be between ₦
                                    {formData.minSellingPrice.toLocaleString()} and ₦
                                    {formData.maxSellingPrice.toLocaleString()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Price, Cost, Packs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Price per Pack
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.pricePerPack || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        pricePerPack: parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Cost per Pack
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.costPerPack || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        costPerPack: parseFloat(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Packs per Pallet
                            </label>
                            <Input
                                type="number"
                                value={formData.packsPerPallet || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        packsPerPallet: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
