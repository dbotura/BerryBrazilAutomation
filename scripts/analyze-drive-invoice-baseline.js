import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const GOOGLE_DRIVE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const BASELINE_FOLDER_NAME = 'COPIES BOTURA 28-03-26';
const DEFAULT_CUTOFF_DATE = '2026-03-28';

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.resolve(
  process.cwd(),
  args.manifest || '../build/drive_invoice_discovery/2026-05-22/drive_sales_reconciliation.csv',
);
const outputDir = path.resolve(process.cwd(), args.outputDir || path.dirname(manifestPath));
const cutoffDate = args.cutoffDate || DEFAULT_CUTOFF_DATE;

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const accessToken = await getGoogleDriveAccessToken();
const baselineFolders = await findFoldersByName(BASELINE_FOLDER_NAME);
const baselineFiles = [];

for (const folder of baselineFolders) {
  await collectFilesRecursive({
    folder,
    rootFolderName: folder.name,
    folderPath: folder.name,
    output: baselineFiles,
  });
}

const baselineInvoiceFiles = baselineFiles.filter((file) => isInvoiceLike(file.name));
const baselineNameSet = new Set(baselineInvoiceFiles.map((file) => normalizeInvoiceName(file.name)));
const baselineFileIds = new Set(baselineInvoiceFiles.map((file) => file.id));

const rows = readCsv(manifestPath);
const enriched = rows.map((row) => {
  const normalized = normalizeInvoiceName(row.drive_name || row.name || '');
  const modifiedDate = (row.modified_time || '').slice(0, 10);
  const inBaselineByName = baselineNameSet.has(normalized);
  const inBaselineById = baselineFileIds.has(row.drive_file_id || row.id || '');
  const alreadyInSales = (row.match_status || '') === 'already_in_sales'
    || (row.already_imported || '').toLowerCase() === 'yes';
  const modifiedAfterCutoff = Boolean(modifiedDate && modifiedDate > cutoffDate);

  return {
    ...row,
    normalized_invoice_name: normalized,
    in_baseline_folder: inBaselineByName || inBaselineById ? 'yes' : 'no',
    baseline_match_type: inBaselineById ? 'file_id' : inBaselineByName ? 'normalized_name' : '',
    modified_date: modifiedDate,
    modified_after_cutoff: modifiedAfterCutoff ? 'yes' : 'no',
    candidate_new_since_baseline: !alreadyInSales && !inBaselineByName && !inBaselineById && modifiedAfterCutoff ? 'yes' : 'no',
    candidate_not_in_sales_or_baseline: !alreadyInSales && !inBaselineByName && !inBaselineById ? 'yes' : 'no',
  };
});

const newSinceBaseline = enriched.filter((row) => row.candidate_new_since_baseline === 'yes');
const notInSalesOrBaseline = enriched.filter((row) => row.candidate_not_in_sales_or_baseline === 'yes');

fs.mkdirSync(outputDir, { recursive: true });
writeCsv(path.join(outputDir, 'baseline_folder_inventory.csv'), baselineInvoiceFiles.map((file) => ({
  id: file.id,
  name: file.name,
  normalized_invoice_name: normalizeInvoiceName(file.name),
  mime_type: file.mimeType,
  folder_path: file.folderPath,
  modified_time: file.modifiedTime || '',
  created_time: file.createdTime || '',
  web_view_link: file.webViewLink || '',
})));
writeCsv(path.join(outputDir, 'drive_sales_reconciliation_with_baseline.csv'), enriched);
writeCsv(path.join(outputDir, 'candidate_new_since_baseline.csv'), newSinceBaseline);
writeCsv(path.join(outputDir, 'candidate_not_in_sales_or_baseline.csv'), notInSalesOrBaseline);

