-- Brazil Berry - Line Flow target snapshot fields

BEGIN;

ALTER TABLE product_monthly_forecasts
  ADD COLUMN IF NOT EXISTS target_units INTEGER,
  ADD COLUMN IF NOT EXISTS target_committed_at TIMESTAMP;

COMMIT;
