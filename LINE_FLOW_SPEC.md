# Line Flow Spec

## Purpose

`Line Flow` is the SKU-level planning tool for Brazil Berry.

It is used to:

- forecast weekly demand for each SKU
- project stock forward week by week
- account for incoming stock and lead times
- identify the stockout week before it happens
- recommend when to place a purchase order
- recommend how much to order
- roll SKU recommendations into a purchase-order planning view

This feature should use the planning principle of the Excel line flow model, not copy the spreadsheet layout.

## Scope

Initial SKU set:

- `Acai 10kg`
- `Acai 3.6kg`
- `Acai 1.6kg`
- `Granola 10kg`
- `Granola 1kg`

Initial planning model:

- monthly sales planning
- weekly stock flow

## Core Concept

For each SKU, the system should calculate a weekly flow line:

1. start with current stock
2. estimate weekly demand
3. subtract forecast sales
4. subtract expected shrinkage
5. add planned incoming purchase orders
6. calculate closing stock for each future week
7. compare closing stock to target cover / safety stock
8. recommend order week and order quantity

## Inputs

### Actual Data

Per SKU:

- current stock on hand
- historical sales by week
- historical sales by month
- distinct customers buying the SKU by month
- units per customer by month
- purchase orders already raised but not yet received
- expected receipt week for each incoming PO
- actual stock adjustments / shrinkage

### Planning Inputs

Per SKU:

- lead time in weeks
- minimum cover target in weeks
- safety stock quantity
- shrinkage rate or manual weekly shrinkage quantity
- monthly forecast quantity
- weekly intake plan

### Optional Future Inputs

- customer growth factor
- seasonality profile
- marketing uplift
- price change effect

## Customer-Based History Signals

Because Brazil Berry is growing from a small base, unit history alone is not enough.

The planning model should also show customer participation signals per SKU.

Recommended monthly signals:

- `customers_buying`
- `units_sold`
- `units_per_customer`
- `new_customers_buying`
- `repeat_customers_buying`

Definitions:

- `customers_buying` = distinct customers who bought the SKU in the month
- `units_per_customer` = `units_sold / customers_buying`
- `new_customers_buying` = customers buying that SKU for the first time in the measured window
- `repeat_customers_buying` = customers who have bought that SKU before

These should be visible in the planning layer even if they are not part of the first forecast formula.

## Small-Base Forecasting Guidance

Historical sales must be treated carefully because the business is growing from a small base.

The system should help distinguish between:

- growth from more customers
- growth from higher units per customer
- one-off spikes from a small number of customers
- lower sales caused by stockouts rather than weak demand

Practical guidance for v1:

- show customer metrics beside sales metrics
- highlight thin-history periods
- allow manual forecast intervention where history is weak
- avoid treating one unusual order as a stable trend

## Calculations

### Monthly-to-Weekly Forecast Distribution

The editable forecast input should live in the monthly view.

The weekly line flow should consume a weekly forecast generated from the monthly quantity.

Recommended distribution rule:

1. use `last year weekly mix` for the comparable month or fiscal period
2. if last year mix is not available, split evenly across the weeks

Example:

- monthly forecast = `1,000`
- LY weekly mix = `20% / 25% / 30% / 25%`

Then:

- week 1 = `200`
- week 2 = `250`
- week 3 = `300`
- week 4 = `250`

If LY mix is unavailable:

- 4-week month => `250 / 250 / 250 / 250`

This keeps monthly forecasting fast while preserving weekly stock planning.

### Monthly Forecast Review Context

When reviewing or entering a monthly forecast, the user should also see:

- actual units sold
- customers buying
- units per customer
- `% var sales to forecast`

This helps explain whether unit movement is coming from:

- customer growth
- stronger buying per customer
- one-off demand

### Weekly Stock Projection

For each future week:

`opening_stock`

minus

- `forecast_sales`
- `shrinkage`

plus

- `planned_intake`

equals

`closing_stock`

The next week's opening stock equals the previous week's closing stock.

### Weeks of Cover

Per projected week:

`cover_weeks = closing_stock / forecast_sales`

If forecast sales are zero, cover should be treated as `null` or a capped high value, not divided blindly.

### Order Trigger

An SKU should trigger a reorder when projected stock falls below either:

- safety stock quantity, or
- minimum cover target

The order must be timed by lead time, not only by stockout.

Example:

- if stockout is projected in week 8
- lead time is 3 weeks

then the order should be raised by week 5 at the latest.

### Recommended Order Quantity

First-pass formula:

`recommended_order_qty = target_stock_position - projected_stock_at_receipt`

Where:

`target_stock_position = forecast_demand_over_cover_window + safety_stock`

This should be rounded to a practical ordering unit if needed.

## Monthly View

The monthly view is the primary demand-planning view.

Each product should have a monthly planning section that shows:

- month
- actual sales
- forecast sales
- `% var sales to forecast`
- customers buying
- units per customer
- editable forecast quantity
- distribution method used
- forecast confidence

