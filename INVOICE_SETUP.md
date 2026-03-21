# Invoice Generation & Email System Setup

Complete guide to setting up automated invoice generation and email delivery.

## Overview

When an order is marked as "delivered", the system will:
1. Automatically generate a professional PDF invoice
2. Email it to the customer
3. Store the invoice number in the database
4. Log the transaction

## Prerequisites

1. Neon database (already set up)
2. Resend account (for email delivery)
3. Verified domain or email address

## Step 1: Set Up Resend (5 minutes)

### Create Resend Account

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day, 3,000/month)
3. Verify your email address

### Get API Key

1. In Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Name it: "Acai Stock Management"
4. Copy the API key (starts with `re_`)
5. Save it securely

### Verify Your Domain (Recommended)

For production use, verify your domain:

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually 5-30 minutes)

**OR** use Resend's test domain for development:
- You can send from `onboarding@resend.dev` (for testing only)
- Limited to verified recipient emails

### Add Verified Email (For Testing)

1. Go to "Settings" → "Email Addresses"
2. Add your test email address
3. Verify it via the email you receive

## Step 2: Update Environment Variables

Add these to your Vercel environment variables:

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Company Email (must be verified in Resend)
COMPANY_EMAIL=invoices@yourdomain.com

# Company Details (appears on invoice)
COMPANY_NAME=Berry Brazil Açai
COMPANY_ADDRESS=123 Açai Street, Sydney NSW 2000, Australia
COMPANY_PHONE=+61 2 1234 5678
COMPANY_TAX_ID=12 345 678 901
```

### In Vercel Dashboard:

1. Go to your project
2. Settings → Environment Variables
3. Add each variable above
4. Check: Production, Preview, Development
5. Click "Save"
6. Redeploy your app

### For Local Development:

Create `.env.local`:

```bash
DATABASE_URL=your_neon_connection_string
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
COMPANY_EMAIL=invoices@yourdomain.com
COMPANY_NAME=Berry Brazil Açai
COMPANY_ADDRESS=123 Açai Street, Sydney NSW 2000, Australia
COMPANY_PHONE=+61 2 1234 5678
COMPANY_TAX_ID=12 345 678 901
```

## Step 3: Update Database Schema

Run the invoice schema update in Neon:

1. Open Neon SQL Editor
2. Copy contents of `schema-invoice-update.sql`
3. Paste and run
4. Verify success

This adds:
- Customer email, phone, address fields
- Invoice number tracking
- Delivery status tracking
- Invoice logs table

## Step 4: Install Dependencies

```bash
npm install
```

This installs:
- `@react-pdf/renderer` - PDF generation
- `resend` - Email delivery

## Step 5: Test the System

### Test Invoice Generation (Manual)

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": 1,
    "sendEmail": false
  }' \
  --output test-invoice.pdf

# Open test-invoice.pdf to verify
```

### Test Email Sending

1. Create a test sale with customer email:

```javascript
// In your app or via API
POST /api/sales
{
  "items": [...],
  "total": 100.00,
  "customer": "Test Customer",
  "customer_email": "your-verified-email@example.com",
  "status": "completed"
}
```

2. Generate and send invoice:

```javascript
POST /api/generate-invoice
{
  "saleId": 1,
  "sendEmail": true
}
```

3. Check your email inbox!

### Test Automatic Invoice on Delivery

1. Create an order with customer email
2. Update order status to "delivered":

```javascript
PUT /api/update-order-status
{
  "orderId": 1,
  "status": "delivered"
}
```

3. Invoice should be automatically generated and emailed!

## Step 6: Customize Invoice Template

Edit `api/lib/invoice-template.js` to customize:

- Colors and branding
- Logo (add Image component)
- Layout and sections
- Additional fields
- Footer text

### Add Your Logo

1. Add logo image to `public/logo.png`
2. In invoice template, add:

```javascript
import { Image } from '@react-pdf/renderer';

// In the header section:
<Image 
  src="/logo.png" 
  style={{ width: 100, height: 50, marginBottom: 10 }} 
/>
```

