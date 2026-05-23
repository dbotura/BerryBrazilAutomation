-- Brazil Berry - Line Flow monthly opening stock overrides

BEGIN;

CREATE TABLE IF NOT EXISTS product_monthly_opening_overrides (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  month_key DATE NOT NULL,
  opening_stock_units INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_product_monthly_opening_overrides_product_month
  ON product_monthly_opening_overrides(product_id, month_key);

DROP TRIGGER IF EXISTS update_product_monthly_opening_overrides_updated_at ON product_monthly_opening_overrides;
CREATE TRIGGER update_product_monthly_opening_overrides_updated_at
  BEFORE UPDATE ON product_monthly_opening_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
