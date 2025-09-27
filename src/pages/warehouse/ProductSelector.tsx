// src/components/ProductSelector.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { distributionService } from '../../services/distributionService';
import { Search, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ProductSelectorProps {
    onProductSelect: (product: Product) => void;
    selectedProductId?: string;
}

export const ProductSelector = ({ onProductSelect, selectedProductId }: ProductSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch products using React Query
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => distributionService.getProducts(),
    });

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        product.isActive
    );

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const handleProductSelect = (product: Product) => {
        onProductSelect(product);
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product *
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {selectedProduct && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <div>
                            <h3 className="font-medium text-blue-900">{selectedProduct.name}</h3>
                            {selectedProduct.description && (
                                <p className="text-sm text-blue-700">{selectedProduct.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        {searchTerm ? 'No products found matching your search' : 'No products available'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => handleProductSelect(product)}
                                className={`w-full p-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${selectedProductId === product.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                                        {product.description && (
                                            <p className="text-sm text-gray-600">{product.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Active Product
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};