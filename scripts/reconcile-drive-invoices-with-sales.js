import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const manifestPath = path.resolve(
  process.cwd(),
  process.argv[2] || '../build/drive_invoice_discovery/2026-05-22/drive_invoice_manifest.csv',
);
const outputDir = path.resolve(
  process.cwd(),
  process.argv[3] || path.dirname(manifestPath),
);

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const manifestRows = readCsv(manifestPath);
const dbRows = await loadSalesRows();
const salesExact = new Map();
const salesNormalized = new Map();
const salesInvoiceKey = new Map();

for (const row of dbRows) {
  if (row.source_file) {
    addToMap(salesExact, row.source_file, row);
    addToMap(salesNormalized, normalizeInvoiceName(row.source_file), row);
  }

  const parsed = parseInvoiceName(row.source_file || '');
  if (parsed) {
    addToMap(salesInvoiceKey, invoiceKey(parsed.customer, parsed.invoiceNumber), row);
  }

  if (row.customer && row.external_invoice_number) {
    addToMap(
      salesInvoiceKey,
      invoiceKey(row.customer, row.external_invoice_number),
      row,
    );
  }
}

const reconciledRows = manifestRows.map((manifest) => {
  const parsedManifest = parseInvoiceName(manifest.name);
  const matches = findMatches(manifest, parsedManifest);
  const best = matches[0] || null;

  return {
    ledger_key: buildLedgerKey({
      customerFolder: manifest.customer_folder,
      parsedCustomer: parsedManifest?.customer || '',
      parsedInvoiceNumber: parsedManifest?.invoiceNumber || '',
      driveName: manifest.name,
    }),
    drive_name: manifest.name,
    customer_folder: manifest.customer_folder,
    folder_path: manifest.folder_path,
    mime_type: manifest.mime_type,
    modified_time: manifest.modified_time,
    drive_file_id: manifest.id,
    match_status: best ? 'already_in_sales' : 'not_found_in_sales',
    match_type: best?.matchType || '',
    match_count: String(matches.length),
    db_sale_id: best?.row.id || '',
    db_source_file: best?.row.source_file || '',
    db_customer: best?.row.customer || '',
    db_customer_name: best?.row.customer_name || '',
    db_invoice_number: best?.row.external_invoice_number || '',
    db_sale_date: best?.row.sale_date || '',
    db_total: best?.row.total || '',
    db_item_rows: best?.row.item_rows || '',
    db_total_quantity: best?.row.total_quantity || '',
    parsed_drive_customer: parsedManifest?.customer || '',
    parsed_drive_invoice_number: parsedManifest?.invoiceNumber || '',
    web_view_link: manifest.web_view_link,
  };
});

const alreadyRows = reconciledRows.filter((row) => row.match_status === 'already_in_sales');
const missingRows = reconciledRows.filter((row) => row.match_status === 'not_found_in_sales');

fs.mkdirSync(outputDir, { recursive: true });
writeCsv(path.join(outputDir, 'drive_sales_reconciliation.csv'), reconciledRows);
writeCsv(path.join(outputDir, 'drive_invoices_already_in_sales.csv'), alreadyRows);
writeCsv(path.join(outputDir, 'drive_invoices_not_in_sales.csv'), missingRows);

const matchTypeCounts = reconciledRows.reduce((acc, row) => {
  const key = row.match_type || 'not_found';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  manifest_rows: manifestRows.length,
  sales_rows_with_source: dbRows.filter((row) => row.source_file).length,
  already_in_sales: alreadyRows.length,
  not_found_in_sales: missingRows.length,
  match_type_counts: matchTypeCounts,
  output_dir: outputDir,
}, null, 2));

function findMatches(manifest, parsedManifest) {
  const matches = [];
  const seen = new Set();

  collectMatches(matches, seen, salesExact.get(manifest.name), 'exact_source_file');
  collectMatches(
    matches,
    seen,
    salesNormalized.get(normalizeInvoiceName(manifest.name)),
    'normalized_source_name',
  );

  if (parsedManifest) {
    collectMatches(
      matches,
      seen,
      salesInvoiceKey.get(invoiceKey(parsedManifest.customer, parsedManifest.invoiceNumber)),
      'drive_name_invoice_key',
    );
  }

  if (manifest.customer_folder && parsedManifest?.invoiceNumber) {
    collectMatches(
      matches,
      seen,
      salesInvoiceKey.get(invoiceKey(manifest.customer_folder, parsedManifest.invoiceNumber)),
      'customer_folder_invoice_key',
    );
  }

  return matches;
}

function collectMatches(matches, seen, rows, matchType) {
  for (const row of rows || []) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    matches.push({ row, matchType });
  }
}

async function loadSalesRows() {
  const sql = neon(process.env.DATABASE_URL);
  return sql`
    SELECT
      s.id,
      s.source_file,
      s.external_invoice_number,
      TO_CHAR(s.date::date, 'YYYY-MM-DD') AS sale_date,
      s.customer,
      c.name AS customer_name,
      s.total::text AS total,
      COUNT(si.id)::int AS item_rows,
      COALESCE(SUM(si.quantity), 0)::int AS total_quantity
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN sale_items si ON si.sale_id = s.id
    GROUP BY s.id, c.name
    ORDER BY s.date, s.id
  `;
}

function buildLedgerKey({ customerFolder, parsedCustomer, parsedInvoiceNumber, driveName }) {
  const customerKey = normalizeCustomer(parsedCustomer || customerFolder || 'unknown-customer');
  const invoiceNumber = parsedInvoiceNumber ? String(Number(parsedInvoiceNumber)) : 'no-invoice-number';
  const fileKey = normalizeInvoiceName(driveName);

  return `customer=${customerKey}|invoice=${invoiceNumber}|file=${fileKey}`;
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

function invoiceKey(customer, invoiceNumber) {
  return `${normalizeCustomer(customer)}::${String(Number(invoiceNumber))}`;
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

function addToMap(map, key, value) {
  if (!key) return;
  const list = map.get(key) || [];
  list.push(value);
  map.set(key, list);
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

function writeCsv(filePath, rows) {
  if (!rows.length) {
    fs.writeFileSync(filePath, '');
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] || '')).join(',')),
  ];

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
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

function csvCell(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}
