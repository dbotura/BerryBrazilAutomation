import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyDetails}>
            {company.address}{'\n'}
            Phone: {company.phone}{'\n'}
            ABN: {company.taxId}
          </Text>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>TAX INVOICE</Text>

        {/* Invoice Details and Customer Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>BILL TO:</Text>
            <Text style={styles.value}>{invoice.customerName || 'Walk-in Customer'}</Text>
            {invoice.customerEmail && (
              <Text style={styles.companyDetails}>{invoice.customerEmail}</Text>
            )}
            {invoice.customerPhone && (
              <Text style={styles.companyDetails}>{invoice.customerPhone}</Text>
            )}
            {invoice.customerAddress && (
              <Text style={styles.companyDetails}>{invoice.customerAddress}</Text>
            )}
          </View>

          <View style={styles.column}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>INVOICE NUMBER:</Text>
              <Text style={styles.value}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.label}>INVOICE DATE:</Text>
              <Text style={styles.value}>{formatDate(invoice.date)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.label}>DUE DATE:</Text>
                <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
            {invoice.poNumber && (
              <View>
                <Text style={styles.label}>PO NUMBER:</Text>
                <Text style={styles.value}>{invoice.poNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>DESCRIPTION</Text>
            <Text style={styles.col2}>QTY</Text>
            <Text style={styles.col3}>UNIT PRICE</Text>
            <Text style={styles.col4}>TAX</Text>
            <Text style={styles.col5}>AMOUNT</Text>
          </View>

          {/* Table Rows */}
          {invoice.items.map((item, index) => (
            <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.col1}>{item.productName}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.price)}</Text>
              <Text style={styles.col4}>GST</Text>
              <Text style={styles.col5}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST (10%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for your business!{'\n'}
            Payment terms: {invoice.paymentTerms || 'Due on receipt'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;
