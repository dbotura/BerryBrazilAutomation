import { useState } from 'react'
import { formatCurrency } from '../utils/currency'
import './Sales.css'

const Sales = () => {
  const [cart, setCart] = useState([])
  const [products] = useState([
    { id: 1, name: 'Açai Bowl 300g', price: 15.00 },
    { id: 2, name: 'Açai Bowl 500g', price: 22.00 },
    { id: 3, name: 'Açai Smoothie', price: 12.00 },
    { id: 4, name: 'Açai Powder 100g', price: 35.00 },
    { id: 5, name: 'Açai Frozen Pack 1kg', price: 45.00 }
  ])
  
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }
  
  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const completeSale = () => {
    if (cart.length === 0) return
    // Add sale logic here - will save to DynamoDB
    alert(`Sale completed! Total: ${formatCurrency(total)}`)
    setCart([])
  }
  
  return (
    <div className="sales">
      <h2 className="page-title">New Sale</h2>
      
      <div className="sales-container">
        <div className="products-section">
          <h3>Select Products</h3>
          <div className="product-grid">
            {products.map(product => (
              <button
                key={product.id}
                className="product-btn"
                onClick={() => addToCart(product)}
              >
                <div className="product-btn-name">{product.name}</div>
                <div className="product-btn-price">{formatCurrency(product.price)}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="cart-section">
          <h3>Cart</h3>
          {cart.length === 0 ? (
            <div className="empty-cart">No items in cart</div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{formatCurrency(item.price)}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    <div className="cart-item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">{formatCurrency(total)}</span>
              </div>
              
              <button className="btn btn-primary btn-complete" onClick={completeSale}>
                Complete Sale
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sales
