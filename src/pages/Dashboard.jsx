import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AppIcon from '../components/AppIcon'
import { api } from '../lib/api'
import './Dashboard.css'

const formatCurrencyNoCents = (value = 0) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const Dashboard = () => {
  const [summary, setSummary] = useState({
    todaySales: 0,
    monthSales: 0,
    weekSales: 0,
    monthOrders: 0,
    monthCustomers: 0,
    lowStock: 0,
  })
  const [dailyMonthSales, setDailyMonthSales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      try {
        setLoading(true)
        const payload = await api.getDashboard()
        if (cancelled) return
        setSummary(payload.summary || {})
        setDailyMonthSales(payload.dailyMonthSales || [])
        setTopProducts(payload.topProducts || [])
        setTopCustomers(payload.topCustomers || [])
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const chartData = useMemo(() => dailyMonthSales.slice(-14), [dailyMonthSales])

  if (loading) {
    return (
      <div className="dashboard">
        <h2 className="page-title">Dashboard</h2>
        <div className="card">Loading dashboard data...</div>
      </div>
    )
  }
  
  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>

      {error ? <div className="card dashboard-error">{error}</div> : null}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><AppIcon name="revenue" /></div>
          <div className="stat-content">
            <div className="stat-label">Today's Sales</div>
            <div className="stat-value">{formatCurrencyNoCents(summary.todaySales || 0)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><AppIcon name="trendUp" /></div>
          <div className="stat-content">
            <div className="stat-label">Sales (Rolling 7 Days)</div>
            <div className="stat-value">{formatCurrencyNoCents(summary.weekSales || 0)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><AppIcon name="chart" /></div>
          <div className="stat-content">
            <div className="stat-label">Sales (Rolling 30 Days)</div>
            <div className="stat-value">{formatCurrencyNoCents(summary.monthSales || 0)}</div>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon"><AppIcon name="alert" /></div>
          <div className="stat-content">
            <div className="stat-label">Low Stock Items</div>
            <div className="stat-value">{summary.lowStock || 0}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid detail-grid">
        <div className="stat-card">
          <div className="stat-icon"><AppIcon name="clipboard" /></div>
          <div className="stat-content">
            <div className="stat-label">Orders (Rolling 30 Days)</div>
            <div className="stat-value">{summary.monthOrders || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><AppIcon name="customers" /></div>
          <div className="stat-content">
            <div className="stat-label">Customers (Rolling 30 Days)</div>
            <div className="stat-value">{summary.monthCustomers || 0}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="chart-header">
            <h3 className="chart-title">Sales Trend (Rolling 30 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrencyNoCents(value)} />
              <Bar dataKey="revenue" fill="#0f6f68" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="chart-header">
            <h3 className="chart-title">Best Sellers (Rolling 30 Days)</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr><td colSpan="3" className="table-empty">No sales in the last 30 days.</td></tr>
                ) : (
                  topProducts.map((row) => (
                    <tr key={`${row.productId}-${row.productName}`}>
                      <td>{row.productName}</td>
                      <td>{row.unitsSold}</td>
                      <td>{formatCurrencyNoCents(row.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="chart-header">
            <h3 className="chart-title">Best Customers (Rolling 30 Days)</h3>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Units</th>
                  <th>10kg Buckets</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length === 0 ? (
                  <tr><td colSpan="3" className="table-empty">No customer purchases in the last 30 days.</td></tr>
                ) : (
                  topCustomers.map((row) => (
                    <tr key={row.customerName}>
                      <td>{row.customerName}</td>
                      <td>{row.totalUnits}</td>
                      <td>{row.total10kgBuckets}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
