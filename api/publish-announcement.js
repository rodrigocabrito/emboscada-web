import {
  PROJECT_ID, requireAdmin, getServiceToken, fsValue, fsUrl, listUsers,
  sendMail, appUrl, escapeHtml, emailShell, emailButton,
} from './_shared.js';

const announcementEmail = ({ author, title, body, url }) => emailShell(`
  <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#2d6a4f;margin-bottom:10px;">Novo comunicado</div>
  ${title ? `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0d2b1f;">${escapeHtml(title)}</h1>` : ''}
  <p style="margin:0 0 18px;font-size:15px;line-height:1.6;white-space:pre-wrap;color:#374151;">${escapeHtml(body)}</p>
  ${emailButton('Ver na plataforma', url)}
  <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Publicado por <strong style="color:#374151;">${escapeHtml(author)}</strong></p>
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

  let reqBody = req.body;
  if (typeof reqBody === 'string') {
    try { reqBody = JSON.parse(reqBody); } catch { reqBody = {}; }
  }
  const title = (reqBody?.title || '').trim();
  const body = (reqBody?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Missing body' });

  const authorName = `${caller.userDoc.firstName?.stringValue ?? ''} ${caller.userDoc.lastName?.stringValue ?? ''}`.trim() || 'Admin';
  const authorLabel = caller.userDoc.nickname?.stringValue || authorName;

  // 1. Create the announcement document (service account bypasses rules)
  const serviceToken = await getServiceToken();
  const docRes = await fetch(fsUrl('/announcements'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        title: fsValue(title),
        body: fsValue(body),
        authorId: fsValue(caller.uid),
        authorName: fsValue(authorName),
        reactions: { mapValue: { fields: {} } },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });
  if (!docRes.ok) {
    const detail = await docRes.text().catch(() => '');
    return res.status(500).json({ error: 'Announcement creation failed', detail });
  }

  // 2. Notify everyone except the author (BCC keeps addresses private)
  let emailSent = true;
  try {
    const users = await listUsers(serviceToken);
    const recipients = users
      .filter((u) => u.uid !== caller.uid && u.email)
      .map((u) => u.email);
    if (recipients.length) {
      await sendMail({
        bcc: recipients,
        subject: `Novo comunicado${title ? `: ${title}` : ''} — Emboscada`,
        html: announcementEmail({
          author: authorLabel,
          title,
          body,
          url: `${appUrl(req)}/announcements`,
        }),
      });
    }
  } catch (err) {
    console.error('Announcement email failed:', err);
    emailSent = false;
  }

  return res.status(200).json({ ok: true, emailSent });
}

export default async function handler(req, res) {
  try {
    return await run(req, res);
  } catch (err) {
    return res.status(500).json({ error: 'Unhandled error', detail: String(err?.message || err) });
  }
}
