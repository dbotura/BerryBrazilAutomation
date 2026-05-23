import { Resend } from 'resend';
import {
  getInvoiceAttachmentName,
  getInvoiceEmailSubject,
  isInvoiceTestMode,
} from './invoice-test-mode.js';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInvoiceEmail({ to, invoiceNumber, pdfBuffer, customerName, originalRecipient }) {
  try {
    const resend = getResendClient();
    const subject = getInvoiceEmailSubject(invoiceNumber);
    const attachmentName = getInvoiceAttachmentName(invoiceNumber);
    const testModeNotice = isInvoiceTestMode()
      ? `
            <div style="background: #fff7ed; border: 1px solid #fdba74; color: #9a3412; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <strong>Test Mode:</strong> This invoice email was redirected for testing.
              ${originalRecipient ? `<br/>Original customer email: ${originalRecipient}` : ''}
            </div>
        `
      : '';

    const { data, error } = await resend.emails.send({
      from: process.env.COMPANY_EMAIL || 'invoices@yourdomain.com',
      to: to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #6b21a8 0%, #7c3aed 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .invoice-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #6b21a8;
            }
            .invoice-number {
              font-size: 24px;
              color: #6b21a8;
              font-weight: bold;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: #6b21a8;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍇 ${process.env.COMPANY_NAME || 'Berry Brazil Açai'}</h1>
          </div>
          
          <div class="content">
            ${testModeNotice}
            <p>Dear ${customerName || 'Valued Customer'},</p>
            
            <p>Thank you for your order! Please find your invoice attached to this email.</p>
            
            <div class="invoice-box">
              <p style="margin: 0; color: #666;">Invoice Number</p>
              <p class="invoice-number">${invoiceNumber}</p>
            </div>
            
            <p>Your invoice is attached as a PDF document. If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">
              <strong>Payment Information:</strong><br>
              Please refer to the invoice for payment details and terms.
            </p>
            
            <div class="footer">
              <p>
                ${process.env.COMPANY_NAME || 'Berry Brazil Açai'}<br>
                ${process.env.COMPANY_ADDRESS || ''}<br>
                ${process.env.COMPANY_PHONE || ''}<br>
                ABN: ${process.env.COMPANY_TAX_ID || ''}
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 20px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: attachmentName,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendInvoiceEmailPlainText({ to, invoiceNumber, pdfBuffer, customerName, originalRecipient }) {
  // Fallback plain text version
  try {
    const resend = getResendClient();
    const subject = getInvoiceEmailSubject(invoiceNumber);
    const attachmentName = getInvoiceAttachmentName(invoiceNumber);
    const testModeNotice = isInvoiceTestMode()
      ? `TEST MODE: This invoice email was redirected for testing.${originalRecipient ? ` Original customer email: ${originalRecipient}` : ''}\n\n`
      : '';

    const { data, error } = await resend.emails.send({
      from: process.env.COMPANY_EMAIL || 'invoices@yourdomain.com',
      to: to,
      subject,
      text: `
${testModeNotice}\
Dear ${customerName || 'Valued Customer'},

Thank you for your order!

Invoice Number: ${invoiceNumber}

Your invoice is attached as a PDF document. If you have any questions about this invoice, please don't hesitate to contact us.

Payment Information:
Please refer to the invoice for payment details and terms.

${process.env.COMPANY_NAME || 'Berry Brazil Açai'}
${process.env.COMPANY_ADDRESS || ''}
${process.env.COMPANY_PHONE || ''}
ABN: ${process.env.COMPANY_TAX_ID || ''}

This is an automated email. Please do not reply directly to this message.
      `,
      attachments: [
        {
          filename: attachmentName,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}
