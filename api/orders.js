import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const orders = await sql`
        SELECT
          o.*,
          COALESCE(COUNT(oi.id), 0) AS item_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id
        ORDER BY o.date DESC, o.id DESC
      `;

      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      const {
        customer,
        customerEmail,
        customerPhone,
        customerAddress,
        paymentTerms,
        dueDate,
        items = [],
      } = req.body;

      if (!customer?.trim()) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }

      const total = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

      const orderResult = await sql`
        INSERT INTO orders (
          customer,
          customer_email,
          customer_phone,
          customer_address,
          total,
          status,
          payment_terms,
          due_date,
          delivery_status
        )
        VALUES (
          ${customer.trim()},
          ${customerEmail || null},
          ${customerPhone || null},
          ${customerAddress || null},
          ${total},
          ${'saved'},
          ${paymentTerms || 'Due on receipt'},
          ${dueDate || null},
          ${'pending'}
        )
        RETURNING *
      `;

      const order = orderResult[0];

      for (const item of items) {
        await sql`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
          VALUES (
            ${order.id},
            ${item.productId},
            ${item.productName},
            ${item.quantity},
            ${item.price}
          )
        `;
      }

      return res.status(201).json(order);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({
      error: 'Failed to load orders',
      details: error.message,
    });
  }
}
