-- Customer Growth Projections Schema
-- Allows users to plan future customer acquisition and sales

-- Product Lines (Categories with average units per customer)
CREATE TABLE IF NOT EXISTS product_line_metrics (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  avg_units_per_customer_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_units_per_customer_weekly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Customer Growth Projections (monthly planning)
CREATE TABLE IF NOT EXISTS customer_growth_projections (
  id SERIAL PRIMARY KEY,
  projection_month DATE NOT NULL, -- First day of the month
  new_customers_count INTEGER NOT NULL DEFAULT 0,
  churned_customers_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  UNIQUE(projection_month)
);

-- Product-specific customer projections (for different products/categories)
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

-- Current customer base tracking
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_line_metrics_category ON product_line_metrics(category_id);
CREATE INDEX IF NOT EXISTS idx_product_line_metrics_product ON product_line_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_growth_month ON customer_growth_projections(projection_month);
CREATE INDEX IF NOT EXISTS idx_product_customer_projections_month ON product_customer_projections(projection_month);
CREATE INDEX IF NOT EXISTS idx_customer_snapshot_date ON customer_base_snapshot(snapshot_date);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_growth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_line_metrics_updated_at 
  BEFORE UPDATE ON product_line_metrics
  FOR EACH ROW EXECUTE FUNCTION update_growth_updated_at();

CREATE TRIGGER update_customer_growth_projections_updated_at 
  BEFORE UPDATE ON customer_growth_projections
  FOR EACH ROW EXECUTE FUNCTION update_growth_updated_at();

CREATE TRIGGER update_product_customer_projections_updated_at 
  BEFORE UPDATE ON product_customer_projections
  FOR EACH ROW EXECUTE FUNCTION update_growth_updated_at();

-- Comments for documentation
COMMENT ON TABLE product_line_metrics IS 'Average units per customer for each product/category';
COMMENT ON TABLE customer_growth_projections IS 'Monthly projections of new customer acquisition';
COMMENT ON TABLE product_customer_projections IS 'Product-specific customer growth projections';
COMMENT ON TABLE customer_base_snapshot IS 'Historical tracking of customer base size';

COMMENT ON COLUMN product_line_metrics.avg_units_per_customer_monthly IS 'Average units a customer buys per month';
COMMENT ON COLUMN product_line_metrics.avg_units_per_customer_weekly IS 'Average units a customer buys per week';
COMMENT ON COLUMN customer_growth_projections.projection_month IS 'Month when new customers will be onboarded';
COMMENT ON COLUMN customer_growth_projections.new_customers_count IS 'Number of new customers expected';

-- Sample data for testing
INSERT INTO customer_growth_projections (projection_month, new_customers_count, notes) VALUES
  (DATE_TRUNC('month', NOW() + INTERVAL '1 month'), 2, 'Q1 expansion'),
  (DATE_TRUNC('month', NOW() + INTERVAL '2 months'), 3, 'Q1 expansion'),
  (DATE_TRUNC('month', NOW() + INTERVAL '3 months'), 2, 'Q2 start'),
  (DATE_TRUNC('month', NOW() + INTERVAL '4 months'), 4, 'Q2 growth'),
  (DATE_TRUNC('month', NOW() + INTERVAL '5 months'), 3, 'Q2 growth'),
  (DATE_TRUNC('month', NOW() + INTERVAL '6 months'), 5, 'Mid-year push')
ON CONFLICT (projection_month) DO NOTHING;
