// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useQuery } from '@tanstack/react-query';
// import { useAuthStore } from '../../store/authStore';
// import { UserRole, DistributionOrder } from '../../types';
// import { Package, Truck, Warehouse, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
// import { analyticsApi } from '../../api/analytics.api';
// import { distributionApi } from '../../api/distribution.api';
// import { formatCurrency } from '../../lib/utils';

// // Define the exact API response structures based on what the backend returns
// interface DashboardAuditLog {
//     id: string;
//     action: string;
//     entity: string;
//     createdAt: string;
//     user?: {
//         username: string;
//     };
// }

// interface DashboardOrder {
//     id: string;
//     orderNumber: string;
//     status: string;
//     createdAt: string;
//     location?: {
//         name: string;
//     };
// }

// // API response structure from analyticsApi.getDashboardStats()
// interface AnalyticsDashboardResponse {
//     totalOrders: number;
//     activeDeliveries: number;
//     warehouseStock: number;
//     totalRevenue: number;
//     recentOrders: DashboardOrder[];
//     recentTransportOrders: any[];
//     expenses: any[];
//     recentAuditLogs: DashboardAuditLog[];
// }

// export const Dashboard = () => {
//     const { user } = useAuthStore();

//     // Fetch dashboard statistics from analytics API
//     const { data: healthData, isLoading: isLoadingHealth } = useQuery({
//         queryKey: ['dashboard-health'],
//         queryFn: () => analyticsApi.getDashboardStats(),
//     });

//     // Fetch recent orders based on user role
//     const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
//         queryKey: ['recent-orders'],
//         queryFn: () => distributionApi.getOrders({ limit: 5 }),
//         enabled: user?.role ? [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) : false,
//     });

//     const isLoading = isLoadingHealth || isLoadingOrders;

//     if (isLoading) {
//         return (
//             <div className="flex items-center justify-center h-64">
//                 <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
//             </div>
//         );
//     }

//     // Safely extract dashboard data with proper typing
//     const dashboardData = healthData?.data as AnalyticsDashboardResponse | undefined;

//     // Build stats array only if we have dashboard data
//     const stats = dashboardData ? [
//         {
//             name: 'Total Orders',
//             value: dashboardData.totalOrders.toString(),
//             icon: Package,
//             iconColor: 'text-blue-600',
//             bgColor: 'bg-blue-100',
//         },
//         {
//             name: 'Active Deliveries',
//             value: dashboardData.activeDeliveries.toString(),
//             icon: Truck,
//             iconColor: 'text-green-600',
//             bgColor: 'bg-green-100',
//         },
//         {
//             name: 'Warehouse Stock',
//             value: dashboardData.warehouseStock.toString(),
//             icon: Warehouse,
//             iconColor: 'text-purple-600',
//             bgColor: 'bg-purple-100',
//         },
//         {
//             name: 'Total Revenue',
//             value: formatCurrency(dashboardData.totalRevenue),
//             icon: DollarSign,
//             iconColor: 'text-indigo-600',
//             bgColor: 'bg-indigo-100',
//         },
//     ] : [];

//     // Extract arrays with proper typing
//     const recentOrders: DistributionOrder[] = Array.isArray(ordersData?.data) ? ordersData.data : [];
//     const recentAuditLogs: DashboardAuditLog[] = Array.isArray(dashboardData?.recentAuditLogs) ? dashboardData.recentAuditLogs : [];

//     // Helper function to format dates safely
//     const formatDate = (dateString: string | undefined): string => {
//         if (!dateString) return 'N/A';

//         try {
//             const date = new Date(dateString);
//             return new Intl.DateTimeFormat('en-NG', {
//                 year: 'numeric',
//                 month: 'short',
//                 day: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit',
//             }).format(date);
//         } catch {
//             return 'N/A';
//         }
//     };

//     // Helper function to get status badge styles
//     const getStatusBadgeClass = (status: string): string => {
//         switch (status) {
//             case 'DELIVERED':
//                 return 'bg-green-100 text-green-800';
//             case 'PROCESSING':
//                 return 'bg-blue-100 text-blue-800';
//             case 'CANCELLED':
//                 return 'bg-red-100 text-red-800';
//             default:
//                 return 'bg-yellow-100 text-yellow-800';
//         }
//     };

//     return (
//         <div className="space-y-6">
//             {/* Welcome Section */}
//             <div className="bg-white rounded-lg shadow p-6">
//                 <h1 className="text-2xl font-bold text-gray-900">
//                     Welcome back, {user?.username}!
//                 </h1>
//                 <p className="mt-1 text-sm text-gray-500">
//                     Here's what's happening with your business today.
//                 </p>
//             </div>

