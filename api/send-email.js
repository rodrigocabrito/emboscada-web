import { importX509, jwtVerify, decodeProtectedHeader } from 'jose';
import nodemailer from 'nodemailer';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Cache Google's public signing certs (rotated a few times a day)
let certCache = { at: 0, certs: null };
async function getCerts() {
  if (certCache.certs && Date.now() - certCache.at < 60 * 60 * 1000) return certCache.certs;
  const r = await fetch(CERT_URL);
  if (!r.ok) throw new Error(`Could not fetch Google certs (${r.status})`);
  const certs = await r.json();
  certCache = { at: Date.now(), certs };
  return certs;
}

// Verify a Firebase ID token (RS256, signed by Google) without firebase-admin.
async function verifyIdToken(token) {
  const { kid } = decodeProtectedHeader(token);
  const certs = await getCerts();
  const pem = certs[kid];
  if (!pem) throw new Error('Unknown token key id');
  const key = await importX509(pem, 'RS256');
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });
  return payload; // payload.sub = uid
}

// Read the user's role from Firestore via REST, using the caller's own token.
async function isAdmin(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  if (!r.ok) return false;
  const doc = await r.json();
  return doc?.fields?.role?.stringValue === 'admin';
}

async function run(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!PROJECT_ID) {
    return res.status(500).json({ error: 'Missing FIREBASE_PROJECT_ID env var' });
  }

  // ── Verify caller ───────────────────────────────────────────────────────
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: 'Missing auth token' });

  let uid;
  try {
    const payload = await verifyIdToken(idToken);
    uid = payload.sub;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid auth token', detail: String(err?.message || err) });
  }

  if (!(await isAdmin(uid, idToken))) {
    return res.status(403).json({ error: 'Not allowed (admin only)' });
  }

  // ── Email credentials ───────────────────────────────────────────────────
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD env var' });
  }

  // ── Send ────────────────────────────────────────────────────────────────
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { to, bcc, subject, html, text } = body || {};
  const recipients = to ?? bcc;
  if (!recipients || (Array.isArray(recipients) && recipients.length === 0) || !subject) {
    return res.status(400).json({ error: 'Missing recipients or subject' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: `"Emboscada" <${process.env.GMAIL_USER}>`,
      // When emailing many people, use BCC so addresses stay private
      ...(bcc ? { to: process.env.GMAIL_USER, bcc } : { to }),
      subject,
      text: text || undefined,
      html: html || undefined,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send email', detail: String(err?.message || err) });
  }
}

export default async function handler(req, res) {
  try {
    return await run(req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Unhandled error', detail: String(err?.stack || err?.message || err) });
  }
}
