import { useState } from 'react'
import AppIcon from '../components/AppIcon'
import { formatCurrency, formatDate } from '../utils/currency'
import './Reports.css'

const Reports = () => {
  const [reportType, setReportType] = useState('sales')
  const [dateRange, setDateRange] = useState('week')
  
  const salesData = [
    { date: '2026-01-31', sales: 15, revenue: 1250.50 },
    { date: '2026-01-30', sales: 22, revenue: 1875.00 },
    { date: '2026-01-29', sales: 18, revenue: 1450.00 }
  ]
  
  const stockMovements = [
    { date: '2026-01-31', product: 'Açai Bowl 300g', type: 'Receive', qty: 50, user: 'Warehouse' },
    { date: '2026-01-31', product: 'Açai Powder 100g', type: 'Adjustment', qty: -2, user: 'Manager' },
    { date: '2026-01-30', product: 'Açai Bowl 500g', type: 'Receive', qty: 30, user: 'Warehouse' }
  ]
  
  const exportReport = () => {
    alert('Report exported to CSV')
  }
  
  return (
    <div className="reports">
      <h2 className="page-title">Reports</h2>
      
      <div className="report-controls">
        <div className="control-group">
          <label>Report Type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="sales">Sales Report</option>
            <option value="stock">Stock Movements</option>
            <option value="inventory">Inventory Valuation</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Date Range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        <button className="btn btn-primary" onClick={exportReport}>
          <AppIcon name="download" className="icon-inline" />Export CSV
        </button>
      </div>
      
      <div className="report-content">
        {reportType === 'sales' && (
          <div className="report-table">
            <h3>Sales Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Transactions</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.sales}</td>
                    <td>{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{salesData.reduce((sum, r) => sum + r.sales, 0)}</strong></td>
                  <td><strong>{formatCurrency(salesData.reduce((sum, r) => sum + r.revenue, 0))}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        
        {reportType === 'stock' && (
          <div className="report-table">
            <h3>Stock Movement History</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((row, idx) => (
                  <tr key={idx}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.product}</td>
                    <td><span className={`movement-type ${row.type.toLowerCase()}`}>{row.type}</span></td>
                    <td className={row.qty > 0 ? 'positive' : 'negative'}>
                      {row.qty > 0 ? '+' : ''}{row.qty}
                    </td>
                    <td>{row.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
