import { renderToBuffer } from '@react-pdf/renderer';
import { put } from '@vercel/blob';
import { getDb, corsHeaders } from './db.js';
import { InvoiceDocument } from './lib/invoice-template.js';
import { sendInvoiceEmail } from './lib/email-service.js';
import {
  getInvoiceAttachmentName,
  resolveInvoiceEmailRecipient,
} from './lib/invoice-test-mode.js';
import { isGoogleDriveUploadEnabled, uploadInvoicePdfToGoogleDrive } from './lib/google-drive.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  try {
    const { orderId, saleId, sendEmail = true } = req.body;

    if (!orderId && !saleId) {
      return res.status(400).json({ error: 'orderId or saleId is required' });
    }

    // Fetch order/sale data with items
    let invoiceData;
    
    if (saleId) {
      // Fetch sale data
      const sales = await sql`
        SELECT s.*, 
               json_agg(json_build_object(
                 'productName', si.product_name,
                 'quantity', si.quantity,
                 'price', si.price,
                 'subtotal', si.subtotal
               )) as items
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.id = ${saleId}
        GROUP BY s.id
      `;

      if (!sales.length) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      invoiceData = sales[0];
    } else {
      // Fetch order data
      const orders = await sql`
        SELECT o.*,
               json_agg(json_build_object(
                 'productName', oi.product_name,
                 'quantity', oi.quantity,
                 'price', oi.price,
                 'subtotal', oi.quantity * oi.price
               )) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = ${orderId}
        GROUP BY o.id
      `;

      if (!orders.length) {
        return res.status(404).json({ error: 'Order not found' });
      }

      invoiceData = orders[0];
    }

    // Generate invoice number if not exists
    const invoiceNumber = invoiceData.invoice_number || 
      `INV-${new Date().getFullYear()}-${String(invoiceData.id).padStart(6, '0')}`;

    // Prepare invoice data for PDF
    const invoice = {
      invoiceNumber,
      date: invoiceData.date || new Date(),
      dueDate: invoiceData.due_date,
      customerName: invoiceData.customer,
      customerEmail: invoiceData.customer_email,
      customerPhone: invoiceData.customer_phone,
      customerAddress: invoiceData.customer_address,
      items: invoiceData.items.filter(item => item.productName), // Remove null items
      notes: invoiceData.notes,
      paymentTerms: invoiceData.payment_terms || 'Due on receipt',
      poNumber: invoiceData.po_number,
    };

    // Company details from environment variables
    const company = {
      name: process.env.COMPANY_NAME || 'Berry Brazil Açai',
      address: process.env.COMPANY_ADDRESS || 'Your Address',
      phone: process.env.COMPANY_PHONE || 'Your Phone',
      taxId: process.env.COMPANY_TAX_ID || 'Your ABN',
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      InvoiceDocument({ invoice, company })
    );

    // Store PDF in Vercel Blob Storage and optionally Google Drive.
    let blobUrl = null;
    let driveUrl = null;
    let pdfUrl = null;
    try {
      const blob = await put(`invoices/${invoiceNumber}.pdf`, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });
      blobUrl = blob.url;
      console.log('PDF stored in blob at:', blobUrl);
    } catch (blobError) {
      console.error('Failed to store PDF in blob storage:', blobError);
    }

    if (isGoogleDriveUploadEnabled()) {
      try {
        const driveFile = await uploadInvoicePdfToGoogleDrive({
          fileName: getInvoiceAttachmentName(invoiceNumber),
          pdfBuffer,
        });
        driveUrl = driveFile?.url || null;
        console.log('PDF stored in Google Drive at:', driveUrl);
      } catch (driveError) {
        console.error('Failed to store PDF in Google Drive:', driveError);
      }
    }

    pdfUrl = blobUrl || driveUrl;

    // Update database with invoice number and PDF URL
    if (saleId) {
      await sql`
        UPDATE sales 
        SET invoice_number = ${invoiceNumber},
            invoice_generated_at = NOW(),
            invoice_pdf_url = ${pdfUrl}
        WHERE id = ${saleId}
      `;
    } else {
      await sql`
        UPDATE orders 
        SET invoice_number = ${invoiceNumber},
            invoice_generated_at = NOW(),
            invoice_pdf_url = ${pdfUrl},
            status = 'completed'
        WHERE id = ${orderId}
      `;
    }

    // Log invoice generation
    await sql`
      INSERT INTO invoice_logs (
        invoice_number, 
        order_id, 
        sale_id, 
        customer_email,
        pdf_url,
        pdf_size_bytes
      )
      VALUES (
        ${invoiceNumber},
        ${orderId || null},
        ${saleId || null},
        ${invoiceData.customer_email},
        ${pdfUrl},
        ${pdfBuffer.length}
      )
    `;

    // Send email if requested and customer email exists
    let emailResult = null;
    const emailConfig = resolveInvoiceEmailRecipient(invoiceData.customer_email);
    const emailSendingEnabled = sendEmail && Boolean(process.env.RESEND_API_KEY);

    if (emailSendingEnabled && emailConfig.recipient) {
      try {
        emailResult = await sendInvoiceEmail({
          to: emailConfig.recipient,
          invoiceNumber,
          pdfBuffer,
          customerName: invoiceData.customer,
          originalRecipient: emailConfig.originalRecipient,
          pdfUrl, // Include URL in email for download link
        });

        // Update log with email status
        await sql`
          UPDATE invoice_logs
          SET email_sent = true,
              email_sent_at = NOW()
          WHERE invoice_number = ${invoiceNumber}
        `;
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        
        // Log email error
        await sql`
          UPDATE invoice_logs
          SET email_sent = false,
              email_error = ${emailError.message}
          WHERE invoice_number = ${invoiceNumber}
        `;
        
        emailResult = { success: false, error: emailError.message };
      }
    } else if (sendEmail) {
      console.warn(
        !process.env.RESEND_API_KEY
          ? 'Invoice email skipped because RESEND_API_KEY is not configured'
          : 'Invoice email skipped because no recipient was available'
      );
    }

    // Return PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceNumber}.pdf"`);
    
    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Invoice generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate invoice', 
      details: error.message 
    });
  }
}
