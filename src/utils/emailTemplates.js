// Shared, email-client-safe HTML templates (table layout + inline styles).

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Public base URL for email assets/links. Set VITE_PUBLIC_URL in Vercel to your
// production domain so emails don't point at localhost/preview URLs.
export const APP_URL = (import.meta.env.VITE_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');

// Wraps inner body HTML in the branded Emboscada shell (header + footer).
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

// Bulletproof CTA button
const button = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td style="border-radius:8px;background:#2d6a4f;">
        <a href="${url}" style="display:inline-block;padding:12px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;border-radius:8px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;

// Announcement and welcome emails are built server-side (api/_shared.js and
// friends) so they can be sent atomically with the actions that trigger them.

// ── Evaluation updated ─────────────────────────────────────────────────────
export const evaluationEmail = ({ firstName, url }) => emailShell(`
  <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#2d6a4f;margin-bottom:10px;">Avaliação</div>
  <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0d2b1f;">A tua avaliação foi atualizada</h1>
  <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
    Olá${firstName ? ` <strong>${escapeHtml(firstName)}</strong>` : ''}, a tua avaliação foi atualizada. Podes consultar os detalhes na plataforma.
  </p>
  ${button('Ver a minha avaliação', url)}
`);

