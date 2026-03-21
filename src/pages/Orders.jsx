import { useState } from 'react'
import { formatCurrency, formatDate } from '../utils/currency'
import './Orders.css'

const Orders = () => {
  const [orders] = useState([
    {
      id: 'ORD-001',
      date: '2026-01-31',
      customer: 'João Silva',
      items: 3,
      total: 67.00,
      status: 'completed'
    },
    {
      id: 'ORD-002',
      date: '2026-01-31',
      customer: 'Maria Santos',
      items: 2,
      total: 37.00,
      status: 'pending'
    },
    {
      id: 'ORD-003',
      date: '2026-01-30',
      customer: 'Pedro Costa',
      items: 5,
      total: 125.00,
      status: 'completed'
    }
  ])
  
  const getStatusColor = (status) => {
    return status === 'completed' ? 'status-completed' : 'status-pending'
  }
  
  const getStatusLabel = (status) => {
    return status === 'completed' ? 'Completed' : 'Pending'
  }
  
  return (
    <div className="orders">
      <h2 className="page-title">Orders</h2>
      
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <div className="order-id">{order.id}</div>
                <div className="order-date">{formatDate(order.date)}</div>
              </div>
              <span className={`order-status ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            
            <div className="order-body">
              <div className="order-customer">👤 {order.customer}</div>
              <div className="order-details">
                <span>{order.items} items</span>
                <span className="order-total">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
