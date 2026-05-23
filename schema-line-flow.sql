-- Brazil Berry - Line Flow planning schema
-- Adds product planning fields and forecast/planning input tables.

BEGIN;

-- Product-level planning settings
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS lead_time_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS safety_stock_units INTEGER,
  ADD COLUMN IF NOT EXISTS target_cover_weeks DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS default_shrinkage_rate DECIMAL(10, 4),
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

-- Monthly forecast input per SKU
CREATE TABLE IF NOT EXISTS product_monthly_forecasts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  forecast_month DATE NOT NULL,
  forecast_units INTEGER NOT NULL,
  distribution_method VARCHAR(50) NOT NULL DEFAULT 'ly_mix',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, forecast_month)
);

-- Weekly overrides and intake planning inputs
CREATE TABLE IF NOT EXISTS product_weekly_overrides (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  forecast_override_units INTEGER,
  intake_override_units INTEGER,
  shrinkage_override_units INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_product_monthly_forecasts_product_month
  ON product_monthly_forecasts(product_id, forecast_month);

CREATE INDEX IF NOT EXISTS idx_product_weekly_overrides_product_week
  ON product_weekly_overrides(product_id, week_start_date);

DROP TRIGGER IF EXISTS update_product_monthly_forecasts_updated_at ON product_monthly_forecasts;
CREATE TRIGGER update_product_monthly_forecasts_updated_at
  BEFORE UPDATE ON product_monthly_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_weekly_overrides_updated_at ON product_weekly_overrides;
CREATE TRIGGER update_product_weekly_overrides_updated_at
  BEFORE UPDATE ON product_weekly_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
