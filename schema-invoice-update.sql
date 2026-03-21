-- Add invoice-related fields to existing tables

-- Update Sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) UNIQUE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255) DEFAULT 'Due on receipt';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);

-- Update Orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255) DEFAULT 'Due on receipt';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending';

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- Create invoice log table for tracking
CREATE TABLE IF NOT EXISTS invoice_logs (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  order_id INTEGER REFERENCES orders(id),
  sale_id INTEGER REFERENCES sales(id),
  customer_email VARCHAR(255),
  pdf_url TEXT,
  pdf_size_bytes INTEGER,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  email_error TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_invoice_logs_invoice_number ON invoice_logs(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_order_id ON invoice_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_logs_sale_id ON invoice_logs(sale_id);

-- Add comments for documentation
COMMENT ON COLUMN sales.invoice_number IS 'Unique invoice number for this sale';
COMMENT ON COLUMN sales.invoice_generated_at IS 'Timestamp when invoice was generated';
COMMENT ON COLUMN orders.delivery_status IS 'Status: pending, in_transit, delivered, cancelled';
COMMENT ON TABLE invoice_logs IS 'Tracks all invoice generation and email sending attempts';
