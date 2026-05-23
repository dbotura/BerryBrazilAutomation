-- Berry Brazil Acai - V1 Schema
-- Lean initial schema for local development and early Neon setup.
-- Includes:
-- - Core inventory and sales operations
-- - Orders and purchase orders
-- - Forecasting and customer growth planning
-- Excludes:
-- - Invoice-specific fields/tables
-- - Supplier master data

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movement audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason VARCHAR(255),
  notes TEXT,
  performed_by VARCHAR(255),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales header
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  customer VARCHAR(255),
  notes TEXT
);

-- Sales line items
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer VARCHAR(255),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer order items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Supplier purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(100) NOT NULL UNIQUE,
  supplier VARCHAR(255) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_by VARCHAR(255)
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL
);

-- Forecasting inputs: average units per customer
CREATE TABLE IF NOT EXISTS product_line_metrics (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  avg_units_per_customer_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_units_per_customer_weekly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  UNIQUE(category_id, product_id)
);

-- Monthly customer growth planning
CREATE TABLE IF NOT EXISTS customer_growth_projections (
  id SERIAL PRIMARY KEY,
  projection_month DATE NOT NULL,
  new_customers_count INTEGER NOT NULL DEFAULT 0,
  churned_customers_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  UNIQUE(projection_month)
);

-- Product/category-specific growth assumptions
CREATE TABLE IF NOT EXISTS product_customer_projections (
  id SERIAL PRIMARY KEY,
  projection_month DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  new_customers_count INTEGER NOT NULL DEFAULT 0,
  avg_units_per_customer DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(projection_month, category_id, product_id)
);

-- Customer base snapshots for historical tracking
CREATE TABLE IF NOT EXISTS customer_base_snapshot (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  total_active_customers INTEGER NOT NULL,
  new_customers_this_period INTEGER DEFAULT 0,
  churned_customers_this_period INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  product_id INTEGER REFERENCES products(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(snapshot_date, category_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name ON categories(name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_line_metrics_category ON product_line_metrics(category_id);
CREATE INDEX IF NOT EXISTS idx_product_line_metrics_product ON product_line_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_growth_month ON customer_growth_projections(projection_month);
CREATE INDEX IF NOT EXISTS idx_product_customer_projections_month ON product_customer_projections(projection_month);
CREATE INDEX IF NOT EXISTS idx_customer_snapshot_date ON customer_base_snapshot(snapshot_date);

-- Shared timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Core table update triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_line_metrics_updated_at ON product_line_metrics;
CREATE TRIGGER update_product_line_metrics_updated_at
  BEFORE UPDATE ON product_line_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_growth_projections_updated_at ON customer_growth_projections;
CREATE TRIGGER update_customer_growth_projections_updated_at
  BEFORE UPDATE ON customer_growth_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_customer_projections_updated_at ON product_customer_projections;
CREATE TRIGGER update_product_customer_projections_updated_at
  BEFORE UPDATE ON product_customer_projections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional starter projection rows for local testing
INSERT INTO customer_growth_projections (projection_month, new_customers_count, notes) VALUES
  (DATE_TRUNC('month', NOW() + INTERVAL '1 month'), 2, 'Initial growth test'),
  (DATE_TRUNC('month', NOW() + INTERVAL '2 months'), 3, 'Initial growth test'),
  (DATE_TRUNC('month', NOW() + INTERVAL '3 months'), 2, 'Initial growth test')
ON CONFLICT (projection_month) DO NOTHING;
