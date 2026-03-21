# Warehouse Operations Guide

This guide explains how to use the warehouse management features.

## Overview

The Warehouse section is designed for desktop use and provides three main functions:
1. Receive incoming stock
2. Adjust/correct stock levels
3. Perform physical stock counts

## Receiving Stock

Use this when new inventory arrives from suppliers.

### Steps:
1. Go to **Warehouse** → **Receive Stock** tab
2. Select the product from the dropdown
3. Enter the quantity received
4. Add notes (optional): supplier name, batch number, delivery date
5. Click **Receive Stock**

The system will:
- Add the quantity to current stock
- Record the transaction with timestamp
- Update stock levels across all views

### Example:
```
Product: Açai Bowl 300g
Quantity: 50
Notes: Supplier ABC, Batch #12345, Delivery 31/01/2026
```

## Stock Adjustments

Use this to correct stock levels when there are discrepancies.

### Common Reasons:
- **Physical Count Correction**: After counting, actual stock differs from system
- **Damaged/Expired Items**: Products that can't be sold
- **Loss/Theft**: Missing inventory
- **Data Entry Error**: Previous mistakes in the system

### Steps:
1. Go to **Warehouse** → **Adjust Stock** tab
2. Select the product (current stock will be shown)
3. Enter the NEW correct quantity (not the difference)
4. Select the reason for adjustment
5. Click **Update Stock**

### Example:
```
Product: Açai Powder 100g
Current Stock: 8 units
New Quantity: 5 units (found 3 expired)
Reason: Damaged/Expired Items
```

The system will:
- Update stock to the new quantity
- Calculate the difference automatically
- Record the adjustment with reason and timestamp
- Keep audit trail for reporting

## Physical Stock Count

Use this for periodic inventory verification (weekly, monthly, etc.)

### Steps:
1. Go to **Warehouse** → **Stock Count** tab
2. Physically count each product in the warehouse
3. Enter the counted quantity in the "Physical Count" column
4. The system shows variance (difference) automatically
5. Review all variances
6. Click **Export Report** to save the count results
7. Click **Apply Adjustments** to update system stock to match physical count

### Best Practices:
- Perform counts during low-activity periods
- Count systematically (shelf by shelf, product by product)
- Have two people verify high-value items
- Document any significant variances
- Investigate large discrepancies before applying

### Example Count:
```
Product              | System | Physical | Variance
---------------------|--------|----------|----------
Açai Bowl 300g       |   45   |    43    |   -2
Açai Bowl 500g       |   32   |    32    |    0
Açai Smoothie        |   28   |    30    |   +2
Açai Powder 100g     |    8   |     5    |   -3
Açai Frozen Pack 1kg |   15   |    15    |    0
```

## Stock Movement History

All warehouse operations are tracked:
- Who made the change
- When it was made
- What changed (before/after quantities)
- Why it was changed (reason/notes)

Access this in the **Reports** section to:
- Audit inventory changes
- Track receiving patterns
- Identify recurring issues
- Generate compliance reports

## Tips for Warehouse Staff

### Daily Tasks:
- Check for incoming deliveries
- Receive and record all stock
- Monitor low stock alerts
- Report any damaged items immediately

### Weekly Tasks:
- Quick spot-check of high-turnover items
- Review stock movement reports
- Verify minimum stock levels are maintained

### Monthly Tasks:
- Full physical stock count
- Reconcile all variances
- Review and adjust minimum stock levels if needed
- Generate inventory valuation report

## Integration with Sales

When salespeople make sales:
- Stock automatically decreases
- Warehouse sees real-time stock levels
- Low stock alerts trigger automatically
- Reorder points can be set per product

## Security & Audit Trail

The system maintains complete records:
- Every stock change is logged
- User identification for all transactions
- Timestamps for all operations
- Reasons documented for adjustments

This ensures:
- Accountability
- Compliance with inventory policies
- Easy troubleshooting of discrepancies
- Historical reporting capabilities

## Troubleshooting

### Stock level seems wrong
1. Check recent sales in Orders section
2. Review stock movement history
3. Perform physical count to verify
4. Use adjustment feature to correct

### Can't find a product
- Products are managed in the Products section
- Warehouse staff can view but may need manager to add new products

### Need to undo a mistake
- Contact system administrator
- Provide transaction details
- Make correcting adjustment with notes explaining the error

## Mobile Access

While optimized for desktop, warehouse features work on tablets:
- Use landscape orientation for best experience
- Tables are scrollable on smaller screens
- All functions remain accessible

## Support

For questions or issues:
- Check this guide first
- Review the main README.md
- Contact system administrator
- Refer to AWS_SETUP.md for technical issues
