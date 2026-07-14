// Shared helpers for the Vercel serverless functions.
// (Files prefixed with "_" inside /api are not exposed as endpoints.)
import { importX509, importPKCS8, jwtVerify, decodeProtectedHeader, SignJWT } from 'jose';
import nodemailer from 'nodemailer';

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Firebase ID-token verification (Google public certs) ────────────────────
let certCache = { at: 0, certs: null };
async function getCerts() {
  if (certCache.certs && Date.now() - certCache.at < 60 * 60 * 1000) return certCache.certs;
  const r = await fetch(CERT_URL);
  if (!r.ok) throw new Error(`Could not fetch Google certs (${r.status})`);
  const certs = await r.json();
  certCache = { at: Date.now(), certs };
  return certs;
}

export async function verifyIdToken(token) {
  const { kid } = decodeProtectedHeader(token);
  const certs = await getCerts();
  const pem = certs[kid];
  if (!pem) throw new Error('Unknown token key id');
  const key = await importX509(pem, 'RS256');
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });
  return payload;
}

// Extracts the bearer token, verifies it, and confirms the caller is an admin.
// Returns { uid, userDoc } or throws { status, message }.
export async function requireAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) throw { status: 401, message: 'Missing auth token' };

  let uid;
  try {
    const payload = await verifyIdToken(idToken);
    uid = payload.sub;
  } catch (err) {
    throw { status: 401, message: `Invalid auth token — ${err?.message || err}` };
  }

  const r = await fetch(`${FS_BASE}/users/${uid}`, { headers: { Authorization: `Bearer ${idToken}` } });
  if (!r.ok) throw { status: 403, message: 'Not allowed (admin only)' };
  const doc = await r.json();
  if (doc?.fields?.role?.stringValue !== 'admin') throw { status: 403, message: 'Not allowed (admin only)' };
  return { uid, userDoc: doc.fields ?? {} };
}

// ── Service-account OAuth token (admin-privileged REST calls) ───────────────
let saTokenCache = { at: 0, token: null };
export async function getServiceToken() {
  if (saTokenCache.token && Date.now() - saTokenCache.at < 45 * 60 * 1000) return saTokenCache.token;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  if (!clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY env var');
  }

  const key = await importPKCS8(privateKey, 'RS256');
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/datastore',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const data = await r.json();
  if (!r.ok || !data.access_token) {
    throw new Error(`Service token exchange failed: ${data.error_description || data.error || r.status}`);
  }
  saTokenCache = { at: Date.now(), token: data.access_token };
  return data.access_token;
}

// ── Firestore REST helpers ───────────────────────────────────────────────────
export const fsValue = (v) => {
  if (v === null || v === undefined || v === '') return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  return { stringValue: String(v) };
};

export const fsUrl = (path = '') => `${FS_BASE}${path}`;

// Lists all user docs: [{ uid, email, role, firstName, lastName, nickname }]
export async function listUsers(serviceToken) {
  const r = await fetch(fsUrl(':runQuery'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'users' }] } }),
  });
  if (!r.ok) throw new Error(`Users query failed (${r.status})`);
  const rows = await r.json();
  return rows
    .filter((row) => row.document)
    .map((row) => {
      const f = row.document.fields ?? {};
      return {
        uid: row.document.name.split('/').pop(),
        email: f.email?.stringValue ?? '',
        role: f.role?.stringValue ?? '',
        firstName: f.firstName?.stringValue ?? '',
        lastName: f.lastName?.stringValue ?? '',
        nickname: f.nickname?.stringValue ?? '',
      };
    });
}

// ── Email ────────────────────────────────────────────────────────────────────
export async function sendMail({ to, cc, bcc, subject, html, text }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD env var');
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transporter.sendMail({
    from: `"Emboscada" <${process.env.GMAIL_USER}>`,
    ...(bcc ? { to: process.env.GMAIL_USER, bcc } : { to }),
    ...(cc ? { cc } : {}),
    subject,
    text: text || undefined,
    html: html || undefined,
  });
}

export const appUrl = (req) =>
  (process.env.VITE_PUBLIC_URL || `https://${req.headers.host}`).replace(/\/$/, '');

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Branded shell — mirror of src/utils/emailTemplates.js (kept server-side so
// emails can be sent atomically with the action that triggers them).
export const emailShell = (innerHtml) => `
<div style="margin:0;padding:0;background:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">
          <tr>
            <td style="background:#0d2b1f;padding:28px 24px;text-align:center;">
              <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.08em;">EMBOSCADA</div>
              <div style="color:#95d5b2;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Parque Aventura</div>
            </td>
          </tr>
          <tr><td style="height:4px;background:#2d6a4f;line-height:4px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 32px;color:#1f2937;">
              ${innerHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Recebeste este email porque fazes parte da equipa Emboscada.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`;

export const emailButton = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td style="border-radius:8px;background:#2d6a4f;">
        <a href="${url}" style="display:inline-block;padding:12px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:8px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