## API Endpoints

### Generate Invoice

```
POST /api/generate-invoice
```

**Body:**
```json
{
  "orderId": 123,        // OR saleId
  "saleId": 456,         // Use one or the other
  "sendEmail": true      // Optional, default true
}
```

**Response:**
- PDF file download
- Email sent if requested

### Update Order Status (Auto-generates invoice)

```
PUT /api/update-order-status
```

**Body:**
```json
{
  "orderId": 123,
  "status": "delivered",  // pending, in_transit, delivered, cancelled
  "deliveryDate": "2024-03-07T10:00:00Z"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "order": {...},
  "message": "Order marked as delivered. Invoice will be generated and sent."
}
```

## Frontend Integration

### Add Invoice Button to Orders Page

```javascript
// In Orders.jsx
import { api } from '../lib/api';

const handleGenerateInvoice = async (orderId) => {
  try {
    const response = await fetch(`/api/generate-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, sendEmail: true })
    });
    
    if (response.ok) {
      // Download PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      
      alert('Invoice generated and emailed to customer!');
    }
  } catch (error) {
    alert('Failed to generate invoice: ' + error.message);
  }
};

// In your order list:
<button onClick={() => handleGenerateInvoice(order.id)}>
  📄 Generate Invoice
</button>
```

### Add Delivery Status Update

```javascript
const handleMarkAsDelivered = async (orderId) => {
  try {
    const response = await fetch(`/api/update-order-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderId, 
        status: 'delivered' 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Order marked as delivered! Invoice sent to customer.');
      // Refresh orders list
    }
  } catch (error) {
    alert('Failed to update order: ' + error.message);
  }
};
```

## Troubleshooting

### Email Not Sending

**Check:**
1. RESEND_API_KEY is set correctly
2. COMPANY_EMAIL is verified in Resend
3. Customer email is valid
4. Check Resend dashboard → Logs for errors

**Common Issues:**
- Domain not verified → Use verified email or test domain
- API key invalid → Regenerate in Resend dashboard
- Rate limit exceeded → Upgrade Resend plan

### PDF Not Generating

**Check:**
1. @react-pdf/renderer is installed
2. Invoice data has required fields
3. Check Vercel function logs for errors

**Common Issues:**
- Missing required fields → Add validation
- Timeout → Reduce PDF complexity
- Memory limit → Optimize images/data

### Invoice Number Conflicts

**Check:**
1. Database has unique constraint on invoice_number
2. Invoice number generation logic

**Solution:**
- Use transaction ID + timestamp
- Add retry logic with incremented suffix

## Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] All environment variables set in Vercel
- [ ] Database schema updated
- [ ] Invoice template customized with branding
- [ ] Logo added (optional)
- [ ] Test email delivery
- [ ] Test PDF generation
- [ ] Test automatic invoice on delivery
- [ ] Review email template text
- [ ] Set up email monitoring
- [ ] Configure backup email address

## Cost

### Resend Pricing
- **Free**: 100 emails/day, 3,000/month
- **Pro**: $20/month, 50,000 emails/month
- **Business**: Custom pricing

### Vercel
- PDF generation uses serverless functions
- Included in free tier (100GB-hours/month)
- Typical invoice: ~1-2 seconds execution

## Email Template Customization

Edit `api/lib/email-service.js` to customize:
- Email subject line
- HTML template
- Plain text version
- Branding and colors

## Advanced Features

### Add Invoice History Page

Track all invoices in a dedicated page:
- List all generated invoices
- Resend invoice emails
- Download PDF copies
- View invoice status

### Add Invoice Reminders

Set up automated reminders for unpaid invoices:
- Check due dates daily
- Send reminder emails
- Escalate overdue invoices

### Add Payment Tracking

Track invoice payments:
- Mark as paid/unpaid
- Record payment method
- Generate receipts

## Support

- Resend Docs: https://resend.com/docs
- React-PDF Docs: https://react-pdf.org
- Vercel Functions: https://vercel.com/docs/functions

---

**Your invoice system is ready! Test it thoroughly before production use.**