//             {/* Stats Grid */}
//             {dashboardData ? (
//                 <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//                     {stats.map((stat) => (
//                         <div key={stat.name} className="bg-white rounded-lg shadow p-6">
//                             <div className="flex items-center justify-between">
//                                 <div className="flex-1">
//                                     <p className="text-sm font-medium text-gray-600">
//                                         {stat.name}
//                                     </p>
//                                     <p className="mt-2 text-3xl font-semibold text-gray-900">
//                                         {stat.value}
//                                     </p>
//                                 </div>
//                                 <div className={`flex-shrink-0 rounded-full p-3 ${stat.bgColor}`}>
//                                     <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             ) : (
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                     <div className="flex items-center">
//                         <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
//                         <p className="text-sm text-yellow-800">Unable to load dashboard statistics</p>
//                     </div>
//                 </div>
//             )}

//             {/* Recent Activity */}
//             <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//                 {/* Recent Orders */}
//                 {user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) && (
//                     <div className="bg-white rounded-lg shadow">
//                         <div className="p-6 border-b">
//                             <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
//                         </div>
//                         <div className="p-6">
//                             {recentOrders.length > 0 ? (
//                                 <div className="space-y-4">
//                                     {recentOrders.slice(0, 5).map((order: DistributionOrder) => (
//                                         <div key={order.id} className="flex items-center justify-between">
//                                             <div className="flex items-center">
//                                                 <Package className="h-8 w-8 text-gray-400" />
//                                                 <div className="ml-3">
//                                                     <p className="text-sm font-medium text-gray-900">
//                                                         {order.orderNo || `Order #${order.id.slice(-6)}`}
//                                                     </p>
//                                                     <p className="text-sm text-gray-500">
//                                                         {order.location?.name || 'N/A'} • {formatDate(order.createdAt)}
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
//                                                 {order.status}
//                                             </span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <p className="text-sm text-gray-500">No recent orders</p>
//                             )}
//                         </div>
//                     </div>
//                 )}

//                 {/* Recent Audit Logs (Super Admin only) */}
//                 {user?.role === UserRole.SUPER_ADMIN && recentAuditLogs.length > 0 && (
//                     <div className="bg-white rounded-lg shadow">
//                         <div className="p-6 border-b">
//                             <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
//                         </div>
//                         <div className="p-6">
//                             <div className="space-y-4">
//                                 {recentAuditLogs.slice(0, 5).map((log: DashboardAuditLog) => (
//                                     <div key={log.id} className="flex items-start">
//                                         <div className="flex-1">
//                                             <p className="text-sm font-medium text-gray-900">
//                                                 {log.action} - {log.entity}
//                                             </p>
//                                             <p className="text-sm text-gray-500">
//                                                 {log.user?.username || 'System'} • {formatDate(log.createdAt)}
//                                             </p>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Quick Actions - Only show if user has permissions */}
//                 <div className="bg-white rounded-lg shadow">
//                     <div className="p-6 border-b">
//                         <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
//                     </div>
//                     <div className="p-6">
//                         <div className="grid grid-cols-2 gap-4">
//                             {user?.role && [UserRole.SUPER_ADMIN, UserRole.DISTRIBUTION_ADMIN, UserRole.DISTRIBUTION_SALES_REP].includes(user.role) && (
//                                 <button
//                                     onClick={() => window.location.href = '/distribution'}
//                                     className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
//                                 >
//                                     <Package className="h-8 w-8 text-indigo-600" />
//                                     <span className="mt-2 text-sm font-medium text-gray-900">Distribution</span>
//                                 </button>
//                             )}

//                             {user?.role && [UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_ADMIN, UserRole.WAREHOUSE_SALES_OFFICER].includes(user.role) && (
//                                 <button
//                                     onClick={() => window.location.href = '/warehouse'}
//                                     className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
//                                 >
//                                     <Warehouse className="h-8 w-8 text-indigo-600" />
//                                     <span className="mt-2 text-sm font-medium text-gray-900">Warehouse</span>
//                                 </button>
//                             )}

//                             {user?.role && [UserRole.SUPER_ADMIN, UserRole.TRANSPORT_ADMIN].includes(user.role) && (
//                                 <button
//                                     onClick={() => window.location.href = '/transport'}
//                                     className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
//                                 >
//                                     <Truck className="h-8 w-8 text-indigo-600" />
//                                     <span className="mt-2 text-sm font-medium text-gray-900">Transport</span>
//                                 </button>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };