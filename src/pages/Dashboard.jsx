import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../utils/currency'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    lowStock: 0
  })
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'bowls', name: 'Bowls' },
    { id: 'smoothies', name: 'Smoothies' },
    { id: 'powder', name: 'Powder' },
    { id: 'frozen', name: 'Frozen Packs' }
  ]
  
  // Sales data by category
  const salesDataByCategory = {
    all: [
      { day: 'Mon', sales: 45 },
      { day: 'Tue', sales: 52 },
      { day: 'Wed', sales: 48 },
      { day: 'Thu', sales: 61 },
      { day: 'Fri', sales: 73 },
      { day: 'Sat', sales: 85 },
      { day: 'Sun', sales: 55 }
    ],
    bowls: [
      { day: 'Mon', sales: 18 },
      { day: 'Tue', sales: 22 },
      { day: 'Wed', sales: 20 },
      { day: 'Thu', sales: 25 },
      { day: 'Fri', sales: 30 },
      { day: 'Sat', sales: 35 },
      { day: 'Sun', sales: 22 }
    ],
    smoothies: [
      { day: 'Mon', sales: 12 },
      { day: 'Tue', sales: 15 },
      { day: 'Wed', sales: 13 },
      { day: 'Thu', sales: 18 },
      { day: 'Fri', sales: 22 },
      { day: 'Sat', sales: 28 },
      { day: 'Sun', sales: 16 }
    ],
    powder: [
      { day: 'Mon', sales: 8 },
      { day: 'Tue', sales: 7 },
      { day: 'Wed', sales: 9 },
      { day: 'Thu', sales: 10 },
      { day: 'Fri', sales: 12 },
      { day: 'Sat', sales: 13 },
      { day: 'Sun', sales: 9 }
    ],
    frozen: [
      { day: 'Mon', sales: 7 },
      { day: 'Tue', sales: 8 },
      { day: 'Wed', sales: 6 },
      { day: 'Thu', sales: 8 },
      { day: 'Fri', sales: 9 },
      { day: 'Sat', sales: 9 },
      { day: 'Sun', sales: 8 }
    ]
  }
  
  const salesData = salesDataByCategory[selectedCategory]
  
  useEffect(() => {
    // Simulate loading stats - replace with actual API call
    setStats({
      todaySales: 1250.50,
      weekSales: 8750.00,
      monthSales: 32500.00,
      lowStock: 3
    })
  }, [])
  
  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Today's Sales</div>
            <div className="stat-value">{formatCurrency(stats.todaySales)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">This Week</div>
            <div className="stat-value">{formatCurrency(stats.weekSales)}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">This Month</div>
            <div className="stat-value">{formatCurrency(stats.monthSales)}</div>
          </div>
        </div>
        
        <div className="stat-card alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value">{stats.lowStock}</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="chart-header">
          <h3 className="chart-title">Weekly Sales</h3>
          <div className="chart-controls">
            <label htmlFor="category-select">Category:</label>
            <select 
              id="category-select"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#6B46C1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard
