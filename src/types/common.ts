/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    orders?: T[];      // For transport/distribution orders
    customers?: T[];   // For customers
    sales?: T[];       // For warehouse sales
    inventory?: T[];   // For inventory
    [key: string]: any; // Allow dynamic keys
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}


export interface DashboardStats {
  totalRevenue: number;
  recentOrders: number;
  activeCustomers: number;
  pendingTasks: number;
}