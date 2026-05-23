import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { formatCurrency } from '../utils/currency'
import './Products.css'

const emptyForm = {
  name: '',
  categoryId: '',
  price: '',
  stock: '',
  minStock: '',
  unit: 'kg',
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProductsPage()
  }, [])

  const loadProductsPage = async () => {
    try {
      setLoading(true)
      setError('')
      const [productRows, categoryRows] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ])
      setProducts(productRows)
      setCategories(categoryRows)
    } catch (loadError) {
      setError(loadError.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const openNewProductForm = () => {
    setEditingProduct(null)
    setFormData({
      ...emptyForm,
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    })
    setShowForm(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      categoryId: product.category_id ? String(product.category_id) : '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      minStock: product.min_stock ?? '',
      unit: product.unit || 'kg',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData(emptyForm)
  }

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      const payload = {
        name: formData.name.trim(),
        categoryId: Number(formData.categoryId),
        price: Number(formData.price || 0),
        stock: Number(formData.stock || 0),
        minStock: Number(formData.minStock || 0),
        unit: formData.unit.trim() || 'kg',
      }

      if (editingProduct) {
        await api.updateProduct({ ...payload, id: editingProduct.id })
      } else {
        await api.createProduct(payload)
      }

      await loadProductsPage()
      closeForm()
    } catch (saveError) {
      setError(saveError.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const categoryCountLabel = `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`
  const productCountLabel = `${products.length} ${products.length === 1 ? 'product' : 'products'}`

  return (
    <div className="products">
      <div className="page-header">
        <div>
          <h2 className="page-title">Products</h2>
          <p className="products-subtitle">
            {productCountLabel} across {categoryCountLabel}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNewProductForm}>
          + Add Product
        </button>
      </div>

      <div className="products-category-strip">
        {categories.map((category) => (
          <div key={category.id} className="category-pill">
            <span className="category-pill-name">{category.name}</span>
            <span className="category-pill-count">
              {products.filter((product) => product.category_id === category.id).length}
            </span>
          </div>
        ))}
      </div>

      {error ? <div className="products-message error">{error}</div> : null}
      {loading ? <div className="products-message">Loading products...</div> : null}

      {!loading && !error ? (
        <div className="products-list">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-info">
                <div className="product-topline">
                  <div className="product-category-badge">{product.category_name || 'Unassigned'}</div>
                  <span className={`product-stock ${product.stock <= product.min_stock ? 'low' : ''}`}>
                    Stock: {product.stock}
                  </span>
                </div>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-details">
                  <span className="product-price">{formatCurrency(Number(product.price || 0))}</span>
                  <span className="product-meta">Min: {product.min_stock}</span>
                  <span className="product-meta">Unit: {product.unit || 'kg'}</span>
                </div>
              </div>
              <button className="btn-edit" onClick={() => handleEdit(product)}>
                Edit
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showForm ? (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <h3>{editingProduct ? 'Edit Product' : 'New Product'}</h3>
            <form onSubmit={handleSave}>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFieldChange}
                placeholder="Product Name"
                required
              />
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleFieldChange}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleFieldChange}
                placeholder="Price ($)"
                required
              />
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleFieldChange}
                placeholder="Current Stock"
                required
              />
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleFieldChange}
                placeholder="Minimum Stock Level"
                required
              />
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleFieldChange}
                placeholder="Unit"
                required
              />
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Products
