import { useState, useEffect } from 'react';
import AppIcon from '../components/AppIcon';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const handleDownload = (pdfUrl, invoiceNumber) => {
    if (!pdfUrl) {
      alert('PDF not available for this invoice');
      return;
    }
    window.open(pdfUrl, '_blank');
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="invoices">
        <div className="loading">Loading invoices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoices">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="invoices">
      <div className="page-header">
        <h2 className="page-title">Invoice History</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-secondary" onClick={fetchInvoices}>
            <AppIcon name="refresh" className="icon-inline" />Refresh
          </button>
        </div>
      </div>

      <div className="invoices-stats">
        <div className="stat-card">
          <div className="stat-value">{invoices.length}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {invoices.filter(i => i.email_sent).length}
          </div>
          <div className="stat-label">Emails Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {invoices.filter(i => i.pdf_url).length}
          </div>
          <div className="stat-label">PDFs Stored</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {formatCurrency(
              invoices.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0)
            )}
          </div>
          <div className="stat-label">Total Value</div>
        </div>
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Generated</th>
              <th>Email Status</th>
              <th>PDF</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  {searchTerm ? 'No invoices match your search' : 'No invoices generated yet'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.invoice_number}</strong>
                  </td>
                  <td>
                    <div>{invoice.customer_name || 'N/A'}</div>
                    {invoice.customer_email && (
                      <div className="customer-email">{invoice.customer_email}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${invoice.type}`}>
                      <AppIcon name={invoice.type === 'order' ? 'package' : 'revenue'} className="icon-inline" />
                      {invoice.type === 'order' ? 'Order' : 'Sale'}
                    </span>
                  </td>
                  <td>
                    <strong>{formatCurrency(invoice.total)}</strong>
                  </td>
                  <td>
                    <div>{formatDate(invoice.generated_at)}</div>
                    {invoice.pdf_size_bytes && (
                      <div className="file-size">{formatFileSize(invoice.pdf_size_bytes)}</div>
                    )}
                  </td>
                  <td>
                    {invoice.email_sent ? (
                      <span className="status-badge status-success">
                        <AppIcon name="check" className="icon-inline" />Sent
                        {invoice.email_sent_at && (
                          <div className="status-time">
                            {formatDate(invoice.email_sent_at)}
                          </div>
                        )}
                      </span>
                    ) : invoice.email_error ? (
                      <span className="status-badge status-error" title={invoice.email_error}>
                        <AppIcon name="close" className="icon-inline" />Failed
                      </span>
                    ) : (
                      <span className="status-badge status-pending">
                        <AppIcon name="clock" className="icon-inline" />Pending
                      </span>
                    )}
                  </td>
                  <td>
                    {invoice.pdf_url ? (
                      <span className="status-badge status-success">
                        <AppIcon name="check" className="icon-inline" />Stored
                      </span>
                    ) : (
                      <span className="status-badge status-warning">
                        <AppIcon name="alert" className="icon-inline" />Not stored
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {invoice.pdf_url && (
                        <button
                          className="btn-icon"
                          onClick={() => handleDownload(invoice.pdf_url, invoice.invoice_number)}
                          title="Download PDF"
                        >
                          <AppIcon name="document" />
                        </button>
                      )}
                      {invoice.customer_email && (
                        <button
                          className="btn-icon"
                          onClick={() => alert('Resend feature coming soon!')}
                          title="Resend Email"
                        >
                          <AppIcon name="mail" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
