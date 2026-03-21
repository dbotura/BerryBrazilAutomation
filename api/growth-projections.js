import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    // GET - Retrieve projections
    if (req.method === 'GET') {
      const { months = 12 } = req.query;

      // Get customer growth projections
      const customerProjections = await sql`
        SELECT * FROM customer_growth_projections
        WHERE projection_month >= DATE_TRUNC('month', NOW())
        ORDER BY projection_month ASC
        LIMIT ${parseInt(months)}
      `;

      // Get product line metrics
      const productMetrics = await sql`
        SELECT 
          plm.*,
          c.name as category_name,
          p.name as product_name
        FROM product_line_metrics plm
        LEFT JOIN categories c ON plm.category_id = c.id
        LEFT JOIN products p ON plm.product_id = p.id
        ORDER BY c.name, p.name
      `;

      // Get product-specific projections
      const productProjections = await sql`
        SELECT 
          pcp.*,
          c.name as category_name,
          p.name as product_name
        FROM product_customer_projections pcp
        LEFT JOIN categories c ON pcp.category_id = c.id
        LEFT JOIN products p ON pcp.product_id = p.id
        WHERE pcp.projection_month >= DATE_TRUNC('month', NOW())
        ORDER BY pcp.projection_month ASC, c.name, p.name
        LIMIT ${parseInt(months) * 20}
      `;

      // Get current customer base
      const currentBase = await sql`
        SELECT 
          COALESCE(SUM(total_active_customers), 0) as total_customers,
          MAX(snapshot_date) as last_snapshot_date
        FROM customer_base_snapshot
        WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM customer_base_snapshot)
      `;

      return res.status(200).json({
        customerProjections,
        productMetrics,
        productProjections,
        currentCustomerBase: currentBase[0] || { total_customers: 0, last_snapshot_date: null },
      });
    }

    // POST - Create or update projections
    if (req.method === 'POST') {
      const { type, data } = req.body;

      if (type === 'customer_growth') {
        // Upsert customer growth projection
        const { projection_month, new_customers_count, churned_customers_count, notes } = data;
        
        const result = await sql`
          INSERT INTO customer_growth_projections 
            (projection_month, new_customers_count, churned_customers_count, notes)
          VALUES 
            (${projection_month}, ${new_customers_count}, ${churned_customers_count || 0}, ${notes})
          ON CONFLICT (projection_month) 
          DO UPDATE SET 
            new_customers_count = ${new_customers_count},
            churned_customers_count = ${churned_customers_count || 0},
            notes = ${notes},
            updated_at = NOW()
          RETURNING *
        `;

        return res.status(200).json(result[0]);
      }

      if (type === 'product_metrics') {
        // Upsert product line metrics
        const { 
          category_id, 
          product_id, 
          avg_units_per_customer_monthly,
          avg_units_per_customer_weekly,
          notes 
        } = data;

        // Calculate weekly from monthly if not provided
        const weeklyAvg = avg_units_per_customer_weekly || (avg_units_per_customer_monthly / 4.33);

        const result = await sql`
          INSERT INTO product_line_metrics 
            (category_id, product_id, avg_units_per_customer_monthly, avg_units_per_customer_weekly, notes)
          VALUES 
            (${category_id}, ${product_id}, ${avg_units_per_customer_monthly}, ${weeklyAvg}, ${notes})
          ON CONFLICT (category_id, product_id) 
          DO UPDATE SET 
            avg_units_per_customer_monthly = ${avg_units_per_customer_monthly},
            avg_units_per_customer_weekly = ${weeklyAvg},
            notes = ${notes},
            updated_at = NOW()
          RETURNING *
        `;

        return res.status(200).json(result[0]);
      }

      if (type === 'product_projection') {
        // Upsert product-specific customer projection
        const { 
          projection_month, 
          category_id, 
          product_id, 
          new_customers_count,
          avg_units_per_customer,
          notes 
        } = data;

        const result = await sql`
          INSERT INTO product_customer_projections 
            (projection_month, category_id, product_id, new_customers_count, avg_units_per_customer, notes)
          VALUES 
            (${projection_month}, ${category_id}, ${product_id}, ${new_customers_count}, ${avg_units_per_customer}, ${notes})
          ON CONFLICT (projection_month, category_id, product_id) 
          DO UPDATE SET 
            new_customers_count = ${new_customers_count},
            avg_units_per_customer = ${avg_units_per_customer},
            notes = ${notes},
            updated_at = NOW()
          RETURNING *
        `;

        return res.status(200).json(result[0]);
      }

      if (type === 'customer_snapshot') {
        // Record current customer base snapshot
        const { 
          snapshot_date, 
          total_active_customers,
          new_customers_this_period,
          churned_customers_this_period,
          category_id,
          product_id,
          notes 
        } = data;

        const result = await sql`
          INSERT INTO customer_base_snapshot 
            (snapshot_date, total_active_customers, new_customers_this_period, 
             churned_customers_this_period, category_id, product_id, notes)
          VALUES 
            (${snapshot_date}, ${total_active_customers}, ${new_customers_this_period || 0},
             ${churned_customers_this_period || 0}, ${category_id}, ${product_id}, ${notes})
          ON CONFLICT (snapshot_date, category_id, product_id) 
          DO UPDATE SET 
            total_active_customers = ${total_active_customers},
            new_customers_this_period = ${new_customers_this_period || 0},
            churned_customers_this_period = ${churned_customers_this_period || 0},
            notes = ${notes}
          RETURNING *
        `;

        return res.status(200).json(result[0]);
      }

      return res.status(400).json({ error: 'Invalid type' });
    }

    // PUT - Bulk update projections
    if (req.method === 'PUT') {
      const { projections } = req.body;

      if (!Array.isArray(projections)) {
        return res.status(400).json({ error: 'projections must be an array' });
      }

      const results = [];

      for (const proj of projections) {
        const result = await sql`
          INSERT INTO customer_growth_projections 
            (projection_month, new_customers_count, churned_customers_count, notes)
          VALUES 
            (${proj.projection_month}, ${proj.new_customers_count}, ${proj.churned_customers_count || 0}, ${proj.notes})
          ON CONFLICT (projection_month) 
          DO UPDATE SET 
            new_customers_count = ${proj.new_customers_count},
            churned_customers_count = ${proj.churned_customers_count || 0},
            notes = ${proj.notes},
            updated_at = NOW()
          RETURNING *
        `;
        results.push(result[0]);
      }

      return res.status(200).json(results);
    }

    // DELETE - Remove projection
    if (req.method === 'DELETE') {
      const { type, id } = req.query;

      if (type === 'customer_growth') {
        await sql`DELETE FROM customer_growth_projections WHERE id = ${id}`;
      } else if (type === 'product_metrics') {
        await sql`DELETE FROM product_line_metrics WHERE id = ${id}`;
      } else if (type === 'product_projection') {
        await sql`DELETE FROM product_customer_projections WHERE id = ${id}`;
      } else {
        return res.status(400).json({ error: 'Invalid type' });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Growth projections error:', error);
    return res.status(500).json({ 
      error: 'Failed to manage growth projections', 
      details: error.message 
    });
  }
}
