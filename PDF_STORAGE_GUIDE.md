# PDF Storage & Access Guide

Complete guide to storing, retrieving, and managing invoice PDFs.

## 📦 Storage Solution: Vercel Blob

We use **Vercel Blob Storage** to store invoice PDFs. It's:
- Serverless and scalable
- Integrated with Vercel
- Public or private access
- Automatic CDN distribution
- Pay-as-you-go pricing

## 🔧 Setup (5 minutes)

### Step 1: Enable Vercel Blob

Vercel Blob is automatically available in your Vercel project. No manual setup needed!

The `BLOB_READ_WRITE_TOKEN` is automatically injected by Vercel when you deploy.

### Step 2: Update Database

Run the updated `schema-invoice-update.sql` which adds:
- `invoice_pdf_url` column to orders and sales tables
- `pdf_url` and `pdf_size_bytes` columns to invoice_logs table

```sql
-- Already in schema-invoice-update.sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs `@vercel/blob` package.

### Step 4: Deploy

```bash
git add .
git commit -m "Add PDF storage"
git push
```

Vercel will automatically set up blob storage on deployment.

## 📍 How PDFs Are Stored

### Automatic Storage

When an invoice is generated:

1. PDF is created in memory
2. Uploaded to Vercel Blob: `invoices/{invoice-number}.pdf`
3. Public URL is returned: `https://xxxxx.public.blob.vercel-storage.com/invoices/INV-2024-000001.pdf`
4. URL is saved to database
5. PDF is attached to email

### Storage Location

```
Vercel Blob Storage
└── invoices/
    ├── INV-2024-000001.pdf
    ├── INV-2024-000002.pdf
    ├── INV-2024-000003.pdf
    └── ...
```

### Database Records

```sql
-- Orders table
orders.invoice_pdf_url = 'https://xxxxx.public.blob.vercel-storage.com/...'

-- Sales table
sales.invoice_pdf_url = 'https://xxxxx.public.blob.vercel-storage.com/...'

-- Invoice logs table
invoice_logs.pdf_url = 'https://xxxxx.public.blob.vercel-storage.com/...'
invoice_logs.pdf_size_bytes = 45678
```

## 🔍 Accessing Stored PDFs

### Method 1: Via Invoice History Page (Recommended)

1. Navigate to `/invoices` page in your app
2. View all generated invoices
3. Click 📄 icon to download PDF
4. Click 📧 icon to resend email

**Features:**
- Search by invoice number or customer
- Filter by date range
- View email status
- Download PDFs directly
- See file sizes and generation dates

### Method 2: Via API

#### Get All Invoices

```bash
GET /api/invoices
```

**Response:**
```json
[
  {
    "id": 1,
    "invoice_number": "INV-2024-000001",
    "order_id": 123,
    "customer_email": "customer@example.com",
    "pdf_url": "https://xxxxx.public.blob.vercel-storage.com/invoices/INV-2024-000001.pdf",
    "pdf_size_bytes": 45678,
    "email_sent": true,
    "generated_at": "2024-03-07T10:00:00Z"
  }
]
```

#### Get Specific Invoice

```bash
# By invoice number
GET /api/invoices?invoiceNumber=INV-2024-000001

# By order ID
GET /api/invoices?orderId=123

# By sale ID
GET /api/invoices?saleId=456
```

### Method 3: Direct Database Query

```sql
-- Get invoice PDF URL for an order
SELECT invoice_pdf_url, invoice_number, invoice_generated_at
FROM orders
WHERE id = 123;

-- Get all invoices with PDFs
SELECT 
  invoice_number,
  pdf_url,
  pdf_size_bytes,
  email_sent,
  generated_at
FROM invoice_logs
WHERE pdf_url IS NOT NULL
ORDER BY generated_at DESC;

-- Get invoices without PDFs (failed storage)
SELECT *
FROM invoice_logs
WHERE pdf_url IS NULL;
```

### Method 4: Direct URL Access

If you have the PDF URL, you can access it directly:

```
https://xxxxx.public.blob.vercel-storage.com/invoices/INV-2024-000001.pdf
```

