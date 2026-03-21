# Customer-Based Forecasting System

Complete guide to the advanced customer growth projection and forecasting system.

## 🎯 Overview

This system forecasts future sales based on:
1. **Historical sales trends** (baseline)
2. **Customer acquisition projections** (growth plan from next month up to 24 months)
3. **Average units per customer** (product metrics)

Perfect for rapidly growing businesses where customer acquisition drives sales growth.

## 📅 Planning Horizon

- **Start**: Next month (earliest you can add new customers)
- **End**: 24 months from now
- **Total**: 24 months of planning
- **Flexibility**: Update anytime as plans change

**Example (Today is March 2026):**
- Next month: April 2026 (can add customers)
- Month 2: May 2026
- Month 3: June 2026
- ...
- Month 24: March 2028

## 📊 How It Works

### Formula

```
Future Sales = Baseline Trend + (New Customers × Avg Units/Customer)
```

### Example

**Next Month (Month 1) from now:**
- Baseline trend: 450 units (from historical data)
- New customers: 2
- Avg units/customer: 3 per month
- **Total forecast: 450 + (2 × 3) = 456 units**

**Month 2 from now:**
- Baseline trend: 460 units
- New customers this month: 3
- Previous new customers still buying: 2
- Total new customer impact: (2 + 3) × 3 = 15 units
- **Total forecast: 460 + 15 = 475 units**

**Month 3 from now:**
- Baseline trend: 470 units
- New customers this month: 2
- Previous new customers still buying: 2 + 3 = 5
- Total new customer impact: (5 + 2) × 3 = 21 units
- **Total forecast: 470 + 21 = 491 units**

### Cumulative Effect

New customers continue buying in future months, creating cumulative growth:

```
Month 1: +2 customers → +6 units
Month 2: +3 customers → +15 units (2+3 customers × 3 units)
Month 3: +2 customers → +21 units (2+3+2 customers × 3 units)
```

## 🗄️ Database Structure

### Tables Created

**1. product_line_metrics**
- Stores average units per customer for each product/category
- Monthly and weekly averages
- Updated by management

**2. customer_growth_projections**
- Monthly customer acquisition plan
- New customers expected each month
- Churn tracking (optional)

**3. product_customer_projections**
- Product-specific customer projections
- For different products with different customer bases

**4. customer_base_snapshot**
- Historical tracking of customer count
- Helps validate projections

## 🎨 Growth Projections Page

### Three Tabs

**1. Customer Projections**
- Enter new customers expected each month
- View cumulative customer count
- Add notes for context
- Edit any month's projection

**2. Product Metrics**
- Set average units per customer
- Configure for each product/category
- Monthly and weekly averages
- Notes for assumptions

**3. Sales Forecast**
- View projected sales by month
- See customer growth impact
- Calculate year-end projections
- Growth percentages

## 📝 Setup Guide

### Step 1: Run Database Schema

```bash
# In Neon SQL Editor
# Run schema-growth-projections.sql
```

This creates all necessary tables and sample data.

### Step 2: Configure Product Metrics

1. Go to Growth Projections page
2. Click "Product Metrics" tab
3. For each product/category, set:
   - Average units per customer per month
   - Notes (e.g., "Based on Q4 2025 data")

**Example:**
- Açai Bowl 300g: 3 units/customer/month
- Açai Smoothie: 2 units/customer/month
- Açai Powder: 0.5 units/customer/month

### Step 3: Enter Customer Projections

1. Click "Customer Projections" tab
2. For each month (starting from next month), enter:
   - Number of new customers expected
   - Notes (e.g., "Q1 expansion", "New territory")

**Example Plan (Today is March 2026):**
```
Next Month (Apr 2026): 2 new customers - "Initial expansion"
Month 2 (May 2026): 3 new customers - "Q2 push"
Month 3 (Jun 2026): 2 new customers - "Steady growth"
Month 4 (Jul 2026): 4 new customers - "Summer campaign"
Month 5 (Aug 2026): 3 new customers - "Continued growth"
...
Month 24 (Mar 2028): 5 new customers - "Year 2 target"
```

