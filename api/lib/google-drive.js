import crypto from 'node:crypto';
import { isInvoiceTestMode } from './invoice-test-mode.js';

const GOOGLE_DRIVE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink';
const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export function isGoogleDriveUploadEnabled() {
  return process.env.GOOGLE_DRIVE_ENABLED === 'true';
}

export function getGoogleDriveFolderId() {
  if (isInvoiceTestMode()) {
    return process.env.GOOGLE_DRIVE_TEST_FOLDER_ID?.trim() || '';
  }

  return process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() || '';
}

export async function uploadInvoicePdfToGoogleDrive({ fileName, pdfBuffer }) {
  if (!isGoogleDriveUploadEnabled()) {
    return null;
  }

  const folderId = getGoogleDriveFolderId();

  if (!folderId) {
    throw new Error('Google Drive upload is enabled but the target folder ID is missing');
  }

  const accessToken = await getGoogleDriveAccessToken();
  const boundary = `drive-boundary-${Date.now()}`;
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      'Content-Type: application/pdf\r\n\r\n',
      'utf8',
    ),
    pdfBuffer,
    Buffer.from(`\r\n--${boundary}--`, 'utf8'),
  ]);

  const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive upload failed: ${response.status} ${errorText}`);
  }

  const file = await response.json();

  return {
    id: file.id,
    name: file.name,
    url: file.webViewLink || file.webContentLink || `https://drive.google.com/file/d/${file.id}/view`,
  };
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

  throw new Error('Google Drive credentials are missing. Configure OAuth refresh-token credentials or a service account.');
}

async function getServiceAccountAccessToken({ clientEmail, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_DRIVE_SCOPE,
    aud: GOOGLE_DRIVE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedToken)
    .end()
    .sign(privateKey);
  const assertion = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const response = await fetch(GOOGLE_DRIVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google Drive access token: ${response.status} ${errorText}`);
  }

  const tokenResponse = await response.json();
  return tokenResponse.access_token;
}

async function getOAuthRefreshTokenAccessToken({ clientId, clientSecret, refreshToken }) {
  const response = await fetch(GOOGLE_DRIVE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Google OAuth access token: ${response.status} ${errorText}`);
  }

  const tokenResponse = await response.json();
  return tokenResponse.access_token;
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
