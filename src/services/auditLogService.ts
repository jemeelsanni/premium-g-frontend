/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './api';
import { PaginatedResponse } from '../types/common';

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface InventoryChangeLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entityId: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  productName: string;
  productId: string;
  triggeredBy: string;
  referenceId: string | null;
  reason: string;
  changes: {
    pallets: { old: number; new: number; diff: number };
    packs: { old: number; new: number; diff: number };
    units: { old: number; new: number; diff: number };
  };
  oldInventory: {
    pallets: number;
    packs: number;
    units: number;
    reorderLevel?: number;
  };
  newInventory: {
    pallets: number;
    packs: number;
    units: number;
    reorderLevel?: number;
  };
}

export interface SuspiciousActivity {
  id: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: string;
  } | null;
  productName: string;
  productId: string;
  triggeredBy: string;
  reason: string;
  changes: {
    pallets?: { old: number; new: number; diff: number };
    packs?: { old: number; new: number; diff: number };
    units?: { old: number; new: number; diff: number };
  };
  suspicionReasons: string[];
  severity: 'HIGH' | 'MEDIUM';
}

export interface SuspiciousActivitiesResponse {
  suspiciousActivities: SuspiciousActivity[];
  summary: {
    total: number;
    high: number;
    medium: number;
    period: string;
  };
}

export interface ProductAuditHistory {
  product: {
    id: string;
    name: string;
    productNo: string;
  };
  logs: AuditLog[];
  summary: {
    totalChanges: number;
    inventoryUpdates: number;
    salesChanges: number;
    purchaseChanges: number;
  };
}

// Query Parameters
export interface AuditLogFilters {
  entity?: string;
  action?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InventoryChangeFilters {
  productId?: string;
  startDate?: string;
  endDate?: string;
  triggeredBy?: string;
  page?: number;
  limit?: number;
}

class AuditLogService {
  private baseUrl = '/audit-logs';

  /**
   * Get all audit logs with filtering
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();

    if (filters.entity) params.append('entity', filters.entity);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<AuditLog>>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get inventory change logs with detailed info
   */
  async getInventoryChanges(
    filters: InventoryChangeFilters = {}
  ): Promise<PaginatedResponse<InventoryChangeLog>> {
    const params = new URLSearchParams();

    if (filters.productId) params.append('productId', filters.productId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.triggeredBy) params.append('triggeredBy', filters.triggeredBy);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<InventoryChangeLog>>(
      `${this.baseUrl}/inventory-changes?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get suspicious activities report
   */
  async getSuspiciousActivities(days: number = 7): Promise<SuspiciousActivitiesResponse> {
    const response = await apiClient.get<{ data: SuspiciousActivitiesResponse }>(
      `${this.baseUrl}/suspicious-activities?days=${days}`
    );
    return response.data.data;
  }

  /**
   * Get all audit logs for a specific product
   */
  async getProductHistory(productId: string): Promise<ProductAuditHistory> {
    const response = await apiClient.get<{ data: ProductAuditHistory }>(
      `${this.baseUrl}/product/${productId}`
    );
    return response.data.data;
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(filters: AuditLogFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters.entity) params.append('entity', filters.entity);
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(
      `${this.baseUrl}/export?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }
}

export const auditLogService = new AuditLogService();
