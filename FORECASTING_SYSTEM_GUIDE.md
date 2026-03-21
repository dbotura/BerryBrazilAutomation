# Dynamic Forecasting System Guide

Complete guide to the enhanced sales forecasting system with weekly and monthly views.

## 🎯 Overview

The forecasting system provides AI-powered sales predictions with:
- ✅ **Dynamic Views**: Toggle between weekly and monthly analysis
- ✅ **Historical Data**: Last 12 weeks or 12 months of sales
- ✅ **AI Forecasting**: Linear regression-based predictions
- ✅ **Category Analysis**: Performance by product category
- ✅ **Smart Reordering**: Automated stock recommendations
- ✅ **Confidence Levels**: High/Medium/Low prediction accuracy

## 🔄 Weekly vs Monthly Views

### Weekly View
- Shows last 12 weeks of sales data
- Forecasts next 4 weeks
- Best for: Short-term planning, immediate stock decisions
- Updates: Real-time as sales are recorded

### Monthly View
- Shows last 12 months of sales data
- Forecasts next 3 months
- Best for: Long-term trends, seasonal planning
- Updates: Daily aggregation

### Toggle Between Views
Simply click the toggle buttons at the top:
- 📅 **Weekly** - For short-term analysis
- 📆 **Monthly** - For long-term trends

## 📊 Key Features

### 1. Metrics Dashboard

Four key metrics displayed at the top:

**Total Revenue**
- Sum of all sales in the period
- Growth rate vs previous period
- Color-coded: Green (up), Red (down)

**Total Units Sold**
- Total quantity across all products
- Timeframe indicator

**Forecast Revenue**
- Predicted revenue for next period(s)
- Expected growth percentage
- Purple gradient card

**Average Revenue**
- Average per week or month
- Helps identify trends

### 2. Sales Trend Chart

Interactive area chart showing:
- Historical sales (solid line)
- Forecast predictions (dashed line)
- Hover for exact values
- Color gradient for visual appeal

### 3. Category Performance

Grid of category cards showing:
- **Trend**: Up 📈, Down 📉, or Stable ➡️
- **Total Sales**: Units sold in period
- **Revenue**: Total category revenue
- **Forecast**: Predicted next period sales
- **Confidence**: High/Medium/Low accuracy

### 4. Top Products

