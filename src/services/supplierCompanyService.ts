import api from './api';
import { SupplierCompany } from '../types/distribution';

export interface CreateSupplierCompanyData {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateSupplierCompanyData extends Partial<CreateSupplierCompanyData> {
  isActive?: boolean;
}

export interface SupplierCompanyStats {
  company: {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
    isActive: boolean;
  };
  stats: {
    totalOrders: number;
    totalValue: number;
    totalPaid: number;
    pendingPayments: number;
    ordersByStatus: {
      NOT_SENT: number;
      PAYMENT_SENT: number;
      ORDER_RAISED: number;
      PROCESSING: number;
      LOADED: number;
      DISPATCHED: number;
    };
  };
}

class SupplierCompanyService {
  /**
   * Get all supplier companies
   */
  async getAllSupplierCompanies(isActive?: boolean): Promise<SupplierCompany[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('isActive', String(isActive));
    }

    const response = await api.get(`/supplier-companies?${params.toString()}`);
    return response.data.data;
  }

  /**
   * Get supplier company by ID
   */
  async getSupplierCompanyById(id: string): Promise<SupplierCompany> {
    const response = await api.get(`/supplier-companies/${id}`);
    return response.data.data;
  }

  /**
   * Get supplier company statistics
   */
  async getSupplierCompanyStats(id: string): Promise<SupplierCompanyStats> {
    const response = await api.get(`/supplier-companies/${id}/stats`);
    return response.data.data;
  }

  /**
   * Create new supplier company
   */
  async createSupplierCompany(data: CreateSupplierCompanyData): Promise<SupplierCompany> {
    const response = await api.post('/supplier-companies', data);
    return response.data.data;
  }

  /**
   * Update supplier company
   */
  async updateSupplierCompany(id: string, data: UpdateSupplierCompanyData): Promise<SupplierCompany> {
    const response = await api.put(`/supplier-companies/${id}`, data);
    return response.data.data;
  }

  /**
   * Delete supplier company
   */
  async deleteSupplierCompany(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/supplier-companies/${id}`);
    return response.data;
  }
}

export default new SupplierCompanyService();
