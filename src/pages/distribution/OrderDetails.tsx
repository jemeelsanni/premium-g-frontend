/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/distribution/OrderDetailsEnhanced.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Edit, Truck, Package, DollarSign, CheckCircle, AlertCircle, CreditCard, FileText
} from 'lucide-react';
import { distributionService } from '../../services/distributionService';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RecordPaymentModal } from '../../components/distribution/RecordPaymentModal';
import { ConfirmPaymentModal } from '../../components/distribution/ConfirmPaymentModal';
import { PayRiteFoodsModal } from '../../components/distribution/PayRiteFoodsModal';
import { UpdateRiteFoodsStatusModal } from '../../components/distribution/UpdateRiteFoodsStatusModal';
import { AssignTransportModal } from '../../components/distribution/AssignTransportModal';
import { RecordDeliveryModal } from '../../components/distribution/RecordDeliveryModal';
// import { toast } from 'react-hot-toast';

export const OrderDetailsEnhanced: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Modal states
    const [showRecordPayment, setShowRecordPayment] = useState(false);
    const [showConfirmPayment, setShowConfirmPayment] = useState(false);
    const [showPayRiteFoods, setShowPayRiteFoods] = useState(false);
    const [showUpdateRFL, setShowUpdateRFL] = useState(false);
    const [showAssignTransport, setShowAssignTransport] = useState(false);
    const [showRecordDelivery, setShowRecordDelivery] = useState(false);

    const { data: orderResponse, isLoading, error } = useQuery({
        queryKey: ['distribution-order', id],
        queryFn: () => distributionService.getOrder(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !orderResponse?.data?.order) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Failed to load order details</p>
                    <Button onClick={() => navigate('/distribution/orders')} className="mt-4">
                        Back to Orders
                    </Button>
                </div>
            </div>
        );
    }

    const order = orderResponse.data.order;
    const workflow = order.workflow || {};

    // Get stage status
    const getStageStatus = (stageKey: string) => {
        if (stageKey === 'stage1_orderCreation') return 'completed';

        if (stageKey === 'stage2_payment') {
            if (workflow.stage2_payment?.status === 'CONFIRMED') return 'completed';
            if (workflow.stage2_payment?.status === 'PARTIAL' || workflow.stage2_payment?.balance > 0) return 'current';
            return 'pending';
        }

        if (stageKey === 'stage3_riteFoods') {
            if (workflow.stage3_riteFoods?.status === 'LOADED' || workflow.stage3_riteFoods?.status === 'DISPATCHED') return 'completed';
            if (workflow.stage3_riteFoods?.paidToRiteFoods) return 'current';
            return 'locked';
        }

        if (stageKey === 'stage4_transport') {
            if (workflow.stage5_delivery?.status === 'IN_TRANSIT') return 'completed';
            if (workflow.stage4_transport?.transporter) return 'current';
            return 'locked';
        }

        if (stageKey === 'stage5_delivery') {
            if (workflow.stage5_delivery?.status === 'FULLY_DELIVERED') return 'completed';
            if (workflow.stage5_delivery?.status === 'IN_TRANSIT') return 'current';
            return 'locked';
        }

        return 'locked';
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/distribution/orders')}
                            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Order #{order.id?.slice(-8) || 'N/A'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Created on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Button variant="outline" onClick={() => navigate(`/distribution/orders/${id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Order
                    </Button>
                </div>
            </div>

            {/* Workflow Progress Tracker */}
            <WorkflowTracker
                stages={{
                    stage1: getStageStatus('stage1_orderCreation'),
                    stage2: getStageStatus('stage2_payment'),
                    stage3: getStageStatus('stage3_riteFoods'),
                    stage4: getStageStatus('stage4_transport'),
                    stage5: getStageStatus('stage5_delivery'),
                }}
            />

            {/* Stage 1: Order Creation */}
            <StageCard
                icon={<Package className="h-6 w-6" />}
                title="Stage 1: Order Created"
                status={getStageStatus('stage1_orderCreation')}
                statusText="Completed"
            >
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Created By:</span>
                        <span className="ml-2 font-medium">{workflow.stage1_orderCreation?.createdBy || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">
                            {new Date(workflow.stage1_orderCreation?.createdAt || order.createdAt).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Order Items */}
                <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                        {order.orderItems?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium">{item.product?.name || 'Product'}</span>
                                <span className="text-gray-600">
                                    {item.quantity} packs × ₦{item.unitPrice?.toLocaleString()}
                                </span>
                                <span className="font-semibold">₦{item.totalPrice?.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between font-semibold text-lg border-t pt-3">
                        <span>Total Amount:</span>
                        <span className="text-blue-600">₦{order.finalAmount?.toLocaleString()}</span>
                    </div>
                </div>
            </StageCard>

            {/* Stage 2: Payment */}
            <StageCard
                icon={<CreditCard className="h-6 w-6" />}
                title="Stage 2: Customer Payment"
                status={getStageStatus('stage2_payment')}
                statusText={workflow.stage2_payment?.status || 'Pending'}
            >
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-xs text-blue-600 font-medium">Total Amount</div>
                        <div className="text-2xl font-bold text-blue-900">
                            ₦{workflow.stage2_payment?.totalAmount?.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-xs text-green-600 font-medium">Amount Paid</div>
                        <div className="text-2xl font-bold text-green-900">
                            ₦{workflow.stage2_payment?.amountPaid?.toLocaleString() || '0'}
                        </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-xs text-orange-600 font-medium">Balance</div>
                        <div className="text-2xl font-bold text-orange-900">
                            ₦{workflow.stage2_payment?.balance?.toLocaleString() || '0'}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {workflow.stage2_payment?.payments && workflow.stage2_payment.payments.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-2">Payment History</h4>
                        <div className="space-y-2">
                            {workflow.stage2_payment.payments.map((payment: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                                    <span>{payment.paymentMethod}</span>
                                    <span>₦{payment.amount?.toLocaleString()}</span>
                                    <span className="text-gray-500">
                                        {new Date(payment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                    {workflow.stage2_payment?.status !== 'CONFIRMED' && (
                        <Button onClick={() => setShowRecordPayment(true)} className="flex-1">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Record Payment
                        </Button>
                    )}
                    {workflow.stage2_payment?.balance === 0 && workflow.stage2_payment?.status !== 'CONFIRMED' && (
                        <Button onClick={() => setShowConfirmPayment(true)} variant="primary" className="flex-1">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm Payment
                        </Button>
                    )}
                </div>
            </StageCard>

            {/* Stage 3: Rite Foods */}
            <StageCard
                icon={<FileText className="h-6 w-6" />}
                title="Stage 3: Rite Foods Processing"
                status={getStageStatus('stage3_riteFoods')}
                statusText={workflow.stage3_riteFoods?.status || 'Not Started'}
            >
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium">Payment to Rite Foods</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${workflow.stage3_riteFoods?.paidToRiteFoods
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {workflow.stage3_riteFoods?.paidToRiteFoods ? 'Paid' : 'Unpaid'}
                        </span>
                    </div>

                    {workflow.stage3_riteFoods?.paidToRiteFoods && (
                        <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Amount Paid:</span>
                                    <span className="ml-2 font-medium">
                                        ₦{workflow.stage3_riteFoods?.amountPaid?.toLocaleString() || '0'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Payment Date:</span>
                                    <span className="ml-2 font-medium">
                                        {workflow.stage3_riteFoods?.paymentDate
                                            ? new Date(workflow.stage3_riteFoods.paymentDate).toLocaleDateString()
                                            : 'N/A'}
                                    </span>
                                </div>
                                {workflow.stage3_riteFoods?.orderNumber && (
                                    <div>
                                        <span className="text-gray-600">RFL Order #:</span>
                                        <span className="ml-2 font-medium">{workflow.stage3_riteFoods.orderNumber}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                    {!workflow.stage3_riteFoods?.paidToRiteFoods && workflow.stage2_payment?.status === 'CONFIRMED' && (
                        <Button onClick={() => setShowPayRiteFoods(true)} className="flex-1">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Pay Rite Foods
                        </Button>
                    )}
                    {workflow.stage3_riteFoods?.paidToRiteFoods && workflow.stage3_riteFoods?.status !== 'LOADED' && (
                        <Button onClick={() => setShowUpdateRFL(true)} variant="outline" className="flex-1">
                            <FileText className="h-4 w-4 mr-2" />
                            Update Status
                        </Button>
                    )}
                </div>
            </StageCard>

            {/* Stage 4: Transport */}
            <StageCard
                icon={<Truck className="h-6 w-6" />}
                title="Stage 4: Transport Assignment"
                status={getStageStatus('stage4_transport')}
                statusText={workflow.stage4_transport?.transporter ? 'Assigned' : 'Pending'}
            >
                {workflow.stage4_transport?.transporter ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Transporter:</span>
                            <span className="ml-2 font-medium">{workflow.stage4_transport.transporter}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Driver:</span>
                            <span className="ml-2 font-medium">{workflow.stage4_transport.driver || 'N/A'}</span>
                        </div>
                        {workflow.stage4_transport.truck && (
                            <div>
                                <span className="text-gray-600">Truck #:</span>
                                <span className="ml-2 font-medium">{workflow.stage4_transport.truck}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-600">Status:</span>
                            <span className="ml-2 font-medium">{workflow.stage4_transport.status || 'N/A'}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No transport assigned yet</p>
                )}

                {/* Action Button */}
                {!workflow.stage4_transport?.transporter &&
                    workflow.stage3_riteFoods?.status === 'LOADED' &&
                    workflow.stage2_payment?.balance === 0 && (
                        <div className="mt-4">
                            <Button onClick={() => setShowAssignTransport(true)} className="w-full">
                                <Truck className="h-4 w-4 mr-2" />
                                Assign Transport
                            </Button>
                        </div>
                    )}
            </StageCard>

            {/* Stage 5: Delivery */}
            <StageCard
                icon={<Package className="h-6 w-6" />}
                title="Stage 5: Delivery"
                status={getStageStatus('stage5_delivery')}
                statusText={workflow.stage5_delivery?.status || 'Pending'}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-xs text-blue-600 font-medium">Ordered</div>
                            <div className="text-lg font-bold text-blue-900">
                                {workflow.stage5_delivery?.ordered?.pallets || 0} pallets
                            </div>
                            <div className="text-sm text-blue-700">
                                {workflow.stage5_delivery?.ordered?.packs || 0} packs
                            </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-xs text-green-600 font-medium">Delivered</div>
                            <div className="text-lg font-bold text-green-900">
                                {workflow.stage5_delivery?.delivered?.pallets || 0} pallets
                            </div>
                            <div className="text-sm text-green-700">
                                {workflow.stage5_delivery?.delivered?.packs || 0} packs
                            </div>
                        </div>
                    </div>

                    {workflow.stage5_delivery?.deliveredAt && (
                        <div className="text-sm">
                            <span className="text-gray-600">Delivered On:</span>
                            <span className="ml-2 font-medium">
                                {new Date(workflow.stage5_delivery.deliveredAt).toLocaleString()}
                            </span>
                        </div>
                    )}
                    {workflow.stage5_delivery?.deliveredBy && (
                        <div className="text-sm">
                            <span className="text-gray-600">Delivered By:</span>
                            <span className="ml-2 font-medium">{workflow.stage5_delivery.deliveredBy}</span>
                        </div>
                    )}
                    {workflow.stage5_delivery?.notes && (
                        <div className="text-sm bg-gray-50 p-3 rounded-lg">
                            <span className="text-gray-600">Notes:</span>
                            <p className="mt-1">{workflow.stage5_delivery.notes}</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {workflow.stage4_transport?.transporter &&
                    workflow.stage5_delivery?.status === 'IN_TRANSIT' && (
                        <div className="mt-4">
                            <Button onClick={() => setShowRecordDelivery(true)} className="w-full">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Record Delivery
                            </Button>
                        </div>
                    )}
            </StageCard>

            {/* Customer & Location Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard title="Customer Information" icon={<Package />}>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Name:</dt>
                            <dd className="font-medium">{order.customer?.name || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Phone:</dt>
                            <dd className="font-medium">{order.customer?.phone || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Territory:</dt>
                            <dd className="font-medium">{order.customer?.territory || 'N/A'}</dd>
                        </div>
                    </dl>
                </InfoCard>

                <InfoCard title="Delivery Location" icon={<Package />}>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Location:</dt>
                            <dd className="font-medium">{order.location?.name || 'N/A'}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-gray-600">Address:</dt>
                            <dd className="font-medium">{order.location?.address || 'N/A'}</dd>
                        </div>
                    </dl>
                </InfoCard>
            </div>

            {/* Modals */}
            <RecordPaymentModal
                isOpen={showRecordPayment}
                onClose={() => setShowRecordPayment(false)}
                orderId={id!}
                balance={workflow.stage2_payment?.balance || order.finalAmount}
            />
            <ConfirmPaymentModal
                isOpen={showConfirmPayment}
                onClose={() => setShowConfirmPayment(false)}
                orderId={id!}
                orderDetails={order}
            />
            <PayRiteFoodsModal
                isOpen={showPayRiteFoods}
                onClose={() => setShowPayRiteFoods(false)}
                orderId={id!}
                amount={order.finalAmount}
            />
            <UpdateRiteFoodsStatusModal
                isOpen={showUpdateRFL}
                onClose={() => setShowUpdateRFL(false)}
                orderId={id!}
                currentStatus={workflow.stage3_riteFoods?.status}
            />
            <AssignTransportModal
                isOpen={showAssignTransport}
                onClose={() => setShowAssignTransport(false)}
                orderId={id!}
            />
            <RecordDeliveryModal
                isOpen={showRecordDelivery}
                onClose={() => setShowRecordDelivery(false)}
                orderId={id!}
                totalPallets={workflow.stage5_delivery?.ordered?.pallets || 0}
                totalPacks={workflow.stage5_delivery?.ordered?.packs || 0}
            />
        </div>
    );
};

// Helper Components
interface WorkflowTrackerProps {
    stages: {
        stage1: string;
        stage2: string;
        stage3: string;
        stage4: string;
        stage5: string;
    };
}

const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ stages }) => {
    const stageConfig = [
        { key: 'stage1', label: 'Order Created', icon: Package },
        { key: 'stage2', label: 'Payment', icon: DollarSign },
        { key: 'stage3', label: 'Rite Foods', icon: FileText },
        { key: 'stage4', label: 'Transport', icon: Truck },
        { key: 'stage5', label: 'Delivery', icon: CheckCircle },
    ];

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Order Workflow Progress</h3>
            <div className="flex items-center justify-between">
                {stageConfig.map((stage, index) => {
                    const status = stages[stage.key as keyof typeof stages];
                    const Icon = stage.icon;

                    return (
                        <React.Fragment key={stage.key}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${status === 'completed'
                                        ? 'bg-green-500 text-white'
                                        : status === 'current'
                                            ? 'bg-blue-500 text-white animate-pulse'
                                            : status === 'pending'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-300 text-gray-500'
                                        }`}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <span className="mt-2 text-xs font-medium text-center">{stage.label}</span>
                            </div>
                            {index < stageConfig.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded transition-all ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

interface StageCardProps {
    icon: React.ReactNode;
    title: string;
    status: string;
    statusText: string;
    children: React.ReactNode;
}

const StageCard: React.FC<StageCardProps> = ({ icon, title, status, statusText, children }) => {
    const statusColors = {
        completed: 'bg-green-50 border-green-200',
        current: 'bg-blue-50 border-blue-200',
        pending: 'bg-orange-50 border-orange-200',
        locked: 'bg-gray-50 border-gray-200',
    };

    const badgeColors = {
        completed: 'bg-green-100 text-green-800',
        current: 'bg-blue-100 text-blue-800',
        pending: 'bg-orange-100 text-orange-800',
        locked: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className={`border-2 rounded-lg p-6 ${statusColors[status as keyof typeof statusColors]}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="text-gray-700">{icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColors[status as keyof typeof badgeColors]}`}>
                    {statusText}
                </span>
            </div>
            {children}
        </div>
    );
};

interface InfoCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children }) => (
    <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
            {icon}
            <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {children}
    </div>
);