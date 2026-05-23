# Invoice System - Quick Reference Card

## 🚀 Quick Setup (15 minutes)

1. **Resend Account** → https://resend.com → Get API key
2. **Add to Vercel** → Environment Variables → RESEND_API_KEY
3. **Update Database** → Run `schema-invoice-update.sql` in Neon
4. **Install** → `npm install`
5. **Test** → See testing section below

## 📧 Environment Variables

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx
INVOICE_TEST_MODE=true
INVOICE_TEST_RECIPIENT=your-test-inbox@example.com
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_TEST_FOLDER_ID=your_google_drive_test_folder_id
# GOOGLE_DRIVE_FOLDER_ID=your_google_drive_production_folder_id
# GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
# GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
# GOOGLE_OAUTH_REFRESH_TOKEN=your-google-oauth-refresh-token
# GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=invoice-drive-uploader@your-project.iam.gserviceaccount.com
# GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
COMPANY_EMAIL=invoices@yourdomain.com
COMPANY_NAME=Berry Brazil Açai
COMPANY_ADDRESS=123 Açai Street, Sydney NSW 2000
COMPANY_PHONE=+61 2 1234 5678
COMPANY_TAX_ID=12 345 678 901
```

## Google Drive Notes

- `GOOGLE_DRIVE_TEST_FOLDER_ID` is used while `INVOICE_TEST_MODE=true`
- `GOOGLE_DRIVE_FOLDER_ID` is used for production uploads
- Use OAuth credentials for a personal Drive folder
- Use a service account for a Shared Drive or a folder shared with that service account

## 🔌 API Endpoints

### Generate Invoice (Manual)
```bash
POST /api/generate-invoice
{
  "orderId": 123,      # OR saleId
  "sendEmail": true
}
# Returns: PDF file + sends email
```

### Update Order Status (Auto-invoice)
```bash
PUT /api/update-order-status
{
  "orderId": 123,
  "status": "delivered"
}
# Automatically generates and sends invoice!
```

## 🧪 Quick Test

```bash
# 1. Create test order
POST /api/orders
{
  "customer": "Test",
  "customer_email": "your@email.com",
  "items": [{"productId": 1, "quantity": 1, "price": 15}],
  "total": 15
}

# 2. Mark as delivered (triggers invoice)
PUT /api/update-order-status
{
  "orderId": 1,
  "status": "delivered"
}

# 3. Check your email! 📧
```

## 💻 Frontend Integration

### Add to Orders Page
```javascript
import DeliveryStatusButton from '../components/DeliveryStatusButton';

<DeliveryStatusButton
  orderId={order.id}
  currentStatus={order.delivery_status}
  onStatusChange={fetchOrders}
/>
```

### Add Manual Invoice Button
```javascript
import InvoiceButton from '../components/InvoiceButton';

<InvoiceButton
  orderId={order.id}
  customerEmail={order.customer_email}
/>
```

## 🎨 Customization

### Change Colors
Edit `api/lib/invoice-template.js`:
```javascript
companyName: { color: '#YOUR_COLOR' }
tableHeader: { backgroundColor: '#YOUR_COLOR' }
```

### Add Logo
1. Add `public/logo.png`
2. In template: `<Image src="/logo.png" />`

## 🔍 Monitoring

### Check Sent Emails
- Resend Dashboard → Logs
- View delivery status
- Check for errors

### Check Google Drive Uploads
- Open your configured Drive test folder
- Confirm the uploaded PDF name matches `TEST-invoice-...`
- If uploads fail, check local server logs for the Google API error

### Check Generated Invoices
```sql
SELECT * FROM invoice_logs 
ORDER BY generated_at DESC 
LIMIT 10;
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not sending | Verify RESEND_API_KEY and COMPANY_EMAIL |
| PDF not generating | Run `npm install`, check Vercel logs |
| Auto-invoice not working | Ensure customer_email exists on order |
| Domain not verified | Use test email or verify domain in Resend |

## 💰 Cost

- **Free**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails

## 📚 Full Documentation

- **INVOICE_SYSTEM_SUMMARY.md** - Complete overview
- **INVOICE_SETUP.md** - Detailed setup guide

## ✅ Production Checklist

- [ ] Resend account created
- [ ] Domain verified (or test email)
- [ ] Environment variables set
- [ ] Database updated
- [ ] Dependencies installed
- [ ] Test invoice sent successfully
- [ ] Template customized
- [ ] Logo added (optional)
- [ ] Staff trained

## 🎯 Workflow

```
Order Created → Order Shipped → Mark as Delivered
                                      ↓
                              Invoice Generated
                                      ↓
                              Email Sent to Customer
                                      ↓
                              PDF Downloaded
```

---

**Need help?** See INVOICE_SETUP.md for detailed instructions.
