# Purchase Order Tracking Guide

## Overview

The Purchase Order (PO) system helps you manage incoming inventory, track supplier orders, and integrate with forecasting to prevent stockouts.

## Key Features

### 1. Create Purchase Orders
- Select supplier
- Choose products and quantities
- Set expected delivery date
- Add notes and special instructions

### 2. Track Active Orders
- See all pending deliveries
- Days until expected arrival
- Total value of orders
- Urgent delivery alerts

### 3. Receive Orders
- Mark POs as received
- Automatically update stock levels
- Record actual delivery date
- Track supplier performance

### 4. Integration with Forecasting
- Reorder recommendations show active POs
- Prevents duplicate ordering
- Calculates true stock availability
- Accounts for incoming inventory

## Creating a Purchase Order

### Step-by-Step

1. **Go to Purchase Orders page**
   - Click "POs" in navigation

2. **Click "Create PO"**
   - Opens creation form

3. **Select Supplier**
   - Choose from dropdown
   - Add new suppliers as needed

4. **Set Expected Delivery Date**
   - Based on supplier lead time
   - Usually 5-7 days for local suppliers
   - 10-14 days for distant suppliers

5. **Select Products**
   - Check boxes for products to order
   - Enter quantities
   - System shows current stock and reorder points

6. **Add Notes (Optional)**
   - Delivery instructions
   - Special requirements
   - Batch preferences

7. **Submit**
   - PO is created with unique number
   - Appears in Active Orders tab
   - Integrated with forecasting

### Example

```
Supplier: Açai Suppliers Ltd
Expected Delivery: 2026-02-10 (7 days)

Products:
☑ Açai Bowl 300g - Qty: 100
☑ Açai Bowl 500g - Qty: 80
☐ Açai Smoothie - Qty: 0
☑ Açai Powder 100g - Qty: 50

Notes: Please deliver before 10am. Call 30 min ahead.

Total Cost: R$ 2,710.00
```

## Managing Active Orders

### Active Orders Tab

Shows all pending deliveries with:
- **PO Number**: Unique identifier (e.g., PO-2026-001)
- **Supplier**: Who you ordered from
- **Order Date**: When you placed the order
- **Expected Delivery**: When it should arrive
- **Days Until Delivery**: Countdown with alerts
- **Items**: What you ordered
- **Total Cost**: Order value
- **Status**: Pending/Received/Cancelled

### Delivery Alerts

**Urgent (Red Badge):**
- 3 days or less until delivery
- Prepare receiving area
- Confirm with supplier
- Check stock space

**Coming Soon (Purple Badge):**
- 4-7 days until delivery
- Monitor progress
- Plan receiving schedule

### Receiving a Purchase Order

When delivery arrives:

1. **Verify Items**
   - Check quantities match PO
   - Inspect quality
   - Note any discrepancies

2. **Click "Mark as Received"**
   - On the PO card
   - Confirms receipt

3. **System Updates**
   - Stock levels increase automatically
   - PO moves to "Received" tab
   - Records actual delivery date
   - Updates forecasting calculations

4. **Physical Storage**
   - Put items in warehouse
   - Update bin locations if needed
   - Perform quality check

### Handling Discrepancies

**Quantity Mismatch:**
```
Ordered: 100 units
Received: 95 units

Action:
1. Mark PO as received with actual quantity
2. Contact supplier about shortage
3. Adjust stock manually if needed
4. Document in notes
```

**Quality Issues:**
```
Received damaged items: 5 units

Action:
1. Receive good items only
2. Create stock adjustment for damaged
3. Contact supplier for credit/replacement
4. Document with photos
```

## Integration with Forecasting

### How It Works

The Forecasting page shows:
- Current stock
- Active PO quantities
- Expected delivery dates
- True availability calculation

### Example

```
Product: Açai Powder 100g

Current Stock: 8 units
Daily Sales: 4 units
Days Left: 2 days ⚠️

Active PO:
✓ 50 units on order
Due: 2026-02-06 (5 days)

Analysis:
- Will run out in 2 days
- PO arrives in 5 days
- 3-day gap = potential stockout
- Recommendation: Create urgent PO or reduce sales
```

### Benefits

**Prevents Duplicate Orders:**
- See what's already ordered
- Avoid over-ordering
- Better cash flow management

**Accurate Forecasting:**
- Accounts for incoming stock
- Calculates true availability
- Adjusts reorder recommendations

**Better Planning:**
- Know when stock arrives
- Plan promotions around deliveries
- Optimize warehouse space

## Supplier Management