### Variance Formula

Where both actual and forecast exist:

`variance_pct = (actual_sales - forecast_sales) / forecast_sales`

If forecast sales are zero, variance should be blank or `null`, not divided blindly.

### Monthly View Actions

- edit forecast quantity
- distribute forecast to weeks
- choose distribution mode later if needed

Initial distribution mode:

- `LY mix`
- fallback to `even split`

### Forecast Confidence

The monthly view should expose a simple confidence signal.

Initial examples:

- `High` = stable history and enough customer depth
- `Medium` = usable history with moderate volatility
- `Low` = thin history, small customer base, or likely stockout distortion

This does not need a complex statistical model in v1.

## Weekly View

The weekly view is the operational stock-flow view.

Each product should have its own `Line Flow` page or panel.

### Table

For each week:

- week start date
- actual sales
- forecast sales
- `% var sales to forecast`
- shrinkage
- planned intake
- opening stock
- closing stock
- weeks of cover
- reorder flag

In this model:

- `forecast sales` is generated from the monthly plan
- `planned intake` is entered directly in the weekly view

### Graph

The graph is a key part of the feature.

Recommended lines/bars:

- actual sales
- forecast sales
- projected stock
- planned intake
- safety stock threshold

The graph should make it obvious:

- where actuals diverge from plan
- when stock will run out
- when intake lands
- when an order must be placed

### Summary Cards

Per SKU:

- current stock
- average weekly sales
- recent customers buying
- recent units per customer
- next stockout week
- order by week
- recommended order quantity

## Purchase Planning Rollup

This is the second view that consumes the SKU line flows.

It should aggregate all SKUs that need buying into one purchase-planning screen.

Per SKU:

- product name
- supplier text
- current stock
- projected stock at receipt
- recommended order quantity
- recommended order date
- expected receipt date
- notes

This rollup should later become the supplier PO document source.

## Supplier PO Output

Not required for the first line flow release, but the model should support it.

Later output:

- supplier
- PO number
- order date
- expected receipt date
- line items
- quantities
- unit cost
- total cost

## Data Model Additions

The current schema can support part of this already, but line flow needs explicit planning fields.

Recommended additions:

### `products`

Add:

- `lead_time_weeks`
- `safety_stock_units`
- `target_cover_weeks`
- `default_shrinkage_rate`
- `supplier_name`

### `purchase_orders`

Already useful for intake planning.

Need to ensure:

- expected delivery date is reliable
- status clearly distinguishes open vs received

### New table: `product_monthly_forecasts`

Purpose:

- store the monthly forecast input per product

Suggested fields:

- `id`
- `product_id`
- `forecast_month`
- `forecast_units`
- `distribution_method`
- `notes`
- `created_at`
- `updated_at`

### New table: `product_weekly_overrides`

Purpose:

- store weekly operational overrides and intake entries

Suggested fields:

- `id`
- `product_id`
- `week_start_date`
- `forecast_override_units`
- `intake_override_units`
- `shrinkage_override_units`
- `notes`
- `created_at`
- `updated_at`

### New table: `product_weekly_snapshots`

Optional later table if saved planning snapshots are needed.

Purpose:

- store frozen planning versions

Not required for v1 if calculations can be generated live.

### Derived Monthly Metrics

These do not need their own table in v1 if they can be queried live from sales history.

Required derived outputs per SKU per month:

- `actual_units`
- `customers_buying`
- `units_per_customer`
- `forecast_units`
- `variance_pct`
- `forecast_confidence`

## Calculation Engine

The first release should calculate line flow dynamically from database inputs.

Do not start with ML here.

Use:

- sales history
- current stock
- monthly forecast inputs
- customer counts by SKU and month
- open purchase orders
- weekly intake entries
- simple forecast settings

ML or advanced forecasting can later feed the weekly demand line, but line flow itself should remain a transparent stock-planning layer.

## Implementation Order

### Phase 1

- build data model additions for product planning fields
- add monthly forecast input table
- compute weekly sales history per SKU
- compute monthly customer participation metrics per SKU
- distribute monthly forecast into weeks using LY mix or even split
- compute projected weekly stock
- show monthly view plus SKU-level weekly graph

### Phase 2

- add weekly intake entry
- add manual weekly overrides
- add reorder recommendation logic
- add purchase planning rollup

### Phase 3

- generate purchase-order document from rollup
- add seasonality/customer-growth switches
- add saved planning scenarios

## Success Criteria

The feature is working when:

- each of the 5 SKUs has a monthly sales planning view
- each SKU has a weekly forward stock view
- the graph clearly shows actual sales, forecast, stock, and intake
- the user can see `% var sales to forecast`
- the user can see customer count and units per customer in monthly planning
- the user can judge when history is low-confidence
- the user can see the stockout week
- the user can see the order-by week
- the app recommends an order quantity
- all SKU recommendations can be rolled into one purchase-planning view
