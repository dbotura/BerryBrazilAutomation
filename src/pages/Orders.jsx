import { useEffect, useState } from 'react'
import DeliveryStatusButton from '../components/DeliveryStatusButton'
import InvoiceButton from '../components/InvoiceButton'
import { api } from '../lib/api'
import { formatCurrency, formatDate } from '../utils/currency'
import './Orders.css'

const emptyOrderForm = {
  customer: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  notes: '',
  paymentTerms: 'Due on receipt',
  dueDate: '',
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyOrderForm)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [lineItems, setLineItems] = useState([])

  useEffect(() => {
    loadOrdersPage()
  }, [])

  const loadOrdersPage = async () => {
    try {
      setLoading(true)
      setError('')
      const [orderRows, productRows] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
      ])
      setOrders(orderRows)
      setProducts(productRows)
      setSelectedProductId(productRows[0]?.id ? String(productRows[0].id) : '')
    } catch (loadError) {
      setError(loadError.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const openOrderForm = () => {
    setFormData(emptyOrderForm)
    setLineItems([])
    setSelectedProductId(products[0]?.id ? String(products[0].id) : '')
    setShowForm(true)
  }

  const closeOrderForm = () => {
    setShowForm(false)
    setFormData(emptyOrderForm)
    setLineItems([])
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const addLineItem = () => {
    const product = products.find((entry) => String(entry.id) === selectedProductId)
    if (!product) {
      return
    }

    setLineItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * Number(item.price),
              }
            : item
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: Number(product.price || 0),
          subtotal: Number(product.price || 0),
        },
      ]
    })
  }

  const updateLineItemQuantity = (productId, nextQuantity) => {
    setLineItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: nextQuantity,
                subtotal: nextQuantity * Number(item.price),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const handleCreateOrder = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      await api.createOrder({
        ...formData,
        dueDate: formData.dueDate || null,
        items: lineItems,
      })
      closeOrderForm()
      await loadOrdersPage()
    } catch (saveError) {
      setError(saveError.message || 'Failed to create order')
    } finally {
      setSaving(false)
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'saved':
        return 'status-saved'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-pending'
    }
  }

  return (
    <div className="orders">
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <p className="orders-subtitle">Live orders from the dev invoicing database</p>
        </div>
        <div className="orders-header-actions">
          <button className="btn btn-secondary" onClick={loadOrdersPage}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={openOrderForm}>
            + New Order
          </button>
        </div>
      </div>

      {error ? <div className="orders-message error">{error}</div> : null}
      {loading ? <div className="orders-message">Loading orders...</div> : null}

      {!loading && !error ? (
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="orders-message">No orders found in the current database branch.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">{formatDate(order.date)}</div>
                  </div>
                      <span className={`order-status ${getOrderStatusColor(order.status)}`}>
                    {order.status || 'saved'}
                  </span>
                </div>

                <div className="order-body">
                  <div className="order-customer">Customer: {order.customer || 'Unknown customer'}</div>
                  {order.customer_email ? (
                    <div className="order-meta">Email: {order.customer_email}</div>
                  ) : null}
                  {order.customer_phone ? (
                    <div className="order-meta">Phone: {order.customer_phone}</div>
                  ) : null}
                  <div className="order-details">
                    <span>{Number(order.item_count || 0)} items</span>
                    <span className="order-total">{formatCurrency(Number(order.total || 0))}</span>
                  </div>
                  <div className="order-details">
                    <span className="order-meta">
                      Delivery: {order.delivery_status || 'pending'}
                    </span>
                    {order.invoice_number ? (
                      <span className="order-meta">Invoice: {order.invoice_number}</span>
                    ) : (
                      <span className="order-meta">Invoice: not generated</span>
                    )}
                  </div>
                  <div className="order-actions">
                    <DeliveryStatusButton
                      orderId={order.id}
                      currentStatus={order.delivery_status || 'pending'}
                      onStatusChange={loadOrdersPage}
                    />
                    <InvoiceButton
                      orderId={order.id}
                      customerEmail={order.customer_email}
                      onSuccess={loadOrdersPage}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {showForm ? (
        <div className="modal-overlay" onClick={closeOrderForm}>
          <div className="modal-content order-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Create Test Order</h3>
            <form onSubmit={handleCreateOrder}>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleFieldChange}
                placeholder="Customer name"
                required
              />
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleFieldChange}
                placeholder="Customer email"
              />
              <input
                type="text"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleFieldChange}
                placeholder="Customer phone"
              />
              <input
                type="text"
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleFieldChange}
                placeholder="Customer address"
              />
              <input
                type="text"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleFieldChange}
                placeholder="Payment terms"
              />
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleFieldChange}
              />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFieldChange}
                placeholder="Notes"
                rows="3"
              />

              <div className="order-line-builder">
                <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({formatCurrency(Number(product.price || 0))})
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-secondary" onClick={addLineItem}>
                  Add Item
                </button>
              </div>

              <div className="order-line-items">
                {lineItems.length === 0 ? (
                  <div className="order-line-empty">Add at least one product to create an order.</div>
                ) : (
                  lineItems.map((item) => (
                    <div key={item.productId} className="order-line-item">
                      <div>
                        <div className="order-line-name">{item.productName}</div>
                        <div className="order-line-price">{formatCurrency(Number(item.price || 0))}</div>
                      </div>
                      <div className="order-line-controls">
                        <button type="button" onClick={() => updateLineItemQuantity(item.productId, item.quantity - 1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateLineItemQuantity(item.productId, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <div className="order-line-total">{formatCurrency(Number(item.subtotal || 0))}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="order-form-total">
                Total: {formatCurrency(lineItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeOrderForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || lineItems.length === 0}>
                  {saving ? 'Saving...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Orders
