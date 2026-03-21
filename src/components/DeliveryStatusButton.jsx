import { useState } from 'react';

const DeliveryStatusButton = ({ orderId, currentStatus, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const statuses = [
    { value: 'pending', label: 'Pending', color: '#f59e0b', icon: '⏳' },
    { value: 'in_transit', label: 'In Transit', color: '#3b82f6', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', color: '#10b981', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444', icon: '❌' },
  ];

  const currentStatusObj = statuses.find(s => s.value === currentStatus) || statuses[0];

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setShowConfirm(false);

    try {
      const response = await fetch('/api/update-order-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          deliveryDate: newStatus === 'delivered' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const data = await response.json();
      
      if (newStatus === 'delivered') {
        alert('Order marked as delivered! Invoice has been generated and sent to customer.');
      } else {
        alert(`Order status updated to: ${newStatus}`);
      }

      if (onStatusChange) {
        onStatusChange(data.order);
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: currentStatusObj.color,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '140px',
        }}
      >
        <span>{currentStatusObj.icon}</span>
        <span>{currentStatusObj.label}</span>
        <span style={{ marginLeft: 'auto' }}>▼</span>
      </button>

      {showConfirm && !loading && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '180px',
          }}
        >
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              disabled={status.value === currentStatus}
              style={{
                width: '100%',
                padding: '10px 16px',
                backgroundColor: status.value === currentStatus ? '#f3f4f6' : 'white',
                border: 'none',
                borderBottom: '1px solid #e5e7eb',
                cursor: status.value === currentStatus ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                if (status.value !== currentStatus) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (status.value !== currentStatus) {
                  e.target.style.backgroundColor = 'white';
                }
              }}
            >
              <span>{status.icon}</span>
              <span style={{ color: status.color, fontWeight: 'bold' }}>
                {status.label}
              </span>
              {status.value === 'delivered' && (
                <span style={{ fontSize: '10px', color: '#666', marginLeft: 'auto' }}>
                  (Sends invoice)
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};

export default DeliveryStatusButton;
