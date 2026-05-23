# Berry Brazil Açai - Sales & Stock Management

Responsive sales and inventory management system for Berry Brazil Açai field salespeople and warehouse staff.

## 🚀 NEW: Migrated to Vercel + Neon

This project has been migrated from AWS to Vercel + Neon PostgreSQL for simpler deployment and better developer experience.

**📖 Start here:** `MIGRATION_COMPLETE.md` or `QUICK_START.md` (15-minute deploy)

## Features

### For Field Sales (Mobile-Optimized)
- Real-time dashboard with sales and stock information
- Quick point-of-sale interface
- Order tracking
- Stock level monitoring
- Automated invoice generation and email delivery

### For Warehouse Staff (Desktop-Optimized)
- Receive incoming stock
- Stock adjustments and corrections
- Physical stock count management
- Stock movement history
- Product catalog management
- Order delivery tracking with automatic invoicing

### ERP-Like Features
- Sales forecasting by category
- Trend analysis and projections
- Smart reorder recommendations
- Category performance analytics
- Historical data analysis
- Professional PDF invoice generation
- Automated email delivery to customers

## Tech Stack (Modern Serverless)
- **Frontend**: React + Vite
- **Backend**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL (serverless)
- **Hosting**: Vercel (edge network)
- **Cost**: FREE tier eligible

## How It Works

**Everything runs in the cloud - not on your computer!**

1. Push your code to GitHub
2. Vercel automatically deploys your app
3. You get a public URL (e.g., `https://your-app.vercel.app`)
4. Users access it from any device with a browser
5. No installation, no servers to maintain

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- AWS Account (free tier)
- AWS CLI installed and configured

### Local Development

Use local development first. It is the fastest way to validate the frontend against the serverless API routes before dealing with Vercel environment setup.

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Neon database URL
```

3. Run the local app:
```bash
npm run dev
```

This starts:
- Frontend: `http://localhost:5173`
- Local API server: `http://localhost:3000`

The frontend proxies `/api` requests to the local API server, which executes the same handlers from the `/api` directory that Vercel will use in production.

### Vercel Deployment (Production)

**Quick Start:**

1. Set up Neon database at https://neon.tech
2. Run the SQL schema from `schema.sql`
3. Push code to GitHub
4. Import project in Vercel
5. Add DATABASE_URL environment variable
6. Deploy!

📖 **Detailed guide:** See `VERCEL_DEPLOYMENT.md` for complete step-by-step instructions

## Project Structure
- `/src` - React application source
- `/src/components` - Reusable UI components
- `/src/pages` - Main application pages
- `/src/lib` - API client and utilities
- `/api` - Vercel serverless functions
- `/amplify` - AWS Amplify configuration (deprecated)

## 📚 Documentation

See **[DOCS_INDEX.md](DOCS_INDEX.md)** for complete documentation index.

Quick links:
- [QUICK_START.md](QUICK_START.md) - Deploy in 15 minutes
- [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md) - Migration overview
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Detailed deployment guide
