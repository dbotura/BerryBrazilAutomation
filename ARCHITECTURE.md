# System Architecture

## New Architecture (Vercel + Neon)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│  (Field Sales, Warehouse Staff, Managers)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                       │
│  (Global CDN - Serves static files from nearest location)   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────────┐
│   FRONTEND   │         │   API ROUTES     │
│              │         │                  │
│  React App   │────────▶│  Serverless      │
│  (Vite)      │  Calls  │  Functions       │
│              │         │                  │
│  - Dashboard │         │  /api/products   │
│  - Products  │         │  /api/categories │
│  - Sales     │         │  /api/sales      │
│  - Stock     │         │  /api/stock-...  │
│  - Warehouse │         │                  │
└──────────────┘         └────────┬─────────┘
                                  │
                                  │ SQL Queries
                                  ▼
                         ┌──────────────────┐
                         │  NEON DATABASE   │
                         │                  │
                         │  PostgreSQL      │
                         │  (Serverless)    │
                         │                  │
                         │  - products      │
                         │  - categories    │
                         │  - sales         │
                         │  - stock_moves   │
                         │  - orders        │
                         │  - purchase_orders│
                         └──────────────────┘
```

## Old Architecture (AWS)

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY                               │
│  (Hosting + CloudFront CDN)                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────────┐
│   FRONTEND   │         │   AWS APPSYNC    │
│              │         │                  │
│  React App   │────────▶│  GraphQL API     │
│              │ GraphQL │                  │
└──────────────┘         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   DYNAMODB       │
                         │                  │
                         │  NoSQL Database  │
                         └──────────────────┘
```

## Key Differences

| Aspect | Old (AWS) | New (Vercel + Neon) |
|--------|-----------|---------------------|
| **Hosting** | AWS Amplify | Vercel Edge Network |
| **API** | GraphQL (AppSync) | REST (Serverless Functions) |
| **Database** | DynamoDB (NoSQL) | PostgreSQL (SQL) |
| **Deployment** | AWS CLI | Git Push |
| **Configuration** | Multiple AWS services | Single vercel.json |
| **Local Dev** | Mock data | Real database |

## Data Flow

### Creating a Product

```
User fills form
    │
    ▼
Frontend validates
    │
    ▼
POST /api/products
    │
    ▼
Vercel Function
    │
    ├─ Validates data
    ├─ Connects to Neon
    └─ Executes SQL INSERT
        │
        ▼
    Neon PostgreSQL
        │
        ├─ Stores data
        └─ Returns new product
            │
            ▼
        Response to frontend
            │
            ▼
        UI updates
```

### Recording a Sale

```
User adds items to cart
    │
    ▼
User clicks "Complete Sale"
    │
    ▼
POST /api/sales
    │
    ▼
Vercel Function
    │
    ├─ Creates sale record
    ├─ Creates sale_items records
    └─ Updates product stock
        │
        ▼
    Neon PostgreSQL (Transaction)
        │
        ├─ INSERT into sales
        ├─ INSERT into sale_items
        └─ UPDATE products.stock
            │
            ▼
        Response to frontend
            │
            ▼
        UI shows success
```

## Database Schema

```
categories
├── id (PK)
├── name
├── description
└── timestamps

products
├── id (PK)
├── name
├── price
├── stock
├── min_stock
├── category_id (FK → categories)
├── unit
└── timestamps

stock_movements
├── id (PK)
├── product_id (FK → products)
├── type (in/out)
├── quantity
├── previous_stock
├── new_stock
├── reason
├── notes
├── performed_by
└── date

sales
├── id (PK)
├── total
├── date
├── status
├── customer
└── notes

sale_items
├── id (PK)
├── sale_id (FK → sales)
├── product_id (FK → products)
├── product_name
├── quantity
├── price
└── subtotal

orders
├── id (PK)
├── customer
├── total
├── status
└── date

order_items
├── id (PK)
├── order_id (FK → orders)
├── product_id (FK → products)
├── product_name
├── quantity
└── price

purchase_orders
├── id (PK)
├── po_number
├── supplier
├── total_cost
├── order_date
├── expected_delivery_date
├── actual_delivery_date
├── status
├── notes
└── created_by

purchase_order_items
├── id (PK)
├── purchase_order_id (FK → purchase_orders)
├── product_id (FK → products)
├── product_name
├── quantity
├── unit_cost
└── total_cost
```

## API Endpoints

### Products
- `GET /api/products` - List all products with category info
- `POST /api/products` - Create new product
- `PUT /api/products` - Update existing product
- `DELETE /api/products?id=X` - Delete product

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category

### Sales
- `GET /api/sales` - List all sales with items
- `POST /api/sales` - Create sale (with items, updates stock)

### Stock Movements
- `GET /api/stock-movements` - List movements (optional productId filter)
- `POST /api/stock-movements` - Record movement (updates product stock)

## Deployment Flow

```
Developer makes changes
    │
    ▼
git add . && git commit -m "..."
    │
    ▼
git push origin main
    │
    ▼
GitHub receives push
    │
    ▼
Vercel detects change
    │
    ├─ Pulls latest code
    ├─ Runs npm install
    ├─ Runs npm run build
    ├─ Deploys to edge network
    └─ Updates production URL
        │
        ▼
    Deployment complete (1-2 min)
        │
        ▼
    Users see new version
```

## Security Layers

```
┌─────────────────────────────────────┐
│  HTTPS (Automatic with Vercel)      │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  CORS Headers (api/db.js)           │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Input Validation (API functions)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Parameterized Queries (SQL)        │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Environment Variables (DATABASE_URL)│
└─────────────────────────────────────┘
```

## Scalability

### Current Setup (Free Tier)
- **Vercel**: 100 GB bandwidth/month
- **Neon**: 0.5 GB storage, 1 compute unit
- **Suitable for**: 10-50 users, 1000s of products

### Growth Path
- **Vercel Pro**: $20/month (1 TB bandwidth)
- **Neon Scale**: $19/month (10 GB storage)
- **Suitable for**: 100s of users, 10,000s of products

### Enterprise
- **Vercel Enterprise**: Custom pricing
- **Neon Business**: Custom pricing
- **Suitable for**: 1000s of users, unlimited products

## Monitoring

```
Application
    │
    ├─ Vercel Analytics (built-in)
    │  └─ Page views, performance
    │
    ├─ Vercel Logs (built-in)
    │  └─ Function execution, errors
    │
    └─ Neon Monitoring (built-in)
       └─ Query performance, connections
```

## Backup Strategy

### Automatic (Neon)
- Point-in-time recovery
- Daily backups
- 7-day retention (free tier)

### Manual
- Export data via SQL
- Download as CSV
- Store in separate location

---

**This architecture is production-ready and scales with your business!**
