import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const GOOGLE_DRIVE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const DEFAULT_MAX_DEPTH = 4;

const args = parseArgs(process.argv.slice(2));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const accessToken = await getGoogleDriveAccessToken();
const existingSourceFiles = args.dedupe === false ? new Set() : await getExistingSourceFiles();
const outputDir = path.resolve(
  process.cwd(),
  args.outputDir || `../build/drive_invoice_discovery/${new Date().toISOString().slice(0, 10)}`,
);

fs.mkdirSync(outputDir, { recursive: true });

const rootFolders = await listRootFolders();
const candidates = [];

for (const folder of rootFolders) {
  await scanFolder({
    folder,
    customerFolder: folder.name,
    folderPath: folder.name,
    depth: 0,
    candidates,
  });
}

const rows = candidates
  .sort((a, b) => a.customer_folder.localeCompare(b.customer_folder) || a.name.localeCompare(b.name))
  .map((file) => ({
    ...file,
    already_imported: existingSourceFiles.has(file.name) ? 'yes' : 'no',
  }));

writeCsv(path.join(outputDir, 'drive_invoice_manifest.csv'), rows);
writeCsv(
  path.join(outputDir, 'new_invoice_candidates.csv'),
  rows.filter((row) => row.already_imported === 'no'),
);

console.log(JSON.stringify({
  root_folders_scanned: rootFolders.length,
  invoice_candidates: rows.length,
  already_imported: rows.filter((row) => row.already_imported === 'yes').length,
  new_candidates: rows.filter((row) => row.already_imported === 'no').length,
  output_dir: outputDir,
}, null, 2));

async function scanFolder({ folder, customerFolder, folderPath, depth, candidates }) {
  if (depth > Number(args.maxDepth || DEFAULT_MAX_DEPTH)) return;

  const children = await listChildren(folder.id);

  for (const child of children) {
    const childPath = `${folderPath}/${child.name}`;
    if (child.mimeType === FOLDER_MIME) {
      await scanFolder({
        folder: child,
        customerFolder,
        folderPath: childPath,
        depth: depth + 1,
        candidates,
      });
      continue;
    }

    if (!isInvoiceCandidate(child)) continue;

    candidates.push({
      id: child.id,
      name: child.name,
      mime_type: child.mimeType,
      customer_folder: customerFolder,
      folder_path: folderPath,
      modified_time: child.modifiedTime || '',
      created_time: child.createdTime || '',
      web_view_link: child.webViewLink || '',
      download_strategy: downloadStrategy(child),
    });
  }
}

function isInvoiceCandidate(file) {
  const name = file.name.toLowerCase();
  const invoiceLikeName = /\binv(?:oice)?\b|\binvoice\b|copy of .+ inv \d+/i.test(file.name);
  const supportedType = [DOCX_MIME, PDF_MIME, GOOGLE_DOC_MIME].includes(file.mimeType);

  return supportedType && invoiceLikeName && !name.includes('quote') && !name.includes('statement');
}

function downloadStrategy(file) {
  if (file.mimeType === GOOGLE_DOC_MIME) return 'export_docx';
  if (file.mimeType === DOCX_MIME || file.mimeType === PDF_MIME) return 'download';
  return 'unsupported';
}

async function listRootFolders() {
  return listDriveFiles([
    "'root' in parents",
    "mimeType = 'application/vnd.google-apps.folder'",
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

async function getExistingSourceFiles() {
  if (!process.env.DATABASE_URL) return new Set();

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT source_file
      FROM sales
      WHERE source_file IS NOT NULL AND source_file <> ''
      GROUP BY source_file
    `;

    return new Set(rows.map((row) => row.source_file));
  } catch (error) {
    console.warn(`Could not load existing sales source files: ${error.message}`);
    return new Set();
  }
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
    if (arg === '--no-dedupe') {
      parsed.dedupe = false;
    } else if (arg.startsWith('--max-depth=')) {
      parsed.maxDepth = arg.split('=')[1];
    } else if (arg === '--output-dir') {
      parsed.outputDir = rawArgs[index + 1];
      index += 1;
    } else if (arg.startsWith('--output-dir=')) {
      parsed.outputDir = arg.split('=').slice(1).join('=');
    }
  }
  return parsed;
}

function writeCsv(filePath, rows) {
  const headers = [
    'id',
    'name',
    'mime_type',
    'customer_folder',
    'folder_path',
    'modified_time',
    'created_time',
    'web_view_link',
    'download_strategy',
    'already_imported',
  ];
  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] || '')).join(','));
  }

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
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
