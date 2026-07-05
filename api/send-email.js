import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

// Lazily initialise firebase-admin, returning a clear error instead of crashing.
function ensureApp() {
  if (getApps().length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  // Vercel commonly stores the key with literal "\n" — turn them into real newlines
  privateKey = privateKey.replace(/\\n/g, '\n');
  // Strip accidental surrounding quotes
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);

  const missing = [];
  if (!projectId) missing.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);

  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function run(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Init admin SDK ──────────────────────────────────────────────────────
  try {
    ensureApp();
  } catch (err) {
    return res.status(500).json({ error: 'Firebase admin init failed', detail: String(err?.message || err) });
  }

  // ── Verify the caller is a signed-in admin ──────────────────────────────
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let uid;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid auth token', detail: String(err?.message || err) });
  }

  try {
    const snap = await getFirestore().collection('users').doc(uid).get();
    if (!snap.exists || snap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Could not verify permissions', detail: String(err?.message || err) });
  }

  // ── Check email credentials ─────────────────────────────────────────────
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD env var' });
  }

  // ── Send the email ──────────────────────────────────────────────────────
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
    // Catch-all so nothing bubbles up as an opaque 500
    return res.status(500).json({ error: 'Unhandled error', detail: String(err?.stack || err?.message || err) });
  }
}
