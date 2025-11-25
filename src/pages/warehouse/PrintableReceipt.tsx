/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';

interface PrintableReceiptProps {
    sale: any;
    onClose?: () => void;
}

const PrintableReceipt: React.FC<PrintableReceiptProps> = ({ sale, onClose }) => {
    useEffect(() => {
        setTimeout(() => {
            window.print();
            onClose?.();
        }, 500);
    }, [onClose]);

    if (!sale) return null;

    const formatCurrency = (amount: number) =>
        `₦${Number(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const totalAmount = Number(sale.totalAmount || 0);
    const totalDiscount = Number(sale.totalDiscountAmount || 0);

    const debtor = sale.debtor || null;
    const paymentStatus = sale.paymentStatus?.toUpperCase() || 'PAID';

    return (
        <div
            className="receipt-container"
            style={{
                width: '80mm',
                margin: '0 auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#000',
            }}
        >
            {/* HEADER */}
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold' }}>PREMIUM G ENTERPRISE</h2>
                <p>234, Asa-dam road, beside NEPA office Lanre shittu Motors, Ilorin Kwara state</p>
                <p>08060372182 ,08030753970</p>
                <p>Warehouse Division</p>

            </div>

            <hr />
            <p>Receipt No: {sale.receiptNumber}</p>
            <p>Date: {new Date(sale.createdAt).toLocaleString()}</p>
            <p>Sales Officer: {sale.salesOfficerUser?.username || 'N/A'}</p>
            <p>Customer: {sale.customerName || sale.warehouseCustomer?.name || 'Walk-in Customer'}</p>
            <hr />

            {/* ITEMS */}
            <table style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Item</th>
                        <th style={{ textAlign: 'right' }}>Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items?.map((item: any) => (
                        <tr key={item.id}>
                            <td style={{ textAlign: 'left' }}>
                                {item.product?.name}
                                <br />
                                <small>
                                    {item.quantity} × ₦
                                    {Number(item.unitPrice).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                    })}
                                </small>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                ₦{Number(item.totalAmount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr />
            {totalDiscount > 0 && (
                <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(totalDiscount)}</span>
                </p>
            )}
            <p
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 'bold',
                    fontSize: '13px',
                }}
            >
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
            </p>

            {/* OUTSTANDING SECTION */}
            {['CREDIT', 'PARTIAL'].includes(paymentStatus) && debtor && (
                <>
                    <hr />
                    <h4 style={{ textAlign: 'center', fontWeight: 'bold', margin: '6px 0' }}>
                        💳 Payment Summary
                    </h4>

                    <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Due:</span>
                        <span>{formatCurrency(debtor.amountDue + debtor.amountPaid)}</span>
                    </p>
                    <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Amount Paid:</span>
                        <span>{formatCurrency(debtor.amountPaid)}</span>
                    </p>
                    <p
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 'bold',
                            color: '#c00',
                        }}
                    >
                        <span>Outstanding:</span>
                        <span>{formatCurrency(debtor.amountDue)}</span>
                    </p>

                    {sale.creditDueDate && (
                        <p style={{ fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
                            Due Date: {new Date(sale.creditDueDate).toLocaleDateString()}
                            {new Date(sale.creditDueDate) < new Date() && debtor.amountDue > 0 && (
                                <strong style={{ color: 'red', marginLeft: '4px' }}>(OVERDUE)</strong>
                            )}
                        </p>
                    )}
                </>
            )}

            {/* FOOTER */}
            <hr />
            <p style={{ textAlign: 'center', fontSize: '10px' }}>
                Thank you for your business!
                <br />
                Goods sold are not returnable after 24 hours.
                <br />
                Powered by Premium G POS System
            </p>
        </div>
    );
};

export default PrintableReceipt;
