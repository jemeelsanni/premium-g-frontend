import { useState, useEffect } from 'react';
import { warehouseApi } from '../../services/api';
import { Search, Package } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    productNo: string;
    pricePerPack: number;
    costPerPack?: number;
    packsPerPallet: number;
    inventory?: {
        packs: number;
        units: number;
    };
}

interface ProductSelectorProps {
    onProductSelect: (product: Product) => void;
}

export const ProductSelector = ({ onProductSelect }: ProductSelectorProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await warehouseApi.getProducts();
                setProducts(response.data);
                setFilteredProducts(response.data);
            } catch (error) {
                console.error('Failed to fetch products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.productNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
        onProductSelect(product);
    };

    if (loading) {
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
                    Select Product
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
                            <p className="text-sm text-blue-700">
                                {selectedProduct.productNo} • ₦{selectedProduct.pricePerPack}/pack
                            </p>
                            {selectedProduct.inventory && (
                                <p className="text-sm text-blue-600">
                                    Stock: {selectedProduct.inventory.packs} packs, {selectedProduct.inventory.units} units
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No products found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => handleProductSelect(product)}
                                className={`w-full p-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${selectedProduct?.id === product.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                                        <p className="text-sm text-gray-600">{product.productNo}</p>
                                        {product.inventory && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Stock: {product.inventory.packs} packs
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            ₦{product.pricePerPack.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">per pack</p>
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
