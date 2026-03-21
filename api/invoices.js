import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const sql = getDb();

  try {
    if (req.method === 'GET') {
      const { invoiceNumber, orderId, saleId, limit = 50 } = req.query;

      // Get specific invoice by number
      if (invoiceNumber) {
        const invoice = await sql`
          SELECT 
            il.*,
            COALESCE(o.customer, s.customer) as customer_name,
            COALESCE(o.total, s.total) as total,
            COALESCE(o.status, s.status) as status
          FROM invoice_logs il
          LEFT JOIN orders o ON il.order_id = o.id
          LEFT JOIN sales s ON il.sale_id = s.id
          WHERE il.invoice_number = ${invoiceNumber}
          ORDER BY il.generated_at DESC
          LIMIT 1
        `;
        
        if (!invoice.length) {
          return res.status(404).json({ error: 'Invoice not found' });
        }
        
        return res.status(200).json(invoice[0]);
      }

      // Get invoice by order ID
      if (orderId) {
        const invoice = await sql`
          SELECT 
            il.*,
            o.customer as customer_name,
            o.total,
            o.status,
            o.delivery_status
          FROM invoice_logs il
          JOIN orders o ON il.order_id = o.id
          WHERE il.order_id = ${orderId}
          ORDER BY il.generated_at DESC
          LIMIT 1
        `;
        
        if (!invoice.length) {
          return res.status(404).json({ error: 'Invoice not found for this order' });
        }
        
        return res.status(200).json(invoice[0]);
      }

      // Get invoice by sale ID
      if (saleId) {
        const invoice = await sql`
          SELECT 
            il.*,
            s.customer as customer_name,
            s.total,
            s.status
          FROM invoice_logs il
          JOIN sales s ON il.sale_id = s.id
          WHERE il.sale_id = ${saleId}
          ORDER BY il.generated_at DESC
          LIMIT 1
        `;
        
        if (!invoice.length) {
          return res.status(404).json({ error: 'Invoice not found for this sale' });
        }
        
        return res.status(200).json(invoice[0]);
      }

      // List all invoices (paginated)
      const invoices = await sql`
        SELECT 
          il.*,
          COALESCE(o.customer, s.customer) as customer_name,
          COALESCE(o.total, s.total) as total,
          COALESCE(o.status, s.status) as status,
          CASE 
            WHEN il.order_id IS NOT NULL THEN 'order'
            WHEN il.sale_id IS NOT NULL THEN 'sale'
          END as type
        FROM invoice_logs il
        LEFT JOIN orders o ON il.order_id = o.id
        LEFT JOIN sales s ON il.sale_id = s.id
        ORDER BY il.generated_at DESC
        LIMIT ${parseInt(limit)}
      `;

      return res.status(200).json(invoices);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Invoice retrieval error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve invoices', 
      details: error.message 
    });
  }
}