### Lead Times

Track typical delivery times:

**Açai Suppliers Ltd:**
- Lead time: 5-7 days
- Reliability: High
- Minimum order: R$ 1,000

**Fresh Açai Co:**
- Lead time: 7-10 days
- Reliability: Medium
- Minimum order: R$ 500

**Premium Açai:**
- Lead time: 3-5 days (express)
- Reliability: High
- Minimum order: R$ 2,000

### Performance Tracking

Monitor suppliers:
- On-time delivery rate
- Quality consistency
- Price competitiveness
- Communication responsiveness

## Best Practices

### Daily Tasks
- Check POs due within 3 days
- Confirm deliveries with suppliers
- Prepare receiving area
- Review urgent reorder needs

### Weekly Tasks
- Review all active POs
- Follow up on delayed orders
- Plan next week's orders
- Check supplier performance

### Monthly Tasks
- Analyze supplier reliability
- Review lead time accuracy
- Optimize order quantities
- Negotiate better terms

## Common Scenarios

### Scenario 1: Urgent Stockout Risk

**Problem:**
```
Product will run out before PO arrives
```

**Solutions:**
1. Contact supplier for expedited delivery
2. Create emergency PO with faster supplier
3. Temporarily reduce sales/ration stock
4. Find alternative supplier

### Scenario 2: Delayed Delivery

**Problem:**
```
PO is overdue, supplier hasn't delivered
```

**Actions:**
1. Contact supplier immediately
2. Get new delivery date
3. Update PO expected date
4. Activate backup supplier if critical
5. Adjust forecasts

### Scenario 3: Over-Ordering

**Problem:**
```
Too much stock ordered, storage issues
```

**Prevention:**
1. Check active POs before creating new ones
2. Review forecasting recommendations
3. Consider storage capacity
4. Coordinate with sales team

### Scenario 4: Seasonal Planning

**Problem:**
```
Need extra stock for busy season
```

**Strategy:**
1. Review last year's sales
2. Increase PO quantities 2-3 weeks ahead
3. Stagger deliveries to manage cash flow
4. Communicate with suppliers early

## Reports and Analytics

### Available Reports

**PO Summary:**
- Total active POs
- Total value committed
- Average lead time
- Supplier breakdown

**Receiving History:**
- On-time delivery rate
- Average delay days
- Quality issues
- Supplier performance

**Cost Analysis:**
- Total purchasing costs
- Cost per product
- Supplier price comparison
- Trend over time

## Troubleshooting

### PO not showing in Forecasting

**Check:**
- PO status is "Pending"
- Expected delivery date is future
- Products match exactly
- Refresh the page

### Stock not updated after receiving

**Possible causes:**
- PO not marked as received
- System sync delay
- Manual adjustment needed

**Solution:**
- Verify PO status
- Check stock movement history
- Contact support if persists

### Can't create PO

**Common issues:**
- No supplier selected
- No products selected
- Invalid delivery date (past date)
- Missing required fields

## Mobile Access

While optimized for desktop, PO features work on tablets:
- View active orders
- Check delivery dates
- Mark as received
- All functions accessible

## Integration Points

### With Warehouse Module
- Receiving updates stock
- Links to stock movements
- Tracks receiving history

### With Forecasting Module
- Shows active POs
- Adjusts reorder recommendations
- Calculates true availability

### With Products Module
- Product selection
- Current stock levels
- Reorder points

### With Reports Module
- PO history
- Supplier performance
- Cost analysis

## Future Enhancements

Coming soon:
- Automated PO creation from forecasts
- Supplier portal for status updates
- Email notifications for deliveries
- Barcode scanning for receiving
- Multi-currency support
- Partial receiving capability

## Tips for Success

1. **Be Consistent**
   - Always create POs (don't skip)
   - Mark received promptly
   - Keep notes updated

2. **Plan Ahead**
   - Order before stockout
   - Account for lead times
   - Consider holidays/weekends

3. **Communicate**
   - Confirm orders with suppliers
   - Follow up on deliveries
   - Build relationships

4. **Review Regularly**
   - Check active POs daily
   - Analyze supplier performance
   - Optimize order quantities

5. **Use Forecasting**
   - Let system guide reorder quantities
   - Check before creating POs
   - Trust the data (but verify)

## Support

For questions about PO tracking:
- Review this guide
- Check FORECASTING_GUIDE.md for integration
- Check WAREHOUSE_GUIDE.md for receiving
- Contact support for technical issues

Remember: Good PO management prevents stockouts, reduces costs, and improves cash flow!