The URL is:
- ✅ Public (anyone with URL can access)
- ✅ Permanent (doesn't expire)
- ✅ CDN-distributed (fast worldwide)
- ✅ Direct download or browser view

## 🎨 Frontend Integration

### Add Invoice History Link to Navigation

```javascript
// In Layout.jsx or Navigation component
<nav>
  <Link to="/invoices">📄 Invoices</Link>
</nav>
```

### Add Route

```javascript
// In App.jsx
import Invoices from './pages/Invoices';

<Route path="/invoices" element={<Invoices />} />
```

### Display PDF Link in Orders

```javascript
// In Orders.jsx
{order.invoice_pdf_url && (
  <a 
    href={order.invoice_pdf_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="btn btn-secondary"
  >
    📄 View Invoice
  </a>
)}
```

### Embed PDF Viewer

```javascript
// Show PDF in modal or iframe
<iframe 
  src={invoice.pdf_url} 
  width="100%" 
  height="600px"
  title="Invoice PDF"
/>
```

## 💾 Storage Management

### Check Storage Usage

In Vercel Dashboard:
1. Go to your project
2. Click "Storage" tab
3. View Blob storage usage
4. See file count and total size

### List All Stored PDFs

```javascript
// API endpoint to list blob files
import { list } from '@vercel/blob';

const { blobs } = await list({
  prefix: 'invoices/',
});

console.log(blobs); // Array of all invoice PDFs
```

### Delete Old PDFs (Optional)

```javascript
// API endpoint to delete old invoices
import { del } from '@vercel/blob';

await del(pdfUrl);
```

## 💰 Cost

### Vercel Blob Pricing

**Free Tier:**
- 500 MB storage
- 1 GB bandwidth/month
- Perfect for small businesses

**Pro Plan ($20/month):**
- 100 GB storage
- 1 TB bandwidth/month
- Suitable for most businesses

**Enterprise:**
- Custom limits
- Volume discounts

### Cost Estimation

Average invoice PDF: ~50 KB

| Invoices/Month | Storage | Bandwidth | Cost |
|----------------|---------|-----------|------|
| 100 | 5 MB | 5 MB | FREE |
| 1,000 | 50 MB | 50 MB | FREE |
| 10,000 | 500 MB | 500 MB | FREE |
| 50,000 | 2.5 GB | 2.5 GB | $20/month |

## 🔒 Security & Privacy

### Public vs Private Access

**Current Setup: Public**
- Anyone with URL can access
- URLs are hard to guess (long random strings)
- No authentication required
- Good for: Sharing invoices with customers

**To Make Private:**

```javascript
// In generate-invoice.js
const blob = await put(`invoices/${invoiceNumber}.pdf`, pdfBuffer, {
  access: 'public', // Change to 'private'
  contentType: 'application/pdf',
});
```

With private access:
- Requires authentication token
- Generate signed URLs for temporary access
- More secure but more complex

### Best Practices

1. **Use HTTPS** (automatic with Vercel)
2. **Don't expose URLs publicly** (only share with customers)
3. **Monitor access logs** (in Vercel dashboard)
4. **Set up alerts** for unusual activity
5. **Regular backups** (export to S3 or Google Drive)

## 🔄 Backup Strategy

### Option 1: Database Backup

URLs are stored in database, so regular database backups include invoice references.

### Option 2: Export to External Storage

Create a scheduled job to copy PDFs to:
- AWS S3
- Google Cloud Storage
- Dropbox
- Google Drive

### Option 3: Manual Download

Use the Invoices page to bulk download PDFs for local backup.

## 🆘 Troubleshooting

### PDF Not Stored

**Symptoms:**
- `invoice_pdf_url` is NULL
- PDF sent via email but not accessible later

**Causes:**
1. Blob storage not enabled
2. Network error during upload
3. Insufficient permissions

**Solutions:**
1. Check Vercel dashboard → Storage
2. Check function logs for errors
3. Verify `@vercel/blob` is installed
4. Redeploy application

### PDF URL Returns 404

**Causes:**
1. PDF was deleted
2. URL is incorrect
3. Blob storage issue

**Solutions:**
1. Regenerate invoice
2. Check URL in database
3. Contact Vercel support

### Storage Quota Exceeded

**Symptoms:**
- New PDFs not storing
- Error: "Storage quota exceeded"

**Solutions:**
1. Upgrade to Pro plan
2. Delete old invoices
3. Implement retention policy

## 📊 Monitoring

### Track Storage Usage

```sql
-- Total PDFs stored
SELECT COUNT(*) FROM invoice_logs WHERE pdf_url IS NOT NULL;

-- Total storage used (approximate)
SELECT SUM(pdf_size_bytes) / 1024 / 1024 as total_mb
FROM invoice_logs;

-- Average PDF size
SELECT AVG(pdf_size_bytes) / 1024 as avg_kb
FROM invoice_logs;

-- Storage by month
SELECT 
  DATE_TRUNC('month', generated_at) as month,
  COUNT(*) as invoice_count,
  SUM(pdf_size_bytes) / 1024 / 1024 as storage_mb
FROM invoice_logs
WHERE pdf_url IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

### Set Up Alerts

In Vercel Dashboard:
1. Go to Settings → Notifications
2. Enable storage alerts
3. Set threshold (e.g., 80% of quota)
4. Add email recipients

## 🎯 Advanced Features

### Implement Retention Policy

Automatically delete invoices older than X years:

```javascript
// Scheduled function (run monthly)
import { del } from '@vercel/blob';

const oldInvoices = await sql`
  SELECT pdf_url 
  FROM invoice_logs 
  WHERE generated_at < NOW() - INTERVAL '7 years'
  AND pdf_url IS NOT NULL
`;

for (const invoice of oldInvoices) {
  await del(invoice.pdf_url);
  await sql`
    UPDATE invoice_logs 
    SET pdf_url = NULL 
    WHERE pdf_url = ${invoice.pdf_url}
  `;
}
```

### Generate Download Links

Create temporary signed URLs for private PDFs:

```javascript
import { generateSignedUrl } from '@vercel/blob';

const signedUrl = await generateSignedUrl(pdfUrl, {
  expiresIn: 3600, // 1 hour
});
```

### Bulk Export

Export all invoices for a date range:

```javascript
// API endpoint
GET /api/invoices/export?startDate=2024-01-01&endDate=2024-12-31

// Returns ZIP file with all PDFs
```

## ✅ Summary

You can access stored invoice PDFs through:

1. **Invoice History Page** (`/invoices`) - User-friendly interface
2. **API Endpoint** (`/api/invoices`) - Programmatic access
3. **Database Queries** - Direct SQL access
4. **Direct URLs** - Share with customers
5. **Vercel Dashboard** - Storage management

All PDFs are:
- ✅ Automatically stored when generated
- ✅ Accessible via public URLs
- ✅ Tracked in database
- ✅ CDN-distributed for fast access
- ✅ Included in email attachments

**Next Steps:**
1. Deploy the updated code
2. Generate a test invoice
3. Check the Invoices page
4. Verify PDF is accessible
5. Share URL with customer

---

**Need help?** Check Vercel Blob docs: https://vercel.com/docs/storage/vercel-blob