Top 5 best-selling products with:
- Ranking (#1, #2, etc.)
- Units sold
- Revenue generated
- Current stock level
- Stock status (low/ok)

### 5. Reorder Recommendations

Smart table showing products that need reordering:
- **Current Stock**: Units in inventory
- **Avg Daily Sales**: Sales velocity
- **Days Left**: Stock runway
- **Suggested Reorder**: Recommended quantity
- **Priority**: Urgent/High/Medium/Low

Color coding:
- Red rows: Urgent (≤3 days left)
- Yellow text: Warning (≤7 days)
- Green: Healthy stock

### 6. Key Insights

Four insight cards:
- **Growth Trend**: Overall sales direction
- **Forecast Accuracy**: Confidence level
- **Stock Alert**: Urgent reorder count
- **Best Category**: Top performer

## 🤖 How Forecasting Works

### Linear Regression Algorithm

The system uses linear regression to predict future sales:

1. **Data Collection**: Gathers historical sales data
2. **Trend Analysis**: Calculates slope and intercept
3. **Projection**: Extends trend into future periods
4. **Confidence Calculation**: Measures prediction reliability

### Confidence Levels

**High (>80%)**
- Stable sales pattern
- Low variance
- Reliable for planning

**Medium (60-80%)**
- Some fluctuation
- Use with caution
- Monitor closely

**Low (<60%)**
- High variance
- Unpredictable pattern
- Manual review recommended

### Factors Considered

- Historical sales volume
- Sales velocity (rate of change)
- Seasonal patterns
- Category performance
- Stock turnover rate

## 🔌 API Integration

### Endpoint

```
GET /api/forecasting
```

### Parameters

```javascript
{
  view: 'weekly' | 'monthly',  // Required
  categoryId: number,           // Optional - filter by category
  startDate: string,            // Optional - custom date range
  endDate: string               // Optional - custom date range
}
```

### Response Structure

```javascript
{
  view: 'weekly',
  period: {
    start: '2024-01-01',
    end: '2024-03-07'
  },
  historical: [
    {
      period: '2024-01-01',
      label: 'W1',
      total_quantity: 450,
      total_revenue: 6750.00,
      transaction_count: 45,
      categories: {
        bowls: { quantity: 200, revenue: 3000 },
        smoothies: { quantity: 150, revenue: 1800 }
      }
    }
  ],
  forecast: [
    {
      period: 1,
      total_quantity: 465,
      total_revenue: 6975.00,
      confidence: 'High',
      isForecast: true
    }
  ],
  categoryPerformance: [
    {
      id: 1,
      name: 'Bowls',
      total_quantity: 2400,
      total_revenue: 36000,
      trend: '+8.5',
      trendDirection: 'up',
      forecast: 480,
      confidence: 'High'
    }
  ],
  reorderRecommendations: [
    {
      id: 1,
      name: 'Açai Bowl 300g',
      stock: 45,
      min_stock: 10,
      avg_daily_sales: 15.2,
      days_left: 3,
      reorder_qty: 100,
      priority: 'High'
    }
  ],
  topProducts: [...],
  metrics: {
    totalRevenue: 81000,
    totalQuantity: 5400,
    avgRevenue: 6750,
    growthRate: 7.5,
    forecastRevenue: 20925,
    forecastGrowth: 8.2
  }
}
```

## 💻 Frontend Integration

### Basic Usage

```javascript
import Forecasting from './pages/Forecasting';

// In your router
<Route path="/forecasting" element={<Forecasting />} />
```

### Fetch Data

```javascript
const fetchForecastData = async (view = 'monthly') => {
  const response = await fetch(`/api/forecasting?view=${view}`);
  const data = await response.json();
  return data;
};
```

### Toggle Views

```javascript
const [view, setView] = useState('monthly');

<button onClick={() => setView('weekly')}>Weekly</button>
<button onClick={() => setView('monthly')}>Monthly</button>
```

## 📈 Use Cases

### For Sales Team

**Weekly View:**
- Plan next week's inventory
- Identify fast-moving products
- Adjust pricing strategies
- Schedule deliveries

**Monthly View:**
- Set monthly sales targets
- Plan marketing campaigns
- Budget allocation
- Seasonal preparation

### For Warehouse Staff

**Weekly View:**
- Urgent reorder alerts
- Daily stock checks
- Receiving schedules
- Space planning

**Monthly View:**
- Long-term storage needs
- Supplier negotiations
- Bulk order planning
- Inventory optimization

### For Management

**Weekly View:**
- Cash flow management
- Staff scheduling
- Quick decisions
- Performance tracking

**Monthly View:**
- Strategic planning
- Budget forecasting
- Growth analysis
- Trend identification

## 🎨 Customization

### Change Forecast Periods

Edit `api/forecasting.js`:

```javascript
// For weekly view
dateInterval = '12 weeks';  // Change to '8 weeks', '16 weeks', etc.
periods = 4;                // Forecast periods (change to 2, 6, etc.)

// For monthly view
dateInterval = '12 months'; // Change to '6 months', '24 months', etc.
periods = 3;                // Forecast periods
```

### Adjust Confidence Thresholds

```javascript
// In calculateConfidence function
if (confidence > 0.8) return 'High';    // Change to 0.85
if (confidence > 0.6) return 'Medium';  // Change to 0.7
return 'Low';
```

### Modify Reorder Logic

```javascript
// In getReorderRecommendations function
const reorderQty = Math.max(
  p.min_stock * 2,                    // Change multiplier
  Math.ceil(avgDaily * daysToCheck)   // Change calculation
);

// Priority thresholds
if (daysLeft <= 2) priority = 'Urgent';  // Change to 3
else if (daysLeft <= 5) priority = 'High'; // Change to 7
```

## 🔍 Troubleshooting

### No Data Showing

**Cause**: No sales recorded in database

**Solution**:
1. Check if sales exist: `SELECT COUNT(*) FROM sales`
2. Verify date range
3. Check sale status (must be 'completed')

### Forecast Seems Inaccurate

**Causes**:
- Insufficient historical data (< 4 periods)
- High variance in sales
- Seasonal changes not accounted for

**Solutions**:
1. Wait for more data (at least 8-12 periods)
2. Use weekly view for more data points
3. Manually adjust for known events
4. Check confidence level

### Categories Not Showing

**Cause**: Products not assigned to categories

**Solution**:
```sql
-- Check products without categories
SELECT * FROM products WHERE category_id IS NULL;

-- Assign categories
UPDATE products SET category_id = 1 WHERE id = X;
```

### Slow Performance

**Causes**:
- Large dataset
- Complex queries
- No database indexes

**Solutions**:
1. Add indexes (already in schema)
2. Limit date range
3. Cache results
4. Use pagination

## 📊 Best Practices

### Data Quality

1. **Record all sales** - Don't skip transactions
2. **Complete data** - Include customer info, dates
3. **Accurate quantities** - Double-check entries
4. **Timely updates** - Record sales same day

### Using Forecasts

1. **Check confidence** - Trust high confidence more
2. **Consider context** - Holidays, events, seasons
3. **Monitor trends** - Watch for changes
4. **Adjust manually** - Override when needed
5. **Review regularly** - Weekly for short-term, monthly for long-term

### Reorder Decisions

1. **Urgent first** - Address critical stock immediately
2. **Batch orders** - Combine to save shipping
3. **Lead times** - Account for supplier delays
4. **Safety stock** - Keep buffer for spikes
5. **Check POs** - Verify existing orders

## 🚀 Advanced Features (Future)

### Planned Enhancements

- **Seasonal Adjustment**: Account for holidays and events
- **Machine Learning**: More sophisticated algorithms
- **Multi-variable Analysis**: Price, weather, promotions
- **Anomaly Detection**: Identify unusual patterns
- **Export Reports**: PDF/Excel downloads
- **Email Alerts**: Automated reorder notifications
- **Mobile App**: On-the-go forecasting

## 📚 Related Documentation

- `FORECASTING_GUIDE.md` - Original forecasting guide
- `api/forecasting.js` - API implementation
- `src/pages/Forecasting.jsx` - Frontend component
- `schema.sql` - Database structure

## ✅ Summary

The dynamic forecasting system provides:
- Real-time sales analysis
- AI-powered predictions
- Flexible weekly/monthly views
- Smart reorder recommendations
- Category performance tracking
- Confidence-based decision making

Perfect for data-driven inventory management and sales planning!

---

**Need help?** Check the API response for detailed data or review the frontend component for customization options.
