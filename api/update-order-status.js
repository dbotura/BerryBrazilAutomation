import { getDb, corsHeaders } from './db.js';
import { getInvoiceTestRecipient, isInvoiceTestMode } from './lib/invoice-test-mode.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  try {
    const { orderId, status, deliveryDate } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId and status are required' });
    }

    // Valid statuses
    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses 
      });
    }

    // Update order status
    const result = await sql`
      UPDATE orders 
      SET delivery_status = ${status},
          delivery_date = ${status === 'delivered' ? (deliveryDate || new Date()) : null}
      WHERE id = ${orderId}
      RETURNING *
    `;

    if (!result.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result[0];

    // If status is 'delivered', automatically generate and send invoice
    if (status === 'delivered' && (order.customer_email || getInvoiceTestRecipient())) {
      try {
        // Call the invoice generation endpoint internally
        const requestOrigin = req.headers?.origin || `http://localhost:${process.env.API_PORT || 3000}`;
        const invoiceResponse = await fetch(
          `${requestOrigin}/api/generate-invoice`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              sendEmail: true,
            }),
          }
        );

        if (!invoiceResponse.ok) {
          console.error('Failed to generate invoice:', await invoiceResponse.text());
        } else {
          console.log('Invoice generated and sent successfully');
        }
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        // Don't fail the status update if invoice generation fails
      }
    }

    return res.status(200).json({
      success: true,
      order,
      message: status === 'delivered' 
        ? isInvoiceTestMode()
          ? `Order marked as delivered. Invoice will be generated in test mode and sent to ${getInvoiceTestRecipient() || 'the configured test recipient'}.`
          : 'Order marked as delivered. Invoice will be generated and sent.'
        : 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ 
      error: 'Failed to update order status', 
      details: error.message 
    });
  }
}
