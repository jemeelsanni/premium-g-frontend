/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiService } from './api';

export interface CategoryTargets {
  CSD: number;
  ED: number;
  WATER: number;
  JUICE: number;
}

export interface SupplierTarget {
  id: string;
  supplierCompanyId: string;
  year: number;
  month: number;
  totalPacksTarget: number;
  weeklyTargets: {
    [key: string]: number;
  };
  categoryTargets?: CategoryTargets;
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
  // Progress tracking fields
  actualPacks?: number;
  weeklyActuals?: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  percentageAchieved?: number;
  remainingTarget?: number;
}

export interface CreateSupplierTargetData {
  supplierCompanyId: string;
  year: number;
  month: number;
  totalPacksTarget: number;
  weeklyTargets: {
    [key: string]: number;
  };
  categoryTargets?: CategoryTargets;
  notes?: string;
}

export interface UpdateSupplierTargetData {
  totalPacksTarget?: number;
  weeklyTargets?: {
    [key: string]: number;
  };
  categoryTargets?: CategoryTargets;
  notes?: string;
}

export interface SupplierTargetFilters {
  supplierCompanyId?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

class SupplierTargetService extends BaseApiService {
  constructor() {
    super('/supplier-targets');
  }

  // Get all supplier targets with optional filters
  async getSupplierTargets(filters?: SupplierTargetFilters): Promise<any> {
    const queryParams = new URLSearchParams();

    if (filters?.supplierCompanyId) queryParams.append('supplierCompanyId', filters.supplierCompanyId);
    if (filters?.year) queryParams.append('year', filters.year.toString());
    if (filters?.month) queryParams.append('month', filters.month.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    return this.get(queryString ? `?${queryString}` : '');
  }

  // Get targets for a specific supplier
  async getTargetsBySupplier(supplierId: string): Promise<any> {
    return this.get(`/supplier/${supplierId}`);
  }

  // Get a specific target by ID
  async getSupplierTarget(id: string): Promise<SupplierTarget> {
    return this.get(`/${id}`);
  }

  // Create a new supplier target
  async createSupplierTarget(data: CreateSupplierTargetData): Promise<any> {
    return this.post(data);
  }

  // Update a supplier target
  async updateSupplierTarget(id: string, data: UpdateSupplierTargetData): Promise<any> {
    return this.put(data, `/${id}`);
  }

  // Delete a supplier target
  async deleteSupplierTarget(id: string): Promise<any> {
    return this.delete(`/${id}`);
  }
}

export const supplierTargetService = new SupplierTargetService();
