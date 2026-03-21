# Sales Forecasting & Analytics Guide

## Overview

The Forecasting module provides ERP-like analytics to help you make data-driven decisions about inventory, purchasing, and sales strategy.

## Key Features

### 1. Sales Trend Analysis
- Visual charts showing historical sales by category
- Projected sales for next week/month/quarter
- Trend lines showing growth or decline patterns

### 2. Category Performance
- Average weekly/monthly/quarterly sales per category
- Growth trends (percentage increase/decrease)
- Confidence levels for forecasts
- Actionable recommendations

### 3. Smart Reorder Recommendations
- Calculates when products will run out
- Suggests optimal reorder quantities
- Priority levels (Urgent, High, Medium, Low)
- Based on actual sales velocity
- Ability to track and account for Purchase order and their lead time and projected arrival

### 4. Key Insights Dashboard
- Quick overview of business health
- Growth trends
- Fast-moving products
- Stock alerts
- Revenue projections

## How Forecasting Works

### Data Collection
The system automatically tracks:
- Every sale (date, products, quantities)
- Stock movements (receives, adjustments)
- Product categories
- Time periods (daily, weekly, monthly)

### Calculation Methods

**Simple Moving Average:**
```
Forecast = Average of last N periods
```

**Trend Analysis:**
```
Growth Rate = (Current Period - Previous Period) / Previous Period × 100
```

**Sales Velocity:**
```
Daily Average = Total Sales / Number of Days
Days Until Stockout = Current Stock / Daily Average
```

**Reorder Point:**
```
Reorder Quantity = (Daily Average × Lead Time) + Safety Stock
```

### Confidence Levels

**High Confidence (>85%):**
- Consistent sales pattern
- Low variance
- Sufficient historical data
- Reliable forecasts

**Medium Confidence (60-85%):**
- Some fluctuation in sales
- Moderate variance
- Limited historical data
- Use with caution

**Low Confidence (<60%):**
- Highly variable sales
- New product
- Insufficient data
- Manual review recommended

## Using the Forecasting Page

### Timeframe Selection
- **Next Week**: Short-term planning, immediate orders
- **Next Month**: Medium-term planning, budget allocation
- **Next Quarter**: Long-term strategy, seasonal planning

### Category Filter
- **All Categories**: Overall business view
- **Specific Category**: Deep dive into one product line

### Reading the Charts

**Sales Trend Chart:**
- Solid lines = Historical actual sales
- Dashed lines = Projected future sales
- Different colors = Different categories
- Hover for exact numbers

**Category Performance Table:**
Shows for each category:
- Average monthly sales (historical)
- Trend percentage (growth/decline)
- Next month forecast
- Confidence level
- Recommendation

**Reorder Recommendations Table:**
Shows for each product:
- Current stock level
- Average daily sales
- Days until stockout
- Suggested reorder quantity
- Priority level

## Practical Examples

### Example 1: Planning Weekly Orders

**Scenario:** It's Monday, you need to order for the week.

**Steps:**
1. Go to Forecasting page
2. Select "Next Week" timeframe
3. Check "Reorder Recommendations" table
4. Look for "Urgent" and "High" priority items
5. Order the suggested quantities

**Result:**
```
Açai Powder 100g:
- Current: 8 units
- Daily avg: 4 units
- Days left: 2 days
- Reorder: 50 units
- Priority: URGENT ⚠️

Action: Order 50 units immediately
```

### Example 2: Monthly Budget Planning

**Scenario:** Planning next month's inventory budget.

**Steps:**
1. Select "Next Month" timeframe
2. Review "Category Performance" table
3. Note forecast quantities
4. Calculate budget needed

**Result:**
```
Bowls: 480 units forecast
Smoothies: 260 units forecast
Powder: 120 units forecast
Frozen: 175 units forecast

Budget = (480 × R$18.50) + (260 × R$12) + ...
```

### Example 3: Identifying Growth Opportunities

