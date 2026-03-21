import { useState } from 'react';

const InvoiceButton = ({ orderId, saleId, customerEmail, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateInvoice = async () => {
    if (!customerEmail) {
      alert('Customer email is required to send invoice');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          saleId,
          sendEmail: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate invoice');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId || saleId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Invoice generated and sent to ${customerEmail}!`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Invoice generation error:', err);
      setError(err.message);
      alert(`Failed to generate invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={handleGenerateInvoice}
        disabled={loading || !customerEmail}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#6b21a8',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading || !customerEmail ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        title={!customerEmail ? 'Customer email required' : 'Generate and send invoice'}
      >
        {loading ? (
          <>
            <span>⏳</span>
            <span>Generating...</span>
          </>
        ) : (
          <>
            <span>📄</span>
            <span>Generate Invoice</span>
          </>
        )}
      </button>
      {error && (
        <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default InvoiceButton;
