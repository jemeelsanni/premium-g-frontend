/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';

export interface SupplierIncentive {
  id: string;
  supplierCompanyId: string;
  year: number;
  month: number;
  incentivePercentage: number;
  actualIncentivePaid?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  supplierCompany?: {
    id: string;
    name: string;
    code: string;
  };
  creator?: {
    id: string;
    username: string;
    email: string;
  };
  // Calculated fields from backend
  totalRevenue?: number;
  calculatedIncentive?: number;
  variance?: number;
  variancePercentage?: number;
}

export interface CreateSupplierIncentiveData {
  supplierCompanyId: string;
  year: number;
  month: number;
  incentivePercentage: number;
  actualIncentivePaid?: number;
  notes?: string;
}

export interface UpdateSupplierIncentiveData {
  incentivePercentage?: number;
  actualIncentivePaid?: number;
  notes?: string;
}

export interface SupplierIncentiveFilters {
  supplierCompanyId?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

class SupplierIncentiveService extends BaseApiService {
  constructor() {
    super('/supplier-incentives');
  }

  // Get all supplier incentives with optional filters
  async getSupplierIncentives(filters?: SupplierIncentiveFilters): Promise<any> {
    const queryParams = new URLSearchParams();

    if (filters?.supplierCompanyId) queryParams.append('supplierCompanyId', filters.supplierCompanyId);
    if (filters?.year) queryParams.append('year', filters.year.toString());
    if (filters?.month) queryParams.append('month', filters.month.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    return this.get(queryString ? `?${queryString}` : '');
  }

  // Get incentives for a specific supplier
  async getIncentivesBySupplier(supplierId: string, year?: number, month?: number): Promise<any> {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());
    const queryString = queryParams.toString();
    return this.get(`/supplier/${supplierId}${queryString ? `?${queryString}` : ''}`);
  }

  // Get a specific incentive by ID
  async getSupplierIncentive(id: string): Promise<SupplierIncentive> {
    return this.get(`/${id}`);
  }

  // Create a new supplier incentive
  async createSupplierIncentive(data: CreateSupplierIncentiveData): Promise<any> {
    return this.post(data);
  }

  // Update a supplier incentive
  async updateSupplierIncentive(id: string, data: UpdateSupplierIncentiveData): Promise<any> {
    return this.put(data, `/${id}`);
  }

  // Delete a supplier incentive
  async deleteSupplierIncentive(id: string): Promise<any> {
    return this.delete(`/${id}`);
  }

  // Calculate revenue for a specific supplier and period
  async getSupplierRevenue(supplierId: string, year: number, month: number): Promise<any> {
    return this.get(`/revenue/${supplierId}?year=${year}&month=${month}`);
  }

  // Get monthly revenue breakdown for a supplier with optional filtering
  async getMonthlyRevenue(
    supplierId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      year?: number;
      month?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month.toString());

    const queryString = params.toString();
    return this.get(`/monthly-revenue/${supplierId}${queryString ? `?${queryString}` : ''}`);
  }
}

export const supplierIncentiveService = new SupplierIncentiveService();