**Note**: The first row is always "Next Month" - your earliest opportunity to onboard new customers.

### Step 4: Review Forecast

1. Click "Sales Forecast" tab
2. See projected units by month
3. Verify calculations make sense
4. Adjust projections if needed

### Step 5: Use in Forecasting Page

The forecasting page automatically incorporates your projections:
- Weekly view: Converts monthly projections to weekly
- Monthly view: Uses projections directly
- Charts show baseline + customer growth impact

## 🔄 Weekly vs Monthly Conversion

### Monthly to Weekly

```javascript
// System automatically converts
weeklyAvg = monthlyAvg / 4.33 // Average weeks per month

// Example:
// Monthly: 3 units/customer
// Weekly: 3 / 4.33 = 0.69 units/customer/week
```

### Customer Projections

Monthly projections are distributed across weeks:

```
Month with 2 new customers:
Week 1: 0.5 customers
Week 2: 0.5 customers
Week 3: 0.5 customers
Week 4: 0.5 customers
```

## 📊 API Integration

### Get Projections

```javascript
GET /api/growth-projections?months=12

Response:
{
  customerProjections: [
    {
      projection_month: "2026-04-01",
      new_customers_count: 2,
      notes: "Q2 expansion"
    }
  ],
  productMetrics: [
    {
      category_id: 1,
      product_id: 5,
      avg_units_per_customer_monthly: 3.0,
      avg_units_per_customer_weekly: 0.69
    }
  ],
  currentCustomerBase: {
    total_customers: 25,
    last_snapshot_date: "2026-03-01"
  }
}
```

### Save Customer Projection

```javascript
POST /api/growth-projections
{
  type: "customer_growth",
  data: {
    projection_month: "2026-04-01",
    new_customers_count: 2,
    notes: "Q2 expansion"
  }
}
```

### Save Product Metric

```javascript
POST /api/growth-projections
{
  type: "product_metrics",
  data: {
    category_id: 1,
    product_id: 5,
    avg_units_per_customer_monthly: 3.0,
    notes: "Based on Q4 2025 average"
  }
}
```

### Bulk Update

```javascript
PUT /api/growth-projections
{
  projections: [
    { projection_month: "2026-04-01", new_customers_count: 2 },
    { projection_month: "2026-05-01", new_customers_count: 3 },
    { projection_month: "2026-06-01", new_customers_count: 2 }
  ]
}
```

## 🔮 Enhanced Forecasting

### Forecast Response

```javascript
GET /api/forecasting?view=monthly

Response includes:
{
  forecast: [
    {
      period: 1,
      total_quantity: 465,
      total_revenue: 6975.00,
      baseline_quantity: 450,          // From trend
      baseline_revenue: 6750.00,
      customer_growth_quantity: 15,    // From new customers
      customer_growth_revenue: 225.00,
      new_customers_this_period: 2,
      cumulative_new_customers: 2,
      confidence: "High"
    }
  ],
  customerProjections: [...],
  productMetrics: [...]
}
```

### Breakdown

Each forecast period shows:
- **Baseline**: What trend predicts
- **Customer Growth**: Additional from new customers
- **Total**: Combined forecast
- **New Customers**: This period's additions
- **Cumulative**: Total new customers so far

## 💡 Use Cases

### Scenario 1: Rapid Expansion

**Situation**: Opening 3 new territories over 6 months

**Setup:**
1. Set product metrics based on current averages
2. Enter customer projections:
   - Month 1-2: 5 customers/month (Territory A)
   - Month 3-4: 4 customers/month (Territory B)
   - Month 5-6: 6 customers/month (Territory C)
3. Review forecast to plan inventory

**Result**: Accurate forecast accounting for expansion

### Scenario 2: Seasonal Business

**Situation**: Summer spike with new customers

**Setup:**
1. Adjust avg units/customer for summer months
2. Enter higher customer projections for Jun-Aug
3. Plan inventory for peak season

**Result**: Avoid stockouts during busy period

### Scenario 3: Product Launch

**Situation**: Launching new product line

**Setup:**
1. Create product metric for new product
2. Estimate avg units/customer based on similar products
3. Project customer adoption rate
4. Monitor and adjust

