import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #6b21a8',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    color: '#6b21a8',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  label: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  value: {
    fontSize: 11,
    color: '#333',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6b21a8',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    color: '#333',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #6b21a8',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderLeft: '3 solid #6b21a8',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#6b21a8',
  },
  notesText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
});

// Invoice PDF Document Component
export const InvoiceDocument = ({ invoice, company }) => {
  const h = React.createElement;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.1; // 10% GST
  const total = subtotal + tax;

  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(
        View,
        { style: styles.header },
        h(Text, { style: styles.companyName }, company.name),
        h(
          Text,
          { style: styles.companyDetails },
          `${company.address}\nPhone: ${company.phone}\nABN: ${company.taxId}`
        )
      ),
      h(Text, { style: styles.invoiceTitle }, 'TAX INVOICE'),
      h(
        View,
        { style: styles.row },
        h(
          View,
          { style: styles.column },
          h(Text, { style: styles.label }, 'BILL TO:'),
          h(Text, { style: styles.value }, invoice.customerName || 'Walk-in Customer'),
          invoice.customerEmail ? h(Text, { style: styles.companyDetails }, invoice.customerEmail) : null,
          invoice.customerPhone ? h(Text, { style: styles.companyDetails }, invoice.customerPhone) : null,
          invoice.customerAddress ? h(Text, { style: styles.companyDetails }, invoice.customerAddress) : null,
        ),
        h(
          View,
          { style: styles.column },
          h(
            View,
            { style: { marginBottom: 10 } },
            h(Text, { style: styles.label }, 'INVOICE NUMBER:'),
            h(Text, { style: styles.value }, invoice.invoiceNumber),
          ),
          h(
            View,
            { style: { marginBottom: 10 } },
            h(Text, { style: styles.label }, 'INVOICE DATE:'),
            h(Text, { style: styles.value }, formatDate(invoice.date)),
          ),
          invoice.dueDate
            ? h(
                View,
                { style: { marginBottom: 10 } },
                h(Text, { style: styles.label }, 'DUE DATE:'),
                h(Text, { style: styles.value }, formatDate(invoice.dueDate)),
              )
            : null,
          invoice.poNumber
            ? h(
                View,
                null,
                h(Text, { style: styles.label }, 'PO NUMBER:'),
                h(Text, { style: styles.value }, invoice.poNumber),
              )
            : null,
        ),
      ),
      h(
        View,
        { style: styles.table },
        h(
          View,
          { style: styles.tableHeader },
          h(Text, { style: styles.col1 }, 'DESCRIPTION'),
          h(Text, { style: styles.col2 }, 'QTY'),
          h(Text, { style: styles.col3 }, 'UNIT PRICE'),
          h(Text, { style: styles.col4 }, 'TAX'),
          h(Text, { style: styles.col5 }, 'AMOUNT'),
        ),
        ...invoice.items.map((item, index) =>
          h(
            View,
            { key: index, style: index % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
            h(Text, { style: styles.col1 }, item.productName),
            h(Text, { style: styles.col2 }, String(item.quantity)),
            h(Text, { style: styles.col3 }, formatCurrency(item.price)),
            h(Text, { style: styles.col4 }, 'GST'),
            h(Text, { style: styles.col5 }, formatCurrency(item.subtotal)),
          )
        ),
      ),
      h(
        View,
        { style: styles.totalsSection },
        h(
          View,
          { style: styles.totalRow },
          h(Text, { style: styles.totalLabel }, 'Subtotal:'),
          h(Text, { style: styles.totalValue }, formatCurrency(subtotal)),
        ),
        h(
          View,
          { style: styles.totalRow },
          h(Text, { style: styles.totalLabel }, 'GST (10%):'),
          h(Text, { style: styles.totalValue }, formatCurrency(tax)),
        ),
        h(
          View,
          { style: styles.grandTotalRow },
          h(Text, { style: styles.grandTotalLabel }, 'TOTAL:'),
          h(Text, { style: styles.grandTotalValue }, formatCurrency(total)),
        ),
      ),
      invoice.notes
        ? h(
            View,
            { style: styles.notes },
            h(Text, { style: styles.notesTitle }, 'Notes:'),
            h(Text, { style: styles.notesText }, invoice.notes),
          )
        : null,
      h(
        View,
        { style: styles.footer },
        h(Text, null, `Thank you for your business!\nPayment terms: ${invoice.paymentTerms || 'Due on receipt'}`)
      ),
    )
  );
};

export default InvoiceDocument;
