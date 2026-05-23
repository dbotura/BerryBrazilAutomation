import { useState } from 'react'
import AppIcon from '../components/AppIcon'
import './Warehouse.css'

const Warehouse = () => {
  const [activeTab, setActiveTab] = useState('receive')
  const [products] = useState([
    { id: 1, name: 'Açai Bowl 300g', stock: 45 },
    { id: 2, name: 'Açai Bowl 500g', stock: 32 },
    { id: 3, name: 'Açai Smoothie', stock: 28 },
    { id: 4, name: 'Açai Powder 100g', stock: 8 },
    { id: 5, name: 'Açai Frozen Pack 1kg', stock: 15 }
  ])
  
  const [receiveForm, setReceiveForm] = useState({
    productId: '',
    quantity: '',
    notes: ''
  })
  
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    newQuantity: '',
    reason: ''
  })
  
  const handleReceive = (e) => {
    e.preventDefault()
    // Add receive logic - will update DynamoDB
    alert(`Received ${receiveForm.quantity} units`)
    setReceiveForm({ productId: '', quantity: '', notes: '' })
  }
  
  const handleAdjust = (e) => {
    e.preventDefault()
    // Add adjustment logic - will update DynamoDB
    alert(`Stock adjusted to ${adjustForm.newQuantity} units`)
    setAdjustForm({ productId: '', newQuantity: '', reason: '' })
  }
  
  const handleStockCount = () => {
    // Generate stock count report
    alert('Stock count report generated')
  }
  
  return (
    <div className="warehouse">
      <h2 className="page-title">Warehouse Management</h2>
      
      <div className="warehouse-tabs">
        <button 
          className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`}
          onClick={() => setActiveTab('receive')}
        >
          <AppIcon name="package" className="icon-inline" />Receive Stock
        </button>
        <button 
          className={`tab-btn ${activeTab === 'adjust' ? 'active' : ''}`}
          onClick={() => setActiveTab('adjust')}
        >
          <AppIcon name="edit" className="icon-inline" />Adjust Stock
        </button>
        <button 
          className={`tab-btn ${activeTab === 'count' ? 'active' : ''}`}
          onClick={() => setActiveTab('count')}
        >
          <AppIcon name="clipboard" className="icon-inline" />Stock Count
        </button>
      </div>
      
      <div className="warehouse-content">
        {activeTab === 'receive' && (
          <div className="warehouse-panel">
            <h3>Receive Incoming Stock</h3>
            <form onSubmit={handleReceive} className="warehouse-form">
              <div className="form-group">
                <label>Product</label>
                <select 
                  value={receiveForm.productId}
                  onChange={(e) => setReceiveForm({...receiveForm, productId: e.target.value})}
                  required
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantity Received</label>
                <input 
                  type="number" 
                  min="1"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({...receiveForm, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({...receiveForm, notes: e.target.value})}
                  placeholder="Supplier, batch number, etc."
                  rows="3"
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-large">
                Receive Stock
              </button>
            </form>
          </div>
        )}
        
        {activeTab === 'adjust' && (
          <div className="warehouse-panel">
            <h3>Stock Adjustment / Correction</h3>
            <form onSubmit={handleAdjust} className="warehouse-form">
              <div className="form-group">
                <label>Product</label>
                <select 
                  value={adjustForm.productId}
                  onChange={(e) => {
                    const product = products.find(p => p.id === parseInt(e.target.value))
                    setAdjustForm({...adjustForm, productId: e.target.value})
                  }}
                  required
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              
              {adjustForm.productId && (
                <div className="current-stock-info">
                  Current Stock: <strong>
                    {products.find(p => p.id === parseInt(adjustForm.productId))?.stock || 0}
                  </strong> units
                </div>
              )}
              
              <div className="form-group">
                <label>New Quantity</label>
                <input 
                  type="number" 
                  min="0"
                  value={adjustForm.newQuantity}
                  onChange={(e) => setAdjustForm({...adjustForm, newQuantity: e.target.value})}
                  placeholder="Enter correct quantity"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Reason for Adjustment</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="count">Physical Count Correction</option>
                  <option value="damage">Damaged/Expired Items</option>
                  <option value="theft">Loss/Theft</option>
                  <option value="error">Data Entry Error</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary btn-large">
                Update Stock
              </button>
            </form>
          </div>
        )}
        
        {activeTab === 'count' && (
          <div className="warehouse-panel">
            <h3>Physical Stock Count</h3>
            <p className="count-instructions">
              Use this to perform a physical inventory count and compare with system records.
            </p>
            
            <div className="count-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>System Stock</th>
                    <th>Physical Count</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td className="system-stock">{product.stock}</td>
                      <td>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Count..."
                          className="count-input"
                        />
                      </td>
                      <td className="variance">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="count-actions">
              <button className="btn btn-secondary" onClick={handleStockCount}>
                Export Report
              </button>
              <button className="btn btn-primary">
                Apply Adjustments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Warehouse
