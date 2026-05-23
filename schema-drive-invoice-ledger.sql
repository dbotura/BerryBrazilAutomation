-- Brazil Berry - Google Drive invoice import ledger
-- Tracks invoice files discovered in Google Drive before/after they are imported into sales.

BEGIN;

CREATE TABLE IF NOT EXISTS drive_invoice_import_ledger (
  id SERIAL PRIMARY KEY,
  ledger_key TEXT NOT NULL UNIQUE,
  drive_file_id TEXT UNIQUE,
  drive_name TEXT NOT NULL,
  normalized_drive_name TEXT NOT NULL,
  customer_folder TEXT,
  folder_path TEXT,
  parsed_customer TEXT,
  parsed_invoice_number TEXT,
  mime_type TEXT,
  modified_time TIMESTAMP,
  web_view_link TEXT,
  status TEXT NOT NULL DEFAULT 'discovered',
  match_status TEXT,
  match_type TEXT,
  sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  source_csv TEXT,
  notes TEXT,
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  imported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drive_invoice_import_ledger_status
  ON drive_invoice_import_ledger(status);

CREATE INDEX IF NOT EXISTS idx_drive_invoice_import_ledger_customer_invoice
  ON drive_invoice_import_ledger(customer_folder, parsed_invoice_number);

CREATE INDEX IF NOT EXISTS idx_drive_invoice_import_ledger_modified_time
  ON drive_invoice_import_ledger(modified_time);

DROP TRIGGER IF EXISTS update_drive_invoice_import_ledger_updated_at ON drive_invoice_import_ledger;
CREATE TRIGGER update_drive_invoice_import_ledger_updated_at
  BEFORE UPDATE ON drive_invoice_import_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
