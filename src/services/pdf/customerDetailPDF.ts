/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/pdf/customerDetailPDF.ts
import { WarehouseCustomer } from '../../types/warehouse';
import { CustomerPurchaseHistory } from '../warehouseService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface CustomerPDFData {
  customer: WarehouseCustomer;
  purchases: CustomerPurchaseHistory[];
  debtSummary?: any;
  insights?: any;
  summary?: any;
  filters: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
}

export const generateCustomerDetailPDF = async (data: CustomerPDFData): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // CRITICAL: Currency formatting function - use dot for decimals, comma for thousands
  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return 'N 0.00';
    
    // Format with proper separators: 1,250,000.00
    const formatted = numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `N ${formatted}`;
  };

  // Date formatting function
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to check and add new page
  const checkAndAddPage = (neededSpace: number = 20) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Helper function to add section title
  const addSectionTitle = (title: string) => {
    checkAndAddPage(15);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.text(title, 14, yPosition);
    yPosition += 10;
  };

  // Header
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Detail Report', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 30);

  // Period Filter Info
  if (data.filters.period || data.filters.startDate || data.filters.endDate) {
    let filterText = 'Period: ';
    if (data.filters.period) {
      filterText += data.filters.period;
    } else if (data.filters.startDate || data.filters.endDate) {
      filterText += `${data.filters.startDate || 'Beginning'} to ${data.filters.endDate || 'Now'}`;
    }
    doc.text(filterText, 14, 36);
  }

  yPosition = 50;

  // Customer Basic Information
  addSectionTitle('Customer Information');
  
  const customerInfo = [
    ['Name:', data.customer.name || 'N/A'],
    ['Phone:', data.customer.phone || 'N/A'],
    ['Email:', data.customer.email || 'N/A'],
    ['Address:', data.customer.address || 'N/A'],
    ['Customer Type:', data.customer.customerType || 'N/A'],
    ['Status:', data.customer.isActive ? 'Active' : 'Inactive'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: customerInfo,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Purchase Statistics
  addSectionTitle('Purchase Statistics');

  const stats = [
    ['Total Purchases:', (data.customer.totalPurchases || 0).toString()],
    ['Total Spent:', formatCurrency(data.customer.totalSpent || 0)],
    ['Average Order Value:', formatCurrency(data.customer.averageOrderValue || 0)],
    ['Outstanding Debt:', formatCurrency(data.customer.outstandingDebt || 0)],
    ['Credit Limit:', formatCurrency(data.customer.creditLimit || 0)],
    ['Payment Reliability:', `${data.customer.paymentReliabilityScore || 0}%`],
    ['Last Purchase:', data.customer.lastPurchaseDate 
      ? formatDate(data.customer.lastPurchaseDate)
      : 'Never'],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: stats,
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { 
        fontStyle: 'bold', 
        cellWidth: 70,
        textColor: [55, 65, 81], // Gray-700
      },
      1: { 
        cellWidth: 'auto', 
        halign: 'right',
        fontStyle: 'bold',
        textColor: [17, 24, 39], // Gray-900
      },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Period Summary (if filtered)
  if (data.summary) {
    checkAndAddPage(40);
    addSectionTitle('Period Summary');

    const periodStats = [
      ['Total Purchases in Period:', (data.summary.totalPurchases || 0).toString()],
      ['Total Spent in Period:', formatCurrency(data.summary.totalSpent || 0)],
      ['Average Order Value:', formatCurrency(data.summary.averageOrderValue || 0)],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: periodStats,
      theme: 'grid',
      styles: {
        fontSize: 11,
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [37, 99, 235],
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: 80,
          textColor: [55, 65, 81],
        },
        1: { 
          cellWidth: 'auto', 
          halign: 'right',
          fontStyle: 'bold',
          fontSize: 12,
          textColor: [22, 163, 74], // Green-600
        },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Top Products (if available)
  if (data.insights?.topProducts && data.insights.topProducts.length > 0) {
    checkAndAddPage(60);
    addSectionTitle('Top Purchased Products');

    const topProductsData = data.insights.topProducts.slice(0, 5).map((product: any) => [
      product.name || product.product?.name || 'N/A',
      product.productNo || product.product?.productNo || 'N/A',
      (product.purchase_count || product.purchaseCount || 0).toString(),
      (product.totalQuantity || 0).toString(),
      formatCurrency(product.totalSpent || 0),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Product Name', 'Product No', 'Purchases', 'Quantity', 'Total Spent']],
      body: topProductsData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 30 },
        2: { cellWidth: 23, halign: 'center' },
        3: { cellWidth: 23, halign: 'center' },
        4: { 
          cellWidth: 40, 
          halign: 'right',
          fontStyle: 'bold',
          textColor: [22, 163, 74], // Green-600
        },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Purchase History
  if (data.purchases && data.purchases.length > 0) {
    checkAndAddPage(60);
    addSectionTitle('Purchase History');

    const purchaseData = data.purchases.map((purchase) => {
      // Safely extract values with proper formatting
      const date = formatDate(purchase.createdAt);
      const receipt = purchase.receiptNumber || 'N/A';
      const product = purchase.product?.name || 'N/A';
      const quantity = `${purchase.quantity || 0} ${purchase.unitType || ''}`.trim();
      const unitPrice = formatCurrency(purchase.unitPrice || 0);
      const total = formatCurrency(purchase.totalAmount || 0);
      const discount = purchase.discountApplied && purchase.discountPercentage 
        ? `${purchase.discountPercentage}%` 
        : '-';
      const payment = purchase.paymentMethod || 'N/A';

      return [date, receipt, product, quantity, unitPrice, total, discount, payment];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Receipt', 'Product', 'Qty', 'Unit Price', 'Total', 'Disc.', 'Payment']],
      body: purchaseData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 22, fontSize: 7 },
        1: { cellWidth: 23, fontStyle: 'bold', fontSize: 7 },
        2: { cellWidth: 38, fontSize: 8 },
        3: { cellWidth: 18, halign: 'center', fontSize: 7 },
        4: { 
          cellWidth: 26, 
          halign: 'right', 
          fontStyle: 'bold',
          fontSize: 8,
        },
        5: { 
          cellWidth: 28, 
          halign: 'right', 
          fontStyle: 'bold',
          textColor: [17, 24, 39], // Gray-900
          fontSize: 8,
        },
        6: { 
          cellWidth: 15, 
          halign: 'center', 
          fontSize: 7, 
          textColor: [22, 163, 74], // Green-600
        },
        7: { cellWidth: 22, fontSize: 7, halign: 'center' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Debt Summary (if available)
  if (data.debtSummary) {
    checkAndAddPage(40);
    addSectionTitle('Debt Summary');

    const debtStats = [
      ['Total Debt:', formatCurrency(data.debtSummary.totalDebt || 0)],
      ['Amount Paid:', formatCurrency(data.debtSummary.totalPaid || 0)],
      ['Outstanding:', formatCurrency(data.debtSummary.outstandingAmount || 0)],
      ['Overdue:', formatCurrency(data.debtSummary.overdueAmount || 0)],
      ['Number of Debts:', (data.debtSummary.numberOfDebts || 0).toString()],
      ['Overdue Debts:', (data.debtSummary.overdueCount || 0).toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: debtStats,
      theme: 'striped',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { 
          fontStyle: 'bold', 
          cellWidth: 60,
          textColor: [55, 65, 81],
        },
        1: { 
          cellWidth: 'auto', 
          halign: 'right',
          fontStyle: 'bold',
          fontSize: 11,
        },
      },
      didParseCell: function(data: any) {
        // Color outstanding and overdue in red
        if (data.row.index === 2 || data.row.index === 3) {
          if (data.column.index === 1) {
            data.cell.styles.textColor = [220, 38, 38]; // Red-600
          }
        }
        // Color amount paid in green
        if (data.row.index === 1 && data.column.index === 1) {
          data.cell.styles.textColor = [22, 163, 74]; // Green-600
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1; // -1 because first element is null
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Premium G Enterprise Management System',
      14,
      pageHeight - 10
    );
  }

  return doc.output('blob');
};