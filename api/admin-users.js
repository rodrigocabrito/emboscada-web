import { randomBytes } from 'node:crypto';
import {
  PROJECT_ID, requireAdmin, getServiceToken, fsValue, fsUrl, listUsers,
  sendMail, appUrl, escapeHtml, emailShell, emailButton,
} from './_shared.js';

const CHARSETS = {
  lower: 'abcdefghjkmnpqrstuvwxyz',
  upper: 'ABCDEFGHJKMNPQRSTUVWXYZ',
  digit: '23456789',
  symbol: '#%+!?',
};
function generatePassword(length = 12) {
  const all = Object.values(CHARSETS).join('');
  const pick = (set) => set[randomBytes(1)[0] % set.length];
  const chars = [
    pick(CHARSETS.lower), pick(CHARSETS.upper), pick(CHARSETS.digit), pick(CHARSETS.symbol),
    ...Array.from({ length: length - 4 }, () => pick(all)),
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const welcomeEmail = ({ firstName, email, password, loginUrl, profileUrl }) => emailShell(`
  <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#2d6a4f;margin-bottom:10px;">Bem-vindo(a)</div>
  <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0d2b1f;">A tua conta foi criada</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
    Olá${firstName ? ` <strong>${escapeHtml(firstName)}</strong>` : ''}, o teu email foi registado na plataforma da Emboscada.
    Podes entrar com as credenciais abaixo:
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:0 0 18px;">
    <tr>
      <td style="padding:14px 18px;font-size:14px;color:#374151;">
        <div style="margin-bottom:8px;"><span style="color:#6b7280;">Email:</span> <strong>${escapeHtml(email)}</strong></div>
        <div><span style="color:#6b7280;">Password temporária:</span> <strong style="font-family:'Courier New',monospace;">${escapeHtml(password)}</strong></div>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;">
    <strong>Importante:</strong> ao entrares pela primeira vez ser-te-á pedido que definas uma nova password na página de <strong>Perfil</strong>.
  </p>
  ${emailButton('Entrar na plataforma', loginUrl)}
  <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Depois de entrares, vai a <a href="${profileUrl}" style="color:#15803d;">Perfil</a> para definir a nova password.</p>
`);

async function run(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!PROJECT_ID) return res.status(500).json({ error: 'Missing FIREBASE_PROJECT_ID env var' });

  let caller;
  try {
    caller = await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || String(err) });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { action } = body || {};
  const serviceToken = await getServiceToken();
  const authHeaders = { Authorization: `Bearer ${serviceToken}`, 'Content-Type': 'application/json' };

  // ── Create user: Auth account + profile + welcome email, all server-side ──
  if (action === 'create') {
    const { email, firstName, lastName, role, nickname, birthday, startedAt } = body;
    if (!email || !firstName || !role) {
      return res.status(400).json({ error: 'Missing email, firstName or role' });
    }
    const password = generatePassword();

    const createRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
      { method: 'POST', headers: authHeaders, body: JSON.stringify({ email, password }) }
    );
    const created = await createRes.json();
    if (!createRes.ok) {
      const msg = created?.error?.message || 'unknown';
      const status = msg.includes('EMAIL_EXISTS') || msg.includes('DUPLICATE_EMAIL') ? 409 : 500;
      return res.status(status).json({ error: 'Auth user creation failed', detail: msg });
    }
    const uid = created.localId;

    const now = new Date().toISOString();
    const docRes = await fetch(fsUrl(`/users?documentId=${uid}`), {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fields: {
          uuid: fsValue(uid),
          email: fsValue(email),
          firstName: fsValue(firstName),
          lastName: fsValue(lastName || ''),
          nickname: fsValue(nickname || ''),
          role: fsValue(role),
          birthday: fsValue(birthday),
          startedAt: fsValue(startedAt),
          mustChangePassword: fsValue(true),
          createdAt: { timestampValue: now },
          updatedAt: { timestampValue: now },
        },
      }),
    });
    if (!docRes.ok) {
      // Roll back the orphan Auth account so the email isn't left occupied
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`,
        { method: 'POST', headers: authHeaders, body: JSON.stringify({ localId: uid }) }
      ).catch(() => {});
      const detail = await docRes.text().catch(() => '');
      return res.status(500).json({ error: 'Profile creation failed', detail });
    }

    // Welcome email (server-side, atomic with the action; CC the other admins)
    let emailSent = true;
    try {
      const allUsers = await listUsers(serviceToken);
      const adminEmails = allUsers
        .filter((u) => u.role === 'admin' && u.email && u.email !== email)
        .map((u) => u.email);
      const base = appUrl(req);
      await sendMail({
        to: email,
        cc: adminEmails.length ? adminEmails : undefined,
        subject: 'A tua conta na plataforma Emboscada',
        html: welcomeEmail({
          firstName, email, password,
          loginUrl: `${base}/login`,
          profileUrl: `${base}/profile`,
        }),
      });
    } catch (err) {
      console.error('Welcome email failed:', err);
      emailSent = false;
    }

    return res.status(200).json({ ok: true, uid, emailSent });
  }

  // ── Delete user: profile + Auth account ────────────────────────────────────
  if (action === 'delete') {
    const { uid } = body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    if (uid === caller.uid) return res.status(400).json({ error: 'Cannot delete yourself' });

    const docRes = await fetch(fsUrl(`/users/${uid}`), { method: 'DELETE', headers: authHeaders });
    if (!docRes.ok) {
      const detail = await docRes.text().catch(() => '');
      return res.status(500).json({ error: 'Profile deletion failed', detail });
    }

    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`,
      { method: 'POST', headers: authHeaders, body: JSON.stringify({ localId: uid }) }
    );
    if (!authRes.ok) {
      const err = await authRes.json().catch(() => ({}));
      const msg = err?.error?.message || '';
      // Profile is gone; a missing Auth account just means it was already removed
      if (!msg.includes('USER_NOT_FOUND')) {
        return res.status(500).json({ error: 'Auth account deletion failed', detail: msg });
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

export default async function handler(req, res) {
  try {
    return await run(req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Unhandled error', detail: String(err?.message || err) });
  }
}
