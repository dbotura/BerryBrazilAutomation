import { useState, useEffect } from 'react';
import './GrowthProjections.css';

const GrowthProjections = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'product'
  const [editingMonth, setEditingMonth] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProjections();
  }, []);

  const fetchProjections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/growth-projections?months=24');
      if (!response.ok) throw new Error('Failed to fetch projections');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      alert('Failed to load projections');
    } finally {
      setLoading(false);
    }
  };

  const generateNext24Months = () => {
    const months = [];
    for (let i = 1; i <= 24; i++) { // Start from next month (i=1), go up to 24 months
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      date.setDate(1);
      months.push(date);
    }
    return months;
  };

  const formatMonth = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getProjectionForMonth = (monthDate) => {
    if (!data?.customerProjections) return null;
    return data.customerProjections.find(p => {
      const pDate = new Date(p.projection_month);
      const mDate = new Date(monthDate);
      return pDate.getFullYear() === mDate.getFullYear() && 
             pDate.getMonth() === mDate.getMonth();
    });
  };

  const handleSaveProjection = async (monthDate, newCustomers, notes = '') => {
    try {
      const response = await fetch('/api/growth-projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer_growth',
          data: {
            projection_month: monthDate.toISOString().split('T')[0],
            new_customers_count: parseInt(newCustomers) || 0,
            churned_customers_count: 0,
            notes,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save projection');
      
      await fetchProjections();
      setEditingMonth(null);
      setFormData({});
    } catch (err) {
      console.error(err);
      alert('Failed to save projection');
    }
  };

  const handleSaveProductMetric = async (categoryId, productId, avgMonthly, notes = '') => {
    try {
      const response = await fetch('/api/growth-projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product_metrics',
          data: {
            category_id: categoryId,
            product_id: productId,
            avg_units_per_customer_monthly: parseFloat(avgMonthly) || 0,
            notes,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save metric');
      
      await fetchProjections();
      alert('Product metric saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save metric');
    }
  };

  const calculateCumulativeCustomers = () => {
    if (!data?.customerProjections) return [];
    
    let cumulative = data.currentCustomerBase?.total_customers || 0;
    const months = generateNext24Months(); // Use 24 months
    
    return months.map(month => {
      const projection = getProjectionForMonth(month);
      if (projection) {
        cumulative += parseInt(projection.new_customers_count) || 0;
        cumulative -= parseInt(projection.churned_customers_count) || 0;
      }
      return {
        month,
        cumulative,
        new: projection?.new_customers_count || 0,
      };
    });
  };

  const calculateProjectedSales = () => {
    if (!data?.productMetrics || !data?.customerProjections) return [];
    
    const cumulativeCustomers = calculateCumulativeCustomers();
    
    return cumulativeCustomers.map(({ month, cumulative, new: newCustomers }) => {
      let totalUnits = 0;
      
      data.productMetrics.forEach(metric => {
        const avgMonthly = parseFloat(metric.avg_units_per_customer_monthly) || 0;
        totalUnits += cumulative * avgMonthly;
      });
      
      return {
        month: formatMonth(month),
        totalUnits: Math.round(totalUnits),
        customers: cumulative,
        newCustomers,
      };
    });
  };

  if (loading) {
    return (
      <div className="growth-projections">
        <div className="loading">Loading projections...</div>
      </div>
    );
  }

  const months = generateNext24Months(); // 24 months starting from next month
  const cumulativeData = calculateCumulativeCustomers();
  const projectedSales = calculateProjectedSales();

  return (
    <div className="growth-projections">
      <div className="page-header">
        <h2 className="page-title">Growth Projections</h2>
        <p className="page-subtitle">
          Plan customer acquisition and forecast future sales
        </p>
      </div>

      {/* Current Status */}
      <div className="status-cards">
        <div className="status-card">
          <div className="status-icon">👥</div>
          <div className="status-content">
            <div className="status-label">Current Customer Base</div>
            <div className="status-value">
              {data?.currentCustomerBase?.total_customers || 0}
            </div>
            <div className="status-sublabel">Active customers</div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon">📈</div>
          <div className="status-content">
            <div className="status-label">Projected in 24 Months</div>
            <div className="status-value">
              {cumulativeData[23]?.cumulative || 0}
            </div>
            <div className="status-sublabel">
              +{cumulativeData[23]?.cumulative - (data?.currentCustomerBase?.total_customers || 0)} customers
            </div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon">📦</div>
          <div className="status-content">
            <div className="status-label">Product Lines Configured</div>
            <div className="status-value">
              {data?.productMetrics?.length || 0}
            </div>
            <div className="status-sublabel">With avg units/customer</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          👥 Customer Projections
        </button>
        <button
          className={`tab ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          📦 Product Metrics
        </button>
        <button
          className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          🔮 Sales Forecast
        </button>
      </div>

      {/* Customer Projections Tab */}
      {activeTab === 'customer' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>Monthly Customer Acquisition Plan</h3>
            <p>Enter the number of new customers expected each month (next month through 24 months ahead)</p>
          </div>

          <div className="projections-table-wrapper">
            <table className="projections-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>New Customers</th>
                  <th>Cumulative Total</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, idx) => {
                  const projection = getProjectionForMonth(month);
                  const cumulative = cumulativeData[idx];
                  const isEditing = editingMonth === month.toISOString();

                  return (
                    <tr key={idx} className={idx === 0 ? 'next-month-row' : ''}>
                      <td className="month-cell">
                        <strong>{formatMonth(month)}</strong>
                        {idx === 0 && <span className="next-month-badge">Next Month</span>}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={formData.newCustomers || projection?.new_customers_count || 0}
                            onChange={(e) => setFormData({ ...formData, newCustomers: e.target.value })}
                            className="input-small"
                            autoFocus
                          />
                        ) : (
                          <span className="customer-count">
                            {projection?.new_customers_count || 0} customers
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="cumulative-count">
                          {cumulative?.cumulative || 0} total
                        </span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.notes || projection?.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Optional notes..."
                            className="input-notes"
                          />
                        ) : (
                          <span className="notes-text">{projection?.notes || '-'}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="action-buttons">
                            <button
                              className="btn-save"
                              onClick={() => handleSaveProjection(month, formData.newCustomers, formData.notes)}
                            >
                              ✓ Save
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => {
                                setEditingMonth(null);
                                setFormData({});
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setEditingMonth(month.toISOString());
                              setFormData({
                                newCustomers: projection?.new_customers_count || 0,
                                notes: projection?.notes || '',
                              });
                            }}
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Metrics Tab */}
      {activeTab === 'product' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>Average Units per Customer</h3>
            <p>Set the average monthly units each customer buys per product/category</p>
          </div>

          <div className="product-metrics-grid">
            {data?.productMetrics?.map((metric, idx) => (
              <div key={idx} className="metric-card">
                <div className="metric-header">
                  <h4>{metric.product_name || metric.category_name}</h4>
                  <span className="metric-type">
                    {metric.product_name ? '📦 Product' : '📁 Category'}
                  </span>
                </div>
                <div className="metric-values">
                  <div className="metric-value-item">
                    <label>Monthly Avg</label>
                    <div className="value-display">
                      {parseFloat(metric.avg_units_per_customer_monthly).toFixed(1)} units
                    </div>
                  </div>
                  <div className="metric-value-item">
                    <label>Weekly Avg</label>
                    <div className="value-display">
                      {parseFloat(metric.avg_units_per_customer_weekly).toFixed(1)} units
                    </div>
                  </div>
                </div>
                {metric.notes && (
                  <div className="metric-notes">{metric.notes}</div>
                )}
                <button className="btn-edit-metric">✏️ Edit</button>
              </div>
            ))}

            <div className="metric-card add-new">
              <div className="add-new-content">
                <div className="add-icon">+</div>
                <div>Add Product Metric</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="tab-content">
          <div className="section-header">
            <h3>Projected Sales Based on Customer Growth</h3>
            <p>Calculated from customer projections × average units per customer</p>
          </div>

          <div className="forecast-table-wrapper">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Customers</th>
                  <th>New Customers</th>
                  <th>Projected Units</th>
                  <th>Growth vs Previous</th>
                </tr>
              </thead>
              <tbody>
                {projectedSales.map((item, idx) => {
                  const prevUnits = idx > 0 ? projectedSales[idx - 1].totalUnits : 0;
                  const growth = prevUnits > 0 
                    ? ((item.totalUnits - prevUnits) / prevUnits * 100).toFixed(1)
                    : 0;

                  return (
                    <tr key={idx}>
                      <td><strong>{item.month}</strong></td>
                      <td>{item.customers}</td>
                      <td>
                        {item.newCustomers > 0 && (
                          <span className="new-customers-badge">
                            +{item.newCustomers}
                          </span>
                        )}
                      </td>
                      <td className="units-cell">
                        <strong>{item.totalUnits.toLocaleString()}</strong> units
                      </td>
                      <td>
                        {idx > 0 && (
                          <span className={`growth-badge ${growth >= 0 ? 'positive' : 'negative'}`}>
                            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="forecast-summary">
            <div className="summary-card">
              <div className="summary-label">Total Projected Growth (24 months)</div>
              <div className="summary-value">
                {projectedSales.length > 0 && (
                  <>
                    {((projectedSales[23].totalUnits / projectedSales[0].totalUnits - 1) * 100).toFixed(1)}%
                  </>
                )}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">24-Month Projection</div>
              <div className="summary-value">
                {projectedSales[23]?.totalUnits.toLocaleString()} units
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthProjections;
