import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/currency'
import './PurchaseOrders.css'

const PurchaseOrders = () => {
  const [activeTab, setActiveTab] = useState('active')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [products] = useState([
    { id: 1, name: 'Açai Bowl 300g', currentStock: 45, reorderPoint: 50 },
    { id: 2, name: 'Açai Bowl 500g', currentStock: 32, reorderPoint: 40 },
    { id: 3, name: 'Açai Smoothie', currentStock: 28, reorderPoint: 35 },
    { id: 4, name: 'Açai Powder 100g', currentStock: 8, reorderPoint: 20 },
    { id: 5, name: 'Açai Frozen Pack 1kg', currentStock: 15, reorderPoint: 25 }
  ])
  
  const [purchaseOrders] = useState([
    {
      id: 'PO-001',
      poNumber: 'PO-2026-001',
      supplier: 'Açai Suppliers Ltd',
      orderDate: '2026-01-28',
      expectedDelivery: '2026-02-04',
      status: 'pending',
      items: [
        { product: 'Açai Bowl 300g', quantity: 100, unitCost: 8.50, total: 850.00 },
        { product: 'Açai Bowl 500g', quantity: 80, unitCost: 12.00, total: 960.00 }
      ],
      totalCost: 1810.00,
      daysUntilDelivery: 3
    },
    {
      id: 'PO-002',
      poNumber: 'PO-2026-002',
      supplier: 'Fresh Açai Co',
      orderDate: '2026-01-30',
      expectedDelivery: '2026-02-06',
      status: 'pending',
      items: [
        { product: 'Açai Powder 100g', quantity: 50, unitCost: 18.00, total: 900.00 }
      ],
      totalCost: 900.00,
      daysUntilDelivery: 5
    },
    {
      id: 'PO-003',
      poNumber: 'PO-2026-003',
      supplier: 'Açai Suppliers Ltd',
      orderDate: '2026-01-25',
      expectedDelivery: '2026-01-31',
      actualDelivery: '2026-01-31',
      status: 'received',
      items: [
        { product: 'Açai Frozen Pack 1kg', quantity: 40, unitCost: 22.00, total: 880.00 }
      ],
      totalCost: 880.00
    }
  ])
  
  const [newPO, setNewPO] = useState({
    supplier: '',
    expectedDelivery: '',
    items: [],
    notes: ''
  })
  
  const activePOs = purchaseOrders.filter(po => po.status === 'pending')
  const receivedPOs = purchaseOrders.filter(po => po.status === 'received')
  
  const getStatusClass = (status) => {
    switch(status) {
      case 'pending': return 'status-pending'
      case 'received': return 'status-received'
      case 'cancelled': return 'status-cancelled'
      default: return ''
    }
  }
  
  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Pending Delivery'
      case 'received': return 'Received'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }
  
  const handleCreatePO = (e) => {
    e.preventDefault()
    // Add PO creation logic - will save to DynamoDB
    alert('Purchase Order created!')
    setShowCreateForm(false)
    setNewPO({ supplier: '', expectedDelivery: '', items: [], notes: '' })
  }
  
  const handleReceivePO = (poId) => {
    // Mark PO as received and update stock
    alert(`PO ${poId} marked as received. Stock updated.`)
  }
  
  return (
    <div className="purchase-orders">
      <div className="page-header">
        <h2 className="page-title">Purchase Orders</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
          + Create PO
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="po-summary">
        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <div className="summary-label">Active POs</div>
            <div className="summary-value">{activePOs.length}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <div className="summary-label">Total Value</div>
            <div className="summary-value">
              {formatCurrency(activePOs.reduce((sum, po) => sum + po.totalCost, 0))}
            </div>
          </div>
        </div>
        
        <div className="summary-card alert">
          <div className="summary-icon">⏰</div>
          <div className="summary-content">
            <div className="summary-label">Due This Week</div>
            <div className="summary-value">
              {activePOs.filter(po => po.daysUntilDelivery <= 7).length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="po-tabs">
        <button 
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Orders ({activePOs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedPOs.length})
        </button>
      </div>
      
      {/* PO List */}
      <div className="po-list">
        {activeTab === 'active' && activePOs.map(po => (
          <div key={po.id} className="po-card">
            <div className="po-header">
              <div className="po-header-left">
                <h3 className="po-number">{po.poNumber}</h3>
                <div className="po-supplier">📍 {po.supplier}</div>
              </div>
              <div className="po-header-right">
                <span className={`po-status ${getStatusClass(po.status)}`}>
                  {getStatusLabel(po.status)}
                </span>
              </div>
            </div>
            
            <div className="po-dates">
              <div className="po-date-item">
                <span className="date-label">Ordered:</span>
                <span className="date-value">{formatDate(po.orderDate)}</span>
              </div>
              <div className="po-date-item">
                <span className="date-label">Expected:</span>
                <span className="date-value expected">
                  {formatDate(po.expectedDelivery)}
                  {po.daysUntilDelivery <= 3 && (
                    <span className="days-badge urgent">{po.daysUntilDelivery} days</span>
                  )}
                  {po.daysUntilDelivery > 3 && po.daysUntilDelivery <= 7 && (
                    <span className="days-badge">{po.daysUntilDelivery} days</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="po-items">
              <h4>Items:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="po-footer">
              <div className="po-total">
                <span>Total:</span>
                <span className="total-amount">R$ {po.totalCost.toFixed(2)}</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleReceivePO(po.poNumber)}
              >
                Mark as Received
              </button>
            </div>
          </div>
        ))}
        
        {activeTab === 'received' && receivedPOs.map(po => (
          <div key={po.id} className="po-card received">
            <div className="po-header">
              <div className="po-header-left">
                <h3 className="po-number">{po.poNumber}</h3>
                <div className="po-supplier">📍 {po.supplier}</div>
              </div>
              <div className="po-header-right">
                <span className={`po-status ${getStatusClass(po.status)}`}>
                  ✓ {getStatusLabel(po.status)}
                </span>
              </div>
            </div>
            
            <div className="po-dates">
              <div className="po-date-item">
                <span className="date-label">Ordered:</span>
                <span className="date-value">{formatDate(po.orderDate)}</span>
              </div>
              <div className="po-date-item">
                <span className="date-label">Received:</span>
                <span className="date-value">{formatDate(po.actualDelivery)}</span>
              </div>
            </div>
            
            <div className="po-items">
              <h4>Items:</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="po-footer">
              <div className="po-total">
                <span>Total:</span>
                <span className="total-amount">{formatCurrency(po.totalCost)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Create PO Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>Create Purchase Order</h3>
            <form onSubmit={handleCreatePO}>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <select 
                    value={newPO.supplier}
                    onChange={(e) => setNewPO({...newPO, supplier: e.target.value})}
                    required
                  >
                    <option value="">Select supplier...</option>
                    <option value="Açai Suppliers Ltd">Açai Suppliers Ltd</option>
                    <option value="Fresh Açai Co">Fresh Açai Co</option>
                    <option value="Premium Açai">Premium Açai</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Expected Delivery Date</label>
                  <input 
                    type="date"
                    value={newPO.expectedDelivery}
                    onChange={(e) => setNewPO({...newPO, expectedDelivery: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Products to Order</label>
                <div className="product-selector">
                  {products.map(product => (
                    <div key={product.id} className="product-select-item">
                      <input type="checkbox" id={`prod-${product.id}`} />
                      <label htmlFor={`prod-${product.id}`}>
                        {product.name}
                        <span className="stock-info">
                          (Current: {product.currentStock}, Reorder: {product.reorderPoint})
                        </span>
                      </label>
                      <input 
                        type="number" 
                        placeholder="Qty"
                        className="qty-input"
                        min="1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  value={newPO.notes}
                  onChange={(e) => setNewPO({...newPO, notes: e.target.value})}
                  placeholder="Delivery instructions, special requirements, etc."
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders
