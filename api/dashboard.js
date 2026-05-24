import { getDb, corsHeaders } from './db.js'

export default async function handler(req, res) {
  const headers = corsHeaders()

  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sql = getDb()
  try {
    const [summary] = await sql`
      WITH completed AS (
        SELECT *
        FROM sales
        WHERE status = 'completed'
      )
      SELECT
        COALESCE(
          SUM(CASE WHEN date::date = CURRENT_DATE THEN total ELSE 0 END),
          0
        )::numeric(12,2) AS today_sales,
        COALESCE(
          SUM(CASE WHEN date::date >= CURRENT_DATE - INTERVAL '6 days' THEN total ELSE 0 END),
          0
        )::numeric(12,2) AS week_sales,
        COALESCE(
          SUM(CASE WHEN date::date >= CURRENT_DATE - INTERVAL '29 days' THEN total ELSE 0 END),
          0
        )::numeric(12,2) AS month_sales,
        COALESCE(
          COUNT(*) FILTER (WHERE date::date >= CURRENT_DATE - INTERVAL '29 days'),
          0
        )::int AS month_orders,
        COALESCE(
          COUNT(DISTINCT COALESCE(customer, source_file))
          FILTER (WHERE date::date >= CURRENT_DATE - INTERVAL '29 days'),
          0
        )::int AS month_customers
      FROM completed
    `

    const lowStockRows = await sql`
      SELECT
        COUNT(*)::int AS low_stock_count
      FROM products
      WHERE stock <= COALESCE(min_stock, 0)
    `

    const dailyMonthSales = await sql`
      SELECT
        TO_CHAR(date::date, 'YYYY-MM-DD') AS sale_date,
        TO_CHAR(date::date, 'DD Mon') AS label,
        COALESCE(SUM(total), 0)::numeric(12,2) AS revenue
      FROM sales
      WHERE status = 'completed'
        AND date::date >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY date::date
      ORDER BY sale_date
    `

    const topProducts = await sql`
      SELECT
        si.product_id,
        COALESCE(p.name, si.product_name) AS product_name,
        COALESCE(SUM(si.quantity), 0)::int AS units_sold,
        COALESCE(SUM(si.subtotal), 0)::numeric(12,2) AS revenue
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'completed'
        AND s.date::date >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY si.product_id, COALESCE(p.name, si.product_name)
      ORDER BY units_sold DESC, revenue DESC
      LIMIT 8
    `

    const topCustomers = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(s.customer), ''), 'Unknown Customer') AS customer_name,
        COALESCE(SUM(si.quantity), 0)::int AS total_units,
        COALESCE(
          SUM(
            CASE
              WHEN LOWER(COALESCE(p.name, si.product_name, '')) LIKE '%10kg%'
              THEN si.quantity
              ELSE 0
            END
          ),
          0
        )::int AS total_10kg_buckets,
        COALESCE(SUM(si.subtotal), 0)::numeric(12,2) AS total_spent
      FROM sales s
      LEFT JOIN sale_items si ON si.sale_id = s.id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'completed'
        AND s.date::date >= CURRENT_DATE - INTERVAL '29 days'
      GROUP BY COALESCE(NULLIF(TRIM(s.customer), ''), 'Unknown Customer')
      ORDER BY total_units DESC, total_10kg_buckets DESC, total_spent DESC
      LIMIT 8
    `

    return res.status(200).json({
      summary: {
        todaySales: Number(summary?.today_sales || 0),
        weekSales: Number(summary?.week_sales || 0),
        monthSales: Number(summary?.month_sales || 0),
        monthOrders: Number(summary?.month_orders || 0),
        monthCustomers: Number(summary?.month_customers || 0),
        lowStock: Number(lowStockRows?.[0]?.low_stock_count || 0),
      },
      dailyMonthSales: dailyMonthSales.map((row) => ({
        date: row.sale_date,
        label: row.label,
        revenue: Number(row.revenue || 0),
      })),
      topProducts: topProducts.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        unitsSold: Number(row.units_sold || 0),
        revenue: Number(row.revenue || 0),
      })),
      topCustomers: topCustomers.map((row) => ({
        customerName: row.customer_name,
        totalUnits: Number(row.total_units || 0),
        total10kgBuckets: Number(row.total_10kg_buckets || 0),
        totalSpent: Number(row.total_spent || 0),
      })),
    })
  } catch (error) {
    console.error('Dashboard query error:', error)
    return res.status(500).json({ error: 'Failed to load dashboard data', details: error.message })
  }
}
