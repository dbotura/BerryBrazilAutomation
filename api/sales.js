import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const sales = await sql`
        SELECT s.*, 
               json_agg(json_build_object(
                 'id', si.id,
                 'productId', si.product_id,
                 'productName', si.product_name,
                 'quantity', si.quantity,
                 'price', si.price,
                 'subtotal', si.subtotal
               )) as items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        GROUP BY s.id
        ORDER BY s.date DESC
      `;
      return res.status(200).json(sales);
    }

    if (req.method === 'POST') {
      const { items, total, customer, notes, status = 'completed' } = req.body;
      
      const saleResult = await sql`
        INSERT INTO sales (total, status, customer, notes)
        VALUES (${total}, ${status}, ${customer}, ${notes})
        RETURNING *
      `;
      
      const saleId = saleResult[0].id;
      
      for (const item of items) {
        await sql`
          INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, subtotal)
          VALUES (${saleId}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.price}, ${item.subtotal})
        `;
        
        await sql`
          UPDATE products 
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.productId}
        `;
      }
      
      return res.status(201).json(saleResult[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
