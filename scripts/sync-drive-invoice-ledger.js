import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const args = parseArgs(process.argv.slice(2));
const sourceCsv = path.resolve(
  process.cwd(),
  args.source || '../build/drive_invoice_discovery/2026-05-22/drive_sales_reconciliation.csv',
);

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const rows = readCsv(sourceCsv);
const sql = neon(process.env.DATABASE_URL);
let upserted = 0;
let skipped = 0;

for (const row of rows) {
  const driveName = row.drive_name || row.name || '';
  if (!driveName) {
    skipped += 1;
    continue;
  }

  const parsed = parseInvoiceName(driveName);
  const parsedCustomer = row.parsed_drive_customer || parsed?.customer || '';
  const parsedInvoiceNumber = row.parsed_drive_invoice_number || parsed?.invoiceNumber || '';
  const normalizedDriveName = normalizeInvoiceName(driveName);
  const ledgerKey = row.ledger_key || buildLedgerKey({
    customerFolder: row.customer_folder || '',
    parsedCustomer,
    parsedInvoiceNumber,
    driveName,
  });
  const saleId = row.db_sale_id ? Number(row.db_sale_id) : null;
  const status = saleId ? 'already_in_sales' : 'discovered';
  const importedAt = saleId ? new Date().toISOString() : null;

  await sql`
    INSERT INTO drive_invoice_import_ledger (
      ledger_key,
      drive_file_id,
      drive_name,
      normalized_drive_name,
      customer_folder,
      folder_path,
      parsed_customer,
      parsed_invoice_number,
      mime_type,
      modified_time,
      web_view_link,
      status,
      match_status,
      match_type,
      sale_id,
      source_csv,
      imported_at
    )
    VALUES (
      ${ledgerKey},
      ${row.drive_file_id || row.id || null},
      ${driveName},
      ${normalizedDriveName},
      ${row.customer_folder || null},
      ${row.folder_path || null},
      ${parsedCustomer || null},
      ${parsedInvoiceNumber || null},
      ${row.mime_type || null},
      ${row.modified_time || null},
      ${row.web_view_link || null},
      ${status},
      ${row.match_status || null},
      ${row.match_type || null},
      ${saleId},
      ${sourceCsv},
      ${importedAt}
    )
    ON CONFLICT (ledger_key) DO UPDATE SET
      drive_file_id = COALESCE(EXCLUDED.drive_file_id, drive_invoice_import_ledger.drive_file_id),
      drive_name = EXCLUDED.drive_name,
      normalized_drive_name = EXCLUDED.normalized_drive_name,
      customer_folder = EXCLUDED.customer_folder,
      folder_path = EXCLUDED.folder_path,
      parsed_customer = EXCLUDED.parsed_customer,
      parsed_invoice_number = EXCLUDED.parsed_invoice_number,
      mime_type = EXCLUDED.mime_type,
      modified_time = EXCLUDED.modified_time,
      web_view_link = EXCLUDED.web_view_link,
      status = CASE
        WHEN EXCLUDED.sale_id IS NOT NULL THEN 'already_in_sales'
        ELSE drive_invoice_import_ledger.status
      END,
      match_status = EXCLUDED.match_status,
      match_type = EXCLUDED.match_type,
      sale_id = COALESCE(EXCLUDED.sale_id, drive_invoice_import_ledger.sale_id),
      source_csv = EXCLUDED.source_csv,
      last_seen_at = CURRENT_TIMESTAMP,
      imported_at = COALESCE(EXCLUDED.imported_at, drive_invoice_import_ledger.imported_at),
      updated_at = CURRENT_TIMESTAMP
  `;

  upserted += 1;
}

console.log(JSON.stringify({
  source_csv: sourceCsv,
  rows: rows.length,
  upserted,
  skipped,
}, null, 2));

function buildLedgerKey({ customerFolder, parsedCustomer, parsedInvoiceNumber, driveName }) {
  const customerKey = normalizeCustomer(parsedCustomer || customerFolder || 'unknown-customer');
  const invoiceKey = parsedInvoiceNumber ? String(Number(parsedInvoiceNumber)) : 'no-invoice-number';
  const fileKey = normalizeInvoiceName(driveName);

  return `customer=${customerKey}|invoice=${invoiceKey}|file=${fileKey}`;
}

function parseInvoiceName(value) {
  const base = String(value || '')
    .replace(/\.(docx|pdf)$/i, '')
    .replace(/^Copy of\s+/i, '')
    .trim();
  const match = base.match(/^(.+?)\s+INV\s+0*([0-9]+)(?:\([0-9]+\))?$/i);
  if (!match) return null;

  return {
    customer: match[1].trim(),
    invoiceNumber: String(Number(match[2])),
  };
}

function normalizeInvoiceName(value) {
  return String(value || '')
    .replace(/\.(docx|pdf)$/i, '')
    .replace(/^Copy of\s+/i, '')
    .replace(/\([0-9]+\)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeCustomer(value) {
  return String(value || '')
    .replace(/^Copy of\s+/i, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === '--source') {
      parsed.source = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--source=')) {
      parsed.source = arg.split('=').slice(1).join('=');
    }
  }
  return parsed;
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const [headerLine, ...lines] = content.trimEnd().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    });
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}