console.log(JSON.stringify({
  baseline_folder_name: BASELINE_FOLDER_NAME,
  baseline_folders_found: baselineFolders.length,
  baseline_invoice_files: baselineInvoiceFiles.length,
  manifest_rows: rows.length,
  cutoff_date: cutoffDate,
  in_baseline_folder: enriched.filter((row) => row.in_baseline_folder === 'yes').length,
  already_in_sales: enriched.filter((row) => (row.match_status || '') === 'already_in_sales').length,
  candidate_new_since_baseline: newSinceBaseline.length,
  candidate_not_in_sales_or_baseline: notInSalesOrBaseline.length,
  output_dir: outputDir,
}, null, 2));

async function collectFilesRecursive({ folder, folderPath, output, depth = 0 }) {
  if (depth > Number(args.maxDepth || 6)) return;
  const children = await listChildren(folder.id);

  for (const child of children) {
    const childPath = `${folderPath}/${child.name}`;
    if (child.mimeType === FOLDER_MIME) {
      await collectFilesRecursive({
        folder: child,
        folderPath: childPath,
        output,
        depth: depth + 1,
      });
      continue;
    }

    output.push({
      ...child,
      folderPath,
    });
  }
}

async function findFoldersByName(name) {
  return listDriveFiles([
    `name = '${escapeDriveQueryString(name)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    'trashed = false',
  ].join(' and '));
}

async function listChildren(folderId) {
  return listDriveFiles([
    `'${folderId}' in parents`,
    'trashed = false',
  ].join(' and '));
}

async function listDriveFiles(query) {
  const files = [];
  let pageToken = '';

  do {
    const url = new URL(`${GOOGLE_DRIVE_API}/files`);
    url.searchParams.set('q', query);
    url.searchParams.set('pageSize', '1000');
    url.searchParams.set('supportsAllDrives', 'true');
    url.searchParams.set('includeItemsFromAllDrives', 'true');
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,modifiedTime,createdTime,webViewLink)');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Google Drive list failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return files;
}

function isInvoiceLike(name) {
  return /\binv(?:oice)?\b|\binvoice\b|copy of .+ inv \d+/i.test(name);
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

async function getGoogleDriveAccessToken() {
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    return getOAuthRefreshTokenAccessToken({
      clientId: oauthClientId,
      clientSecret: oauthClientSecret,
      refreshToken: oauthRefreshToken,
    });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    return getServiceAccountAccessToken({ clientEmail, privateKey });
  }

  throw new Error('Google Drive credentials are missing.');
}

async function getOAuthRefreshTokenAccessToken({ clientId, clientSecret, refreshToken }) {
  const response = await fetch(GOOGLE_DRIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Google OAuth access token: ${response.status} ${await response.text()}`);
  }

  return (await response.json()).access_token;
}

async function getServiceAccountAccessToken({ clientEmail, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const encodedPayload = base64UrlEncode(JSON.stringify({
    iss: clientEmail,
    scope: DRIVE_READONLY_SCOPE,
    aud: GOOGLE_DRIVE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  }));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsignedToken).end().sign(privateKey);
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const response = await fetch(GOOGLE_DRIVE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Google Drive access token: ${response.status} ${await response.text()}`);
  }

  return (await response.json()).access_token;
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

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === '--manifest') {
      parsed.manifest = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--manifest=')) {
      parsed.manifest = arg.split('=').slice(1).join('=');
    } else if (arg === '--output-dir') {
      parsed.outputDir = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--output-dir=')) {
      parsed.outputDir = arg.split('=').slice(1).join('=');
    } else if (arg === '--cutoff-date') {
      parsed.cutoffDate = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--cutoff-date=')) {
      parsed.cutoffDate = arg.split('=').slice(1).join('=');
    } else if (arg.startsWith('--max-depth=')) {
      parsed.maxDepth = arg.split('=')[1];
    }
  }
  return parsed;
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

function escapeDriveQueryString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function normalizePrivateKey(privateKey) {
  return privateKey?.replace(/\\n/g, '\n') || '';
}

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);

  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
