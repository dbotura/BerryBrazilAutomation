import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const GOOGLE_DRIVE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const DOCX_EXPORT_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const args = parseArgs(process.argv.slice(2));
const sourceCsv = path.resolve(
  process.cwd(),
  args.source || '../build/drive_invoice_discovery/2026-05-22/candidate_new_since_baseline.csv',
);
const outputDir = path.resolve(
  process.cwd(),
  args.outputDir || '../build/drive_invoice_import_2026-05-22/source_docs',
);
const manifestPath = path.resolve(path.dirname(outputDir), 'staged_drive_files.csv');

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const accessToken = await getGoogleDriveAccessToken();
const rows = readCsv(sourceCsv);

fs.mkdirSync(outputDir, { recursive: true });

const stagedRows = [];
for (const row of rows) {
  const fileId = row.drive_file_id || row.id;
  const driveName = row.drive_name || row.name;
  const mimeType = row.mime_type;
  const stagedName = stagedFileName(driveName, mimeType);
  const targetPath = path.join(outputDir, stagedName);

  if (mimeType === GOOGLE_DOC_MIME) {
    await exportGoogleDoc(fileId, targetPath);
  } else if (mimeType === DOCX_MIME || mimeType === PDF_MIME) {
    await downloadDriveFile(fileId, targetPath);
  } else {
    stagedRows.push({
      drive_file_id: fileId,
      drive_name: driveName,
      staged_file: '',
      status: 'skipped',
      notes: `unsupported mime type: ${mimeType}`,
    });
    continue;
  }

  stagedRows.push({
    drive_file_id: fileId,
    drive_name: driveName,
    customer_folder: row.customer_folder || '',
    modified_time: row.modified_time || '',
    mime_type: mimeType,
    staged_file: stagedName,
    status: 'staged',
    notes: '',
  });
}

writeCsv(manifestPath, stagedRows);

console.log(JSON.stringify({
  source_csv: sourceCsv,
  rows: rows.length,
  staged: stagedRows.filter((row) => row.status === 'staged').length,
  skipped: stagedRows.filter((row) => row.status !== 'staged').length,
  output_dir: outputDir,
  manifest: manifestPath,
}, null, 2));

async function exportGoogleDoc(fileId, targetPath) {
  const url = new URL(`${GOOGLE_DRIVE_API}/files/${fileId}/export`);
  url.searchParams.set('mimeType', DOCX_EXPORT_MIME);

  await fetchToFile(url, targetPath);
}

async function downloadDriveFile(fileId, targetPath) {
  const url = new URL(`${GOOGLE_DRIVE_API}/files/${fileId}`);
  url.searchParams.set('alt', 'media');
  url.searchParams.set('supportsAllDrives', 'true');

  await fetchToFile(url, targetPath);
}

async function fetchToFile(url, targetPath) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Drive fetch failed: ${response.status} ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);
}

function stagedFileName(driveName, mimeType) {
  const ext = mimeType === PDF_MIME ? 'pdf' : 'docx';
  const base = String(driveName || 'invoice')
    .replace(/\.(docx|pdf)$/i, '')
    .trim();
  const withCopyPrefix = /^Copy of\s+/i.test(base) ? base : `Copy of ${base}`;
  return sanitizeFileName(`${withCopyPrefix}.${ext}`);
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[/:]/g, '-').replace(/\s+/g, ' ').trim();
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
    if (arg === '--source') {
      parsed.source = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--source=')) {
      parsed.source = arg.split('=').slice(1).join('=');
    } else if (arg === '--output-dir') {
      parsed.outputDir = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--output-dir=')) {
      parsed.outputDir = arg.split('=').slice(1).join('=');
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
