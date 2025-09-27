export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DISTRIBUTION_ADMIN = 'DISTRIBUTION_ADMIN',
  TRANSPORT_ADMIN = 'TRANSPORT_ADMIN',
  WAREHOUSE_ADMIN = 'WAREHOUSE_ADMIN',
  DISTRIBUTION_SALES_REP = 'DISTRIBUTION_SALES_REP',
  WAREHOUSE_SALES_OFFICER = 'WAREHOUSE_SALES_OFFICER',
  CASHIER = 'CASHIER',
  TRANSPORT_STAFF = 'TRANSPORT_STAFF'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}