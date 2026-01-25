/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  Package,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import supplierCompanyService from '../../services/supplierCompanyService';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>('overview');

  // Fetch supplier details
  const { data: supplier, isLoading: loadingSupplier } = useQuery({
    queryKey: ['supplier-company', id],
    queryFn: async () => {
      const suppliers = await supplierCompanyService.getAllSupplierCompanies();
      return suppliers.find((s: any) => s.id === id);
    },
    enabled: !!id,
  });

  // Fetch supplier products
  const { data: supplierProductsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: () => distributionService.getSupplierProductsBySupplier(id!, true),
    enabled: !!id,
  });

  const supplierProducts = supplierProductsResponse?.data?.products || [];

  if (loadingSupplier) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Supplier not found</p>
        <Button onClick={() => navigate('/distribution/suppliers')} className="mt-4">
          Back to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/distribution/suppliers')}
                className="text-white hover:text-gray-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{supplier.name}</h1>
                <p className="text-blue-100">Code: {supplier.code}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {supplier.isActive ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <XCircle className="w-4 h-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products ({supplierProducts.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/distribution/suppliers')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Supplier
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplier.email && (
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <p className="text-sm text-gray-900">{supplier.email}</p>
                  </div>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-start gap-3">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                    <p className="text-sm text-gray-900">{supplier.phone}</p>
                  </div>
                </div>
              )}

              {supplier.contactPerson && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                    <p className="text-sm text-gray-900">{supplier.contactPerson}</p>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm text-gray-900">{supplier.address}</p>
                  </div>
                </div>
              )}
            </div>

            {supplier.notes && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {supplier.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() =>
                  navigate('/distribution/supplier-products', {
                    state: { selectedSupplierId: supplier.id },
                  })
                }
                className="w-full flex items-center justify-center gap-2"
              >
                <Package className="h-5 w-5" />
                Manage Products
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/distribution/orders/create')}
                className="w-full flex items-center justify-center gap-2"
              >
                Create Order
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Products</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {supplierProducts.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Products</span>
                  <span className="text-sm font-semibold text-green-600">
                    {supplierProducts.filter((p: any) => p.isAvailable).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Supplier Products</h2>
            <Button
              onClick={() =>
                navigate('/distribution/supplier-products', {
                  state: { selectedSupplierId: supplier.id },
                })
              }
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
          </div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : supplierProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products configured</h3>
              <p className="text-gray-500 mb-4">
                Add products to this supplier's catalog to get started
              </p>
              <Button
                onClick={() =>
                  navigate('/distribution/supplier-products', {
                    state: { selectedSupplierId: supplier.id },
                  })
                }
              >
                Add Products
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cost/Pack
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Min Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lead Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierProducts.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.product.name}
                          </div>
                          <div className="text-sm text-gray-500">{item.product.productNo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ₦{item.supplierCostPerPack.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minimumOrderPacks ? `${item.minimumOrderPacks} packs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.leadTimeDays ? `${item.leadTimeDays} days` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isAvailable ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Unavailable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierDetail;
