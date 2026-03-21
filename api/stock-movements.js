import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { productId } = req.query;
      
      let movements;
      if (productId) {
        movements = await sql`
          SELECT sm.*, p.name as product_name
          FROM stock_movements sm
          JOIN products p ON sm.product_id = p.id
          WHERE sm.product_id = ${productId}
          ORDER BY sm.date DESC
        `;
      } else {
        movements = await sql`
          SELECT sm.*, p.name as product_name
          FROM stock_movements sm
          JOIN products p ON sm.product_id = p.id
          ORDER BY sm.date DESC
          LIMIT 100
        `;
      }
      
      return res.status(200).json(movements);
    }

    if (req.method === 'POST') {
      const { productId, type, quantity, reason, notes, performedBy } = req.body;
      
      const product = await sql`SELECT stock FROM products WHERE id = ${productId}`;
      if (!product.length) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const previousStock = product[0].stock;
      const newStock = type === 'in' ? previousStock + quantity : previousStock - quantity;
      
      const movement = await sql`
        INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, notes, performed_by)
        VALUES (${productId}, ${type}, ${quantity}, ${previousStock}, ${newStock}, ${reason}, ${notes}, ${performedBy})
        RETURNING *
      `;
      
      await sql`
        UPDATE products SET stock = ${newStock} WHERE id = ${productId}
      `;
      
      return res.status(201).json(movement[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