**Result**: Data-driven launch planning

## 📈 Best Practices

### Setting Product Metrics

1. **Use Historical Data**
   ```sql
   -- Calculate actual average
   SELECT 
     p.name,
     COUNT(DISTINCT s.customer) as customers,
     SUM(si.quantity) as total_units,
     SUM(si.quantity) / COUNT(DISTINCT s.customer) as avg_per_customer
   FROM sales s
   JOIN sale_items si ON s.id = si.sale_id
   JOIN products p ON si.product_id = p.id
   WHERE s.date >= NOW() - INTERVAL '3 months'
   GROUP BY p.name;
   ```

2. **Review Quarterly** - Customer behavior changes
3. **Segment by Type** - Different customer types buy differently
4. **Be Conservative** - Better to under-promise
5. **Document Assumptions** - Use notes field

### Planning Customer Growth

1. **Be Realistic** - Base on sales pipeline
2. **Account for Churn** - Some customers leave
3. **Seasonal Patterns** - Adjust for busy/slow periods
4. **Review Monthly** - Update as plans change
5. **Track Actuals** - Compare projections to reality

### Using Forecasts

1. **Check Confidence** - High confidence = more reliable
2. **Review Breakdown** - Understand baseline vs growth
3. **Plan Inventory** - Order based on forecast
4. **Adjust Quickly** - Update projections as needed
5. **Communicate** - Share forecasts with team

## 🔧 Customization

### Change Forecast Horizon

Edit `api/forecasting.js`:

```javascript
// Forecast more/fewer periods
const periods = view === 'weekly' ? 8 : 6; // Instead of 4 : 3
```

### Adjust Cumulative Logic

```javascript
// In calculateForecast function
// Modify how cumulative customers are calculated
if (i > 1) {
  const cumulativeQty = (cumulativeNewCustomers - newCustomers) * avgUnits;
  additionalQty += cumulativeQty;
}
```

### Add Churn Rate

```javascript
// Account for customer churn
const churnRate = 0.05; // 5% monthly churn
const activeCustomers = cumulativeNewCustomers * (1 - churnRate);
additionalQty = activeCustomers * avgUnits;
```

## 📊 Reporting

### Monthly Review Report

```sql
-- Compare projections to actuals
SELECT 
  DATE_TRUNC('month', s.date) as month,
  COUNT(DISTINCT s.customer) as actual_customers,
  cgp.new_customers_count as projected_customers,
  SUM(si.quantity) as actual_units,
  -- Calculate projected units
  cgp.new_customers_count * 
    (SELECT AVG(avg_units_per_customer_monthly) FROM product_line_metrics) 
    as projected_units
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
LEFT JOIN customer_growth_projections cgp 
  ON DATE_TRUNC('month', s.date) = cgp.projection_month
WHERE s.date >= NOW() - INTERVAL '6 months'
GROUP BY month, cgp.new_customers_count
ORDER BY month;
```

### Accuracy Tracking

```sql
-- Track forecast accuracy
SELECT 
  projection_month,
  new_customers_count as projected,
  (SELECT COUNT(DISTINCT customer) 
   FROM sales 
   WHERE DATE_TRUNC('month', date) = projection_month) as actual,
  ABS(new_customers_count - 
    (SELECT COUNT(DISTINCT customer) 
     FROM sales 
     WHERE DATE_TRUNC('month', date) = projection_month)
  ) as variance
FROM customer_growth_projections
WHERE projection_month < NOW()
ORDER BY projection_month DESC;
```

## ✅ Summary

The customer-based forecasting system:
- ✅ Combines trend analysis with growth planning
- ✅ Accounts for new customer acquisition
- ✅ Calculates cumulative impact
- ✅ Converts between weekly and monthly views
- ✅ Provides detailed breakdown
- ✅ Easy to update and maintain
- ✅ Perfect for growing businesses

**Result**: More accurate forecasts that reflect your growth strategy!

---

**Next Steps:**
1. Run `schema-growth-projections.sql`
2. Configure product metrics
3. Enter customer projections
4. Review forecasts
5. Adjust inventory planning
