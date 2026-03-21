import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatDate } from '../utils/currency'
import './Forecasting.css'

const Forecasting = () => {
  const [timeframe, setTimeframe] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Sample historical data - will be replaced with real data from DynamoDB
  const [categories] = useState([
    { id: 1, name: 'Bowls', avgSales: 45 },
    { id: 2, name: 'Smoothies', avgSales: 28 },
    { id: 3, name: 'Powder', avgSales: 12 },
    { id: 4, name: 'Frozen Packs', avgSales: 15 }
  ])
  
  // Historical sales data (last 6 months)
  const historicalData = [
    { month: 'Aug', bowls: 320, smoothies: 180, powder: 85, frozen: 120 },
    { month: 'Sep', bowls: 340, smoothies: 195, powder: 90, frozen: 125 },
    { month: 'Oct', bowls: 380, smoothies: 210, powder: 95, frozen: 140 },
    { month: 'Nov', bowls: 420, smoothies: 230, powder: 105, frozen: 155 },
    { month: 'Dec', bowls: 480, smoothies: 260, powder: 120, frozen: 180 },
    { month: 'Jan', bowls: 450, smoothies: 245, powder: 110, frozen: 165 }
  ]
  
  // Forecast data (next 3 months) - calculated using simple trend analysis
  const forecastData = [
    { month: 'Feb', bowls: 465, smoothies: 252, powder: 115, frozen: 170, isForecast: true },
    { month: 'Mar', bowls: 480, smoothies: 260, powder: 120, frozen: 175, isForecast: true },
    { month: 'Apr', bowls: 495, smoothies: 268, powder: 125, frozen: 180, isForecast: true }
  ]
  
  const combinedData = [...historicalData, ...forecastData]
  
  // Category performance analysis
  const categoryAnalysis = [
    { 
      category: 'Bowls',
      avgMonthly: 398,
      trend: '+8.5%',
      forecast: 480,
      confidence: 'High',
      recommendation: 'Increase stock by 15%'
    },
    { 
      category: 'Smoothies',
      avgMonthly: 220,
      trend: '+7.2%',
      forecast: 260,
      confidence: 'High',
      recommendation: 'Maintain current levels'
    },
    { 
      category: 'Powder',
      avgMonthly: 101,
      trend: '+5.8%',
      forecast: 120,
      confidence: 'Medium',
      recommendation: 'Monitor closely'
    },
    { 
      category: 'Frozen Packs',
      avgMonthly: 148,
      trend: '+7.5%',
      forecast: 175,
      confidence: 'High',
      recommendation: 'Increase stock by 10%'
    }
  ]
  
  // Reorder recommendations with PO tracking
  const reorderRecommendations = [
    { 
      product: 'Açai Bowl 300g', 
      currentStock: 45, 
      avgDaily: 15, 
      daysLeft: 3, 
      reorderQty: 100, 
      priority: 'High',
      poStatus: 'On Order',
      poExpected: '2026-02-04',
      poQty: 100
    },
    { 
      product: 'Açai Bowl 500g', 
      currentStock: 32, 
      avgDaily: 12, 
      daysLeft: 3, 
      reorderQty: 80, 
      priority: 'High',
      poStatus: 'On Order',
      poExpected: '2026-02-04',
      poQty: 80
    },
    { 
      product: 'Açai Smoothie', 
      currentStock: 28, 
      avgDaily: 8, 
      daysLeft: 4, 
      reorderQty: 60, 
      priority: 'Medium',
      poStatus: null
    },
    { 
      product: 'Açai Powder 100g', 
      currentStock: 8, 
      avgDaily: 4, 
      daysLeft: 2, 
      reorderQty: 50, 
      priority: 'Urgent',
      poStatus: 'On Order',
      poExpected: '2026-02-06',
      poQty: 50
    },
    { 
      product: 'Açai Frozen Pack 1kg', 
      currentStock: 15, 
      avgDaily: 5, 
      daysLeft: 3, 
      reorderQty: 40, 
      priority: 'High',
      poStatus: null
    }
  ]
  
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Urgent': return 'priority-urgent'
      case 'High': return 'priority-high'
      case 'Medium': return 'priority-medium'
      default: return 'priority-low'
    }
  }
  
  return (
    <div className="forecasting">
      <h2 className="page-title">Sales Forecasting & Analytics</h2>
      
      <div className="forecast-controls">
        <div className="control-group">
          <label>Timeframe</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="week">Next Week</option>
            <option value="month">Next Month</option>
            <option value="quarter">Next Quarter</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Category</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="bowls">Bowls</option>
            <option value="smoothies">Smoothies</option>
            <option value="powder">Powder</option>
            <option value="frozen">Frozen Packs</option>
          </select>
        </div>
      </div>
      
      {/* Sales Trend Chart */}
      <div className="card">
        <h3 className="section-title">Sales Trend & Forecast</h3>
        <p className="chart-subtitle">Historical data (solid) vs Projected sales (dashed)</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bowls" 
              stroke="#6B46C1" 
              strokeWidth={2}
              strokeDasharray={forecastData.some(d => d.month) ? "5 5" : "0"}
              name="Bowls"
            />
            <Line 
              type="monotone" 
              dataKey="smoothies" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Smoothies"
            />
            <Line 
              type="monotone" 
              dataKey="powder" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Powder"
            />
            <Line 
              type="monotone" 
              dataKey="frozen" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Frozen Packs"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Category Performance */}
      <div className="card">
        <h3 className="section-title">Category Performance Analysis</h3>
        <div className="analysis-table">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Avg Monthly</th>
                <th>Trend</th>
                <th>Next Month Forecast</th>
                <th>Confidence</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {categoryAnalysis.map((item, idx) => (
                <tr key={idx}>
                  <td className="category-name">{item.category}</td>
                  <td>{item.avgMonthly} units</td>
                  <td className="trend-positive">{item.trend}</td>
                  <td className="forecast-value">{item.forecast} units</td>
                  <td>
                    <span className={`confidence ${item.confidence.toLowerCase()}`}>
                      {item.confidence}
                    </span>
                  </td>
                  <td className="recommendation">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Reorder Recommendations */}
      <div className="card">
        <h3 className="section-title">Smart Reorder Recommendations</h3>
        <p className="chart-subtitle">Based on current stock and sales velocity</p>
        <div className="reorder-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Avg Daily Sales</th>
                <th>Days Left</th>
                <th>Suggested Reorder</th>
                <th>PO Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {reorderRecommendations.map((item, idx) => (
                <tr key={idx}>
                  <td className="product-name">{item.product}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.avgDaily}</td>
                  <td className={item.daysLeft <= 3 ? 'days-critical' : ''}>
                    {item.daysLeft} days
                  </td>
                  <td className="reorder-qty">{item.reorderQty} units</td>
                  <td>
                    {item.poStatus ? (
                      <span className="po-status-badge">
                        ✓ {item.poQty} units
                        <br />
                        <small>Due: {formatDate(item.poExpected)}</small>
                      </span>
                    ) : (
                      <span className="no-po">No PO</span>
                    )}
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Key Insights */}
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">📈</div>
          <div className="insight-content">
            <h4>Growth Trend</h4>
            <p>Overall sales up 7.5% month-over-month</p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">⚡</div>
          <div className="insight-content">
            <h4>Fast Movers</h4>
            <p>Bowls category showing strongest growth</p>
          </div>
        </div>
        
        <div className="insight-card alert">
          <div className="insight-icon">⚠️</div>
          <div className="insight-content">
            <h4>Stock Alert</h4>
            <p>2 products need ordering (1 has active PO)</p>
          </div>
        </div>
        
        <div className="insight-card">
          <div className="insight-icon">💰</div>
          <div className="insight-content">
            <h4>Revenue Forecast</h4>
            <p>Projected $35,000 next month (+8%)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forecasting
