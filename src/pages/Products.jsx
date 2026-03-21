import { useState } from 'react'
import { formatCurrency } from '../utils/currency'
import './Products.css'

const Products = () => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Açai Bowl 300g', price: 15.00, stock: 45, category: 'Bowls' },
    { id: 2, name: 'Açai Bowl 500g', price: 22.00, stock: 32, category: 'Bowls' },
    { id: 3, name: 'Açai Smoothie', price: 12.00, stock: 28, category: 'Smoothies' },
    { id: 4, name: 'Açai Powder 100g', price: 35.00, stock: 8, category: 'Powder' },
    { id: 5, name: 'Açai Frozen Pack 1kg', price: 45.00, stock: 15, category: 'Frozen Packs' }
  ])
  
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }
  
  const handleSave = (e) => {
    e.preventDefault()
    // Add save logic here - will connect to DynamoDB
    setShowForm(false)
    setEditingProduct(null)
  }
  
  return (
    <div className="products">
      <div className="page-header">
        <h2 className="page-title">Products</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Product
        </button>
      </div>
      
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSave}>
              <input type="text" placeholder="Product Name" required />
              <input 
                type="text" 
                placeholder="Category (e.g., Bowls, Smoothies, Powder)" 
                required 
              />
              <input type="number" step="0.01" placeholder="Price ($)" required />
              <input type="number" placeholder="Initial Stock" required />
              <input type="number" placeholder="Minimum Stock Level" required />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="products-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-info">
              <div className="product-category-badge">{product.category}</div>
              <h3 className="product-name">{product.name}</h3>
              <div className="product-details">
                <span className="product-price">{formatCurrency(product.price)}</span>
                <span className={`product-stock ${product.stock < 10 ? 'low' : ''}`}>
                  Stock: {product.stock}
                </span>
              </div>
            </div>
            <button className="btn-edit" onClick={() => handleEdit(product)}>
              ✏️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Products
