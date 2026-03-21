import { useState } from 'react'
import './Stock.css'

const Stock = () => {
  const [stockItems] = useState([
    { id: 1, name: 'Açai Bowl 300g', current: 45, min: 20, status: 'ok' },
    { id: 2, name: 'Açai Bowl 500g', current: 32, min: 20, status: 'ok' },
    { id: 3, name: 'Açai Smoothie', current: 28, min: 20, status: 'ok' },
    { id: 4, name: 'Açai Powder 100g', current: 8, min: 15, status: 'low' },
    { id: 5, name: 'Açai Frozen Pack 1kg', current: 15, min: 10, status: 'ok' }
  ])
  
  return (
    <div className="stock">
      <h2 className="page-title">Stock Levels</h2>
      
      <div className="stock-list">
        {stockItems.map(item => (
          <div key={item.id} className={`stock-card ${item.status === 'low' ? 'low-stock' : ''}`}>
            <div className="stock-info">
              <h3 className="stock-name">{item.name}</h3>
              <div className="stock-levels">
                <div className="stock-current">
                  Current: <strong>{item.current}</strong>
                </div>
                <div className="stock-min">
                  Min: {item.min}
                </div>
              </div>
            </div>
            {item.status === 'low' && (
              <div className="stock-alert">⚠️ Low Stock</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stock
