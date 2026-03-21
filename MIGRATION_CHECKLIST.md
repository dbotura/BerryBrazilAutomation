# AWS to Vercel + Neon Migration Checklist

## ✅ Completed

- [x] Removed AWS Amplify dependencies from package.json
- [x] Added Neon PostgreSQL client
- [x] Created PostgreSQL database schema (schema.sql)
- [x] Created Vercel serverless API endpoints
  - [x] /api/products
  - [x] /api/categories
  - [x] /api/sales
  - [x] /api/stock-movements
- [x] Created frontend API client (src/lib/api.js)
- [x] Created vercel.json configuration
- [x] Updated .gitignore for Vercel
- [x] Created deployment documentation
- [x] Removed AWS-specific files

## 🔄 To Do Before Deployment

### 1. Set Up Neon Database
- [ ] Create account at https://neon.tech
- [ ] Create new project
- [ ] Copy connection string
- [ ] Run schema.sql in Neon SQL Editor

### 2. Set Up GitHub
- [ ] Create GitHub repository
- [ ] Initialize git in project
- [ ] Push code to GitHub
- [ ] Verify all files uploaded

### 3. Deploy to Vercel
- [ ] Create account at https://vercel.com
- [ ] Import GitHub repository
- [ ] Add DATABASE_URL environment variable
- [ ] Deploy project
- [ ] Test deployment

### 4. Update Frontend Components
- [ ] Update Products.jsx to use api.getProducts()
- [ ] Update Sales.jsx to use api.getSales()
- [ ] Update Stock.jsx to use api.getStockMovements()
- [ ] Update Warehouse.jsx to use api.createStockMovement()
- [ ] Update Dashboard.jsx to fetch real data
- [ ] Test all pages with real API

### 5. Additional API Endpoints (if needed)
- [ ] /api/orders (for Orders page)
- [ ] /api/purchase-orders (for PO tracking)
- [ ] /api/dashboard (for dashboard stats)
- [ ] /api/reports (for reports page)

### 6. Testing
- [ ] Test product CRUD operations
- [ ] Test sales creation
- [ ] Test stock movements
- [ ] Test data persistence
- [ ] Test on mobile devices
- [ ] Test on different browsers

## 📚 Documentation Reference

- `GITHUB_SETUP.md` - How to push to GitHub
- `VERCEL_DEPLOYMENT.md` - Complete deployment guide
- `schema.sql` - Database schema
- `.env.example` - Environment variables template

## 🚀 Quick Start Commands

```bash
# Install new dependencies
npm install

# Test locally (after setting up .env.local)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 💡 Key Differences from AWS

| Feature | AWS (Old) | Vercel + Neon (New) |
|---------|-----------|---------------------|
| Database | DynamoDB (NoSQL) | PostgreSQL (SQL) |
| API | AppSync GraphQL | REST API (Serverless Functions) |
| Auth | Cognito | To be implemented |
| Hosting | Amplify | Vercel |
| Deployment | AWS CLI | Git push |
| Cost | AWS Free Tier | Vercel + Neon Free Tier |

## 🔐 Security Notes

- Never commit .env or .env.local files
- Store DATABASE_URL only in Vercel environment variables
- Consider adding authentication before production use
- Review CORS settings in api/db.js if needed

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