**Scenario:** Which category should you focus on?

**Steps:**
1. Review "Category Performance" table
2. Look at "Trend" column
3. Check "Recommendation" column

**Result:**
```
Bowls: +8.5% trend → "Increase stock by 15%"
This is your fastest growing category!

Action: 
- Negotiate better supplier rates for bowls
- Consider adding new bowl varieties
- Increase marketing for bowls
```

## Best Practices

### Daily Tasks
- Check "Reorder Recommendations" for urgent items
- Monitor "Days Left" column
- Place orders for items with <3 days stock

### Weekly Tasks
- Review sales trends
- Compare actual vs forecast
- Adjust reorder quantities if needed

### Monthly Tasks
- Analyze category performance
- Review forecast accuracy
- Update minimum stock levels
- Plan budget for next month

### Quarterly Tasks
- Long-term trend analysis
- Seasonal pattern identification
- Strategic planning
- Supplier negotiations

## Understanding Recommendations

### "Increase stock by X%"
**Meaning:** This category is growing fast
**Action:** Order more than usual to avoid stockouts

### "Maintain current levels"
**Meaning:** Sales are steady and predictable
**Action:** Continue current ordering pattern

### "Monitor closely"
**Meaning:** Sales are variable or uncertain
**Action:** Check daily, be ready to adjust

### "Consider promotion"
**Meaning:** Sales are declining
**Action:** Marketing push or price adjustment needed

## Improving Forecast Accuracy

### More Data = Better Forecasts
- System improves over time
- First month: 60-70% accuracy
- After 3 months: 80-85% accuracy
- After 6 months: 85-90% accuracy

### Tips for Better Data
1. **Record all sales** - Don't skip entries
2. **Accurate stock counts** - Regular physical counts
3. **Note special events** - Holidays, promotions affect patterns
4. **Consistent categories** - Don't change product categories often

### Handling Special Cases

**New Products:**
- No historical data
- Use similar product data
- Conservative initial forecasts
- Monitor closely first 30 days

**Seasonal Products:**
- Compare to same period last year
- Adjust for growth trends
- Plan ahead for peak seasons

**Promotional Periods:**
- Expect higher than forecast sales
- Increase stock before promotion
- Return to normal after promotion

## Integration with Other Modules

### With Warehouse:
- Forecasts inform receiving quantities
- Reorder recommendations guide purchasing
- Stock counts validate forecast accuracy

### With Sales:
- Actual sales update forecasts in real-time
- Sales patterns improve predictions
- Velocity calculations adjust automatically

### With Products:
- Category assignments enable forecasting
- Minimum stock levels set from forecasts
- Product performance tracked

## Troubleshooting

### Forecast seems too high
**Possible causes:**
- Recent promotion skewed data
- One-time large order included
- Seasonal spike

**Solution:**
- Review historical data
- Exclude outliers
- Use longer time period

### Forecast seems too low
**Possible causes:**
- Growing business not reflected
- Recent stockouts reduced sales
- New marketing efforts

**Solution:**
- Check recent growth trends
- Adjust manually if needed
- Monitor closely

### Confidence level is low
**Possible causes:**
- New product
- Variable sales pattern
- Insufficient data

**Solution:**
- Collect more data
- Use manual judgment
- Order conservatively

## Advanced Features (Coming Soon)

- Seasonal adjustment factors
- Promotional impact modeling
- Multi-location forecasting
- Supplier lead time integration
- Automated purchase orders
- What-if scenario analysis

## Reports and Exports

From the Forecasting page, you can:
- Export forecast data to CSV
- Print reorder recommendations
- Share insights with team
- Track forecast accuracy over time

## Support

For questions about forecasting:
- Review this guide
- Check actual vs forecast regularly
- Adjust based on your business knowledge
- Contact support for technical issues

Remember: Forecasts are predictions, not guarantees. Use them as a guide along with your business judgment!
