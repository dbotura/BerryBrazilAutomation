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
COMPANY_EMAIL=invoices@yourdomain.com
COMPANY_NAME=Berry Brazil Açai
COMPANY_ADDRESS=123 Açai Street, Sydney NSW 2000
COMPANY_PHONE=+61 2 1234 5678
COMPANY_TAX_ID=12 345 678 901
```

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
