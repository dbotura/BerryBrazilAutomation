import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const products = await sql`
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
      `;
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const { name, price, stock, minStock, categoryId, unit } = req.body;
      const result = await sql`
        INSERT INTO products (name, price, stock, min_stock, category_id, unit)
        VALUES (${name}, ${price}, ${stock}, ${minStock || 0}, ${categoryId}, ${unit})
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, price, stock, minStock, categoryId, unit } = req.body;
      const currentRows = await sql`
        SELECT * FROM products WHERE id = ${id} LIMIT 1
      `;
      const current = currentRows[0];
      if (!current) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const result = await sql`
        UPDATE products 
        SET
            name = ${name ?? current.name},
            price = ${price ?? current.price},
            stock = ${stock ?? current.stock},
            min_stock = ${minStock ?? current.min_stock},
            category_id = ${categoryId ?? current.category_id},
            unit = ${unit ?? current.unit}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
