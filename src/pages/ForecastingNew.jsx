import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import AppIcon from '../components/AppIcon';
import './Forecasting.css';

const Forecasting = () => {
  const [view, setView] = useState('monthly'); // 'weekly' or 'monthly'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchForecastData();
  }, [view, selectedCategory]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ view });
      if (selectedCategory) params.append('categoryId', selectedCategory);
      
      const response = await fetch(`/api/forecasting?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecast data');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-AU').format(num);
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getTrendIcon = (direction) => {
    if (direction === 'up') return 'trendUp';
    if (direction === 'down') return 'trendDown';
    return 'trendFlat';
  };

  // Combine historical and forecast data for charts
  const getChartData = () => {
    if (!data) return [];
    
    const combined = [
      ...data.historical.map(h => ({
        ...h,
        isForecast: false,
      })),
      ...data.forecast.map((f, idx) => ({
        label: view === 'weekly' ? `+${f.period}W` : `+${f.period}M`,
        total_quantity: f.total_quantity,
        total_revenue: f.total_revenue,
        isForecast: true,
      })),
    ];
    
    return combined;
  };

  if (loading) {
    return (
      <div className="forecasting">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading forecast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecasting">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchForecastData} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const chartData = getChartData();

  return (
    <div className="forecasting">
      <div className="page-header">
        <h2 className="page-title">Sales Forecasting & Analytics</h2>
        
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'weekly' ? 'active' : ''}`}
            onClick={() => setView('weekly')}
          >
            <AppIcon name="calendar" className="icon-inline" />Weekly
          </button>
          <button
            className={`toggle-btn ${view === 'monthly' ? 'active' : ''}`}
            onClick={() => setView('monthly')}
          >
            <AppIcon name="calendar" className="icon-inline" />Monthly
          </button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon"><AppIcon name="revenue" /></div>
          <div className="metric-content">
            <div className="metric-label">Total Revenue ({view})</div>
            <div className="metric-value">{formatCurrency(data.metrics.totalRevenue)}</div>
            <div className={`metric-change ${data.metrics.growthRate >= 0 ? 'positive' : 'negative'}`}>
              {data.metrics.growthRate >= 0 ? '↑' : '↓'} {Math.abs(data.metrics.growthRate)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><AppIcon name="package" /></div>
          <div className="metric-content">
            <div className="metric-label">Total Units Sold</div>
            <div className="metric-value">{formatNumber(data.metrics.totalQuantity)}</div>
            <div className="metric-sublabel">Last {view === 'weekly' ? '12 weeks' : '12 months'}</div>
          </div>
        </div>

        <div className="metric-card forecast">
          <div className="metric-icon"><AppIcon name="chart" /></div>
          <div className="metric-content">
            <div className="metric-label">Forecast Revenue</div>
            <div className="metric-value">{formatCurrency(data.metrics.forecastRevenue)}</div>
            <div className={`metric-change ${data.metrics.forecastGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.metrics.forecastGrowth >= 0 ? '↑' : '↓'} {Math.abs(data.metrics.forecastGrowth)}%
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon"><AppIcon name="chart" /></div>
          <div className="metric-content">
            <div className="metric-label">Avg {view === 'weekly' ? 'Weekly' : 'Monthly'}</div>
            <div className="metric-value">{formatCurrency(data.metrics.avgRevenue)}</div>
            <div className="metric-sublabel">Per period</div>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">
            Sales Trend & Forecast
            <span className="view-badge">{view === 'weekly' ? 'Weekly' : 'Monthly'} View</span>
          </h3>
          <p className="chart-subtitle">
            Historical data (solid) vs Projected sales (dashed) • 
            Next {view === 'weekly' ? '4 weeks' : '3 months'}
          </p>
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b21a8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6b21a8" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="label" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="total_revenue"
              stroke="#6b21a8"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              name="Revenue"
              dot={{ fill: '#6b21a8', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot historical"></span>
            <span>Historical Data</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot forecast"></span>
            <span>Forecast (AI-powered)</span>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Category Performance Analysis</h3>
          <p className="chart-subtitle">Trends and forecasts by product category</p>
        </div>
        
        <div className="category-grid">
          {data.categoryPerformance.map((category, idx) => (
            <div key={idx} className="category-card">
              <div className="category-header">
                <h4>{category.name}</h4>
                <span className={`trend-badge ${category.trendDirection}`}>
                  <AppIcon name={getTrendIcon(category.trendDirection)} className="icon-inline" />{category.trend}%
                </span>
              </div>
              
              <div className="category-stats">
                <div className="stat">
                  <span className="stat-label">Total Sales</span>
                  <span className="stat-value">{formatNumber(category.total_quantity)} units</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value">{formatCurrency(category.total_revenue)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Forecast</span>
                  <span className="stat-value forecast-value">
                    {formatNumber(category.forecast)} units
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Confidence</span>
                  <span className={`confidence-badge ${category.confidence.toLowerCase()}`}>
                    {category.confidence}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Top Performing Products</h3>
          <p className="chart-subtitle">Best sellers in the last {view === 'weekly' ? '12 weeks' : '12 months'}</p>
        </div>
        
        <div className="top-products-list">
          {data.topProducts.slice(0, 5).map((product, idx) => (
            <div key={idx} className="product-item">
              <div className="product-rank">#{idx + 1}</div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-category">{product.category_name}</div>
              </div>
              <div className="product-stats">
                <div className="product-stat">
                  <span className="stat-value">{formatNumber(product.total_sold)}</span>
                  <span className="stat-label">units sold</span>
                </div>
                <div className="product-stat">
                  <span className="stat-value">{formatCurrency(product.total_revenue)}</span>
                  <span className="stat-label">revenue</span>
                </div>
              </div>
              <div className="product-stock">
                <span className={product.stock <= product.min_stock ? 'stock-low' : 'stock-ok'}>
                  {product.stock} in stock
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reorder Recommendations */}
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Smart Reorder Recommendations</h3>
          <p className="chart-subtitle">
            Based on {view === 'weekly' ? 'weekly' : 'monthly'} sales velocity and current stock levels
          </p>
        </div>
        
        <div className="reorder-table-wrapper">
          <table className="reorder-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Avg Daily Sales</th>
                <th>Days Left</th>
                <th>Suggested Reorder</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {data.reorderRecommendations.slice(0, 10).map((item, idx) => (
                <tr key={idx} className={item.days_left <= 3 ? 'urgent-row' : ''}>
                  <td>
                    <div className="product-cell">
                      <div className="product-name">{item.name}</div>
                      <div className="product-category">{item.category_name}</div>
                    </div>
                  </td>
                  <td className="stock-cell">
                    <span className={item.stock <= item.min_stock ? 'stock-critical' : ''}>
                      {item.stock} units
                    </span>
                  </td>
                  <td>{item.avg_daily_sales} units/day</td>
                  <td>
                    <span className={`days-left ${item.days_left <= 3 ? 'critical' : item.days_left <= 7 ? 'warning' : ''}`}>
                      {item.days_left === 999 ? 'N/A' : `${item.days_left} days`}
                    </span>
                  </td>
                  <td className="reorder-qty">{item.reorder_qty} units</td>
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

      {/* Insights */}
      <div className="insights-section">
        <h3 className="section-title">Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon"><AppIcon name="trendUp" /></div>
            <div className="insight-content">
              <h4>Growth Trend</h4>
              <p>
                {data.metrics.growthRate >= 0 ? 'Positive' : 'Negative'} growth of{' '}
                {Math.abs(data.metrics.growthRate)}% in recent periods
              </p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon"><AppIcon name="target" /></div>
            <div className="insight-content">
              <h4>Forecast Accuracy</h4>
              <p>
                {data.forecast[0]?.confidence || 'Medium'} confidence level for next period predictions
              </p>
            </div>
          </div>

          {data.reorderRecommendations.filter(r => r.priority === 'Urgent').length > 0 && (
            <div className="insight-card alert">
              <div className="insight-icon"><AppIcon name="alert" /></div>
              <div className="insight-content">
                <h4>Stock Alert</h4>
                <p>
                  {data.reorderRecommendations.filter(r => r.priority === 'Urgent').length} products
                  need urgent reordering
                </p>
              </div>
            </div>
          )}

          <div className="insight-card">
            <div className="insight-icon"><AppIcon name="idea" /></div>
            <div className="insight-content">
              <h4>Best Category</h4>
              <p>
                {data.categoryPerformance[0]?.name} leading with{' '}
                {formatCurrency(data.categoryPerformance[0]?.total_revenue)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
