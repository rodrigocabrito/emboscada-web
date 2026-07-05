import { auth } from '../firebase/config';

// Calls the /api/send-email serverless function with the current user's ID token.
// `to` = a string/array for normal sends; `bcc` = a string/array to hide recipients.
export const sendEmail = async ({ to, bcc, subject, html, text }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, bcc, subject, html, text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Email failed (${res.status})`;
    throw new Error(data.detail ? `${msg} — ${data.detail}` : msg);
  }
  return res.json();
};
