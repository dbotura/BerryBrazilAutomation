import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'POST') {
      const { action, productId, targets } = req.body || {};

      if (action !== 'commit-target') {
        return res.status(400).json({ error: 'Unsupported action' });
      }

      if (!productId || !Array.isArray(targets) || targets.length === 0) {
        return res.status(400).json({ error: 'productId and targets are required' });
      }

      const committedRows = [];
      for (const target of targets) {
        if (!target.forecastMonth || target.targetUnits == null) {
          continue;
        }

        const result = await sql`
          INSERT INTO product_monthly_forecasts (
            product_id,
            forecast_month,
            forecast_units,
            target_units,
            target_committed_at,
            distribution_method,
            notes
          )
          VALUES (
            ${productId},
            ${target.forecastMonth},
            ${target.targetUnits},
            ${target.targetUnits},
            CURRENT_TIMESTAMP,
            ${target.distributionMethod || 'ly_mix'},
            ${target.notes || null}
          )
          ON CONFLICT (product_id, forecast_month) DO UPDATE SET
            target_units = EXCLUDED.target_units,
            target_committed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          RETURNING
            id,
            product_id,
            TO_CHAR(forecast_month, 'YYYY-MM-01') AS month_key,
            forecast_units,
            target_units,
            distribution_method,
            notes,
            target_committed_at
        `;

        if (result[0]) {
          committedRows.push(result[0]);
        }
      }

      return res.status(200).json({ committed: committedRows });
    }

    if (req.method === 'PUT') {
      const {
        productId,
        forecastMonth,
        forecastUnits,
        intakeUnits,
        openingStockUnits,
        distributionMethod = 'ly_mix',
        notes = null,
      } = req.body || {};
      const hasOpeningStockUnits = Object.prototype.hasOwnProperty.call(req.body || {}, 'openingStockUnits');

      if (!productId || !forecastMonth) {
        return res.status(400).json({ error: 'productId and forecastMonth are required' });
      }

      let forecastResult = null;
      if (forecastUnits != null) {
        const result = await sql`
          INSERT INTO product_monthly_forecasts (product_id, forecast_month, forecast_units, distribution_method, notes)
          VALUES (${productId}, ${forecastMonth}, ${forecastUnits}, ${distributionMethod}, ${notes})
          ON CONFLICT (product_id, forecast_month) DO UPDATE SET
            forecast_units = EXCLUDED.forecast_units,
            distribution_method = EXCLUDED.distribution_method,
            notes = EXCLUDED.notes,
            updated_at = CURRENT_TIMESTAMP
          RETURNING
            id,
            product_id,
            TO_CHAR(forecast_month, 'YYYY-MM-01') AS month_key,
            forecast_units,
            target_units,
            distribution_method,
            notes,
            target_committed_at
        `;
        forecastResult = result[0];
      }

      let weeklyOverrideResult = null;
      if (intakeUnits != null) {
        const result = await sql`
          INSERT INTO product_weekly_overrides (product_id, week_start_date, intake_override_units, notes)
          VALUES (
            ${productId},
            DATE_TRUNC('week', ${forecastMonth}::date)::date,
            ${intakeUnits},
            ${notes}
          )
          ON CONFLICT (product_id, week_start_date) DO UPDATE SET
            intake_override_units = EXCLUDED.intake_override_units,
            notes = COALESCE(EXCLUDED.notes, product_weekly_overrides.notes),
            updated_at = CURRENT_TIMESTAMP
          RETURNING
            id,
            product_id,
            TO_CHAR(week_start_date, 'YYYY-MM-DD') AS week_start_date,
            TO_CHAR(${forecastMonth}::date, 'YYYY-MM-01') AS month_key,
            intake_override_units,
            notes
        `;
        weeklyOverrideResult = result[0];
      }

      let openingStockOverrideResult = null;
      if (hasOpeningStockUnits) {
        if (openingStockUnits == null || openingStockUnits === '') {
          await sql`
            DELETE FROM product_monthly_opening_overrides
            WHERE product_id = ${productId}
              AND month_key = ${forecastMonth}
          `;
        } else {
          const result = await sql`
            INSERT INTO product_monthly_opening_overrides (product_id, month_key, opening_stock_units, notes)
            VALUES (${productId}, ${forecastMonth}, ${openingStockUnits}, ${notes})
            ON CONFLICT (product_id, month_key) DO UPDATE SET
              opening_stock_units = EXCLUDED.opening_stock_units,
              notes = COALESCE(EXCLUDED.notes, product_monthly_opening_overrides.notes),
              updated_at = CURRENT_TIMESTAMP
            RETURNING
              product_id,
              TO_CHAR(month_key, 'YYYY-MM-01') AS month_key,
              opening_stock_units,
              notes
          `;
          openingStockOverrideResult = result[0];
        }
      }

      return res.status(200).json({
        forecast: forecastResult,
        weeklyOverride: weeklyOverrideResult,
        openingStockOverride: openingStockOverrideResult,
      });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const products = await sql`
      SELECT
        p.id,
        p.name,
        p.stock
      FROM products p
      ORDER BY p.name
    `;

    const monthlyActuals = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', s.date), 'YYYY-MM-01') AS month_key,
        p.id AS product_id,
        p.name AS product_name,
        SUM(si.quantity)::int AS actual_units,
        COUNT(DISTINCT COALESCE(s.customer_id::text, s.customer, s.source_file))::int AS customers_buying,
        ROUND(
          CASE
            WHEN COUNT(DISTINCT COALESCE(s.customer_id::text, s.customer, s.source_file)) = 0 THEN NULL
            ELSE SUM(si.quantity)::numeric / COUNT(DISTINCT COALESCE(s.customer_id::text, s.customer, s.source_file))::numeric
          END,
          2
        ) AS units_per_customer
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      WHERE s.status = 'completed'
      GROUP BY 1, 2, 3
      ORDER BY 1, 3
    `;

    const monthlyForecasts = await sql`
      SELECT
        TO_CHAR(pmf.forecast_month, 'YYYY-MM-01') AS month_key,
        pmf.product_id,
        p.name AS product_name,
        pmf.forecast_units,
        pmf.target_units,
        pmf.distribution_method,
        pmf.notes,
        pmf.target_committed_at
      FROM product_monthly_forecasts pmf
      JOIN products p ON p.id = pmf.product_id
      ORDER BY pmf.forecast_month, p.name
    `;

    const weeklyOverrides = await sql`
      SELECT
        product_id,
        TO_CHAR(week_start_date, 'YYYY-MM-DD') AS week_start_date,
        TO_CHAR(DATE_TRUNC('month', week_start_date + INTERVAL '6 days'), 'YYYY-MM-01') AS month_key,
        intake_override_units,
        notes
      FROM product_weekly_overrides
      ORDER BY week_start_date, product_id
    `;

    const weeklyActuals = await sql`
      WITH weekly AS (
        SELECT
          p.id AS product_id,
          DATE_TRUNC('week', s.date)::date AS week_start,
          SUM(si.quantity)::int AS units
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        WHERE s.status = 'completed'
        GROUP BY p.id, DATE_TRUNC('week', s.date)
      )
      SELECT
        product_id,
        TO_CHAR(DATE_TRUNC('month', week_start + INTERVAL '6 days'), 'YYYY-MM-01') AS month_key,
        ROW_NUMBER() OVER (
          PARTITION BY product_id, DATE_TRUNC('month', week_start + INTERVAL '6 days')
          ORDER BY week_start
        )::int AS week_index,
        TO_CHAR(week_start, 'YYYY-MM-DD') AS week_start,
        units
      FROM weekly
      ORDER BY month_key, week_index, product_id
    `;

    const openingStockOverrides = await sql`
      SELECT
        product_id,
        TO_CHAR(month_key, 'YYYY-MM-01') AS month_key,
        opening_stock_units,
        notes
      FROM product_monthly_opening_overrides
      ORDER BY month_key, product_id
    `;

    return res.status(200).json({
      products,
      monthlyActuals,
      monthlyForecasts,
      weeklyOverrides,
      weeklyActuals,
      openingStockOverrides,
    });
  } catch (error) {
    console.error('Line flow error:', error);
    return res.status(500).json({
      error: 'Failed to load line flow data',
      details: error.message,
    });
  }
}
