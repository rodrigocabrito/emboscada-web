// Public reservation / contact endpoint for the marketing site.
//
// Unlike the other /api routes this one is intentionally UNAUTHENTICATED — it's
// a public contact form. Protections: it only ever emails one of a few fixed
// internal addresses (the sender can't choose an arbitrary recipient), requires
// the core fields, and uses a honeypot to drop bots. Consider adding reCAPTCHA
// later (the old WordPress site used it) for stronger spam protection.
import { sendMail, emailShell, escapeHtml } from './_shared.js';

// Requests are routed to a different inbox per park. For now everything points
// at a single test address; set the RESERVATION_TO_* env vars in Vercel to the
// real per-park inboxes at go-live. Applies to both reservations and corporate
// quotes. RESERVATION_TO is the fallback when no park is selected.
const TEST_TO = 'rodri.cabrito@gmail.com';
const PARK_TO = {
  porto: process.env.RESERVATION_TO_PORTO || TEST_TO,
  monsanto: process.env.RESERVATION_TO_MONSANTO || TEST_TO,
};
const FALLBACK_TO = process.env.RESERVATION_TO || TEST_TO;

// Picks the recipient from the selected park (park value looks like
// "Porto (Porto)" or "Monsanto (Lisboa)").
const recipientFor = (park) => {
  const p = (park || '').toLowerCase();
  if (p.includes('porto')) return PARK_TO.porto;
  if (p.includes('monsanto') || p.includes('lisboa')) return PARK_TO.monsanto;
  return FALLBACK_TO;
};

const row = (label, value) =>
  value ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">${escapeHtml(label)}</td><td style="padding:4px 0;color:#111827;"><strong>${escapeHtml(value)}</strong></td></tr>` : '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const {
    name = '', email = '', phone = '', park = '', activity = '', pack = '',
    date = '', groupSize = '', period = '', message = '', kind = '',
    company = '', // `company` = honeypot
  } = body || {};

  // Bot filled the hidden field — pretend success, send nothing.
  if (company) return res.status(200).json({ ok: true });

  if (!name.trim() || (!email.trim() && !phone.trim())) {
    return res.status(400).json({ error: 'Indica o nome e um contacto (email ou telefone).' });
  }

  const isQuote = kind === 'empresas';
  const heading = isQuote ? 'Novo pedido de orçamento (Empresas)' : 'Nova reserva / contacto';

  const html = emailShell(`
    <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#2d6a4f;margin-bottom:10px;">${heading}</div>
    <h1 style="margin:0 0 14px;font-size:20px;color:#0d2b1f;">Pedido de ${escapeHtml(name)}</h1>
    <table role="presentation" style="font-size:14px;border-collapse:collapse;">
      ${row(isQuote ? 'Organizador' : 'Nome', name)}
      ${row('Email', email)}
      ${row('Telefone', phone)}
      ${row('Parque', park)}
      ${row('Actividade', activity)}
      ${row('Pack', pack)}
      ${row('Data pretendida', date)}
      ${row('Nº de pessoas', String(groupSize))}
      ${row('Período', period)}
    </table>
    ${message ? `<p style="margin:16px 0 0;font-size:14px;color:#374151;"><strong>Observações:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
  `);

  try {
    await sendMail({
      to: recipientFor(park),
      subject: `${isQuote ? 'Orçamento' : 'Reserva'} — ${name}${park ? ` (${park})` : ''}`,
      html,
      text: `Pedido de ${name}\nEmail: ${email}\nTelefone: ${phone}\nParque: ${park}\nActividade: ${activity}\nPack: ${pack}\nData: ${date}\nPessoas: ${groupSize}\nPeríodo: ${period}\n\n${message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível enviar o pedido. Tenta novamente ou liga-nos.', detail: String(err?.message || err) });
  }
}
