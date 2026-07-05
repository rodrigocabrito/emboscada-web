import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

// Initialise firebase-admin once (reused across warm invocations)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel stores the key with literal "\n" — turn them back into newlines
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify the caller is a signed-in admin ──────────────────────────────
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    if (!snap.exists || snap.data().role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed' });
    }
  } catch {
    return res.status(500).json({ error: 'Could not verify permissions' });
  }

  // ── Send the email ──────────────────────────────────────────────────────
  const { to, bcc, subject, html, text } = req.body || {};
  const recipients = to ?? bcc;
  if ((!recipients || (Array.isArray(recipients) && recipients.length === 0)) || !subject) {
    return res.status(400).json({ error: 'Missing recipients or subject' });
  }

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
