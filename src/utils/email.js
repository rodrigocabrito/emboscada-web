import { auth } from '../firebase/config';

// Calls the /api/send-email serverless function with the current user's ID token.
// `to` = a string/array for normal sends; `bcc` = a string/array to hide recipients.
// `token` — optional pre-captured admin ID token (needed when the caller is about
// to be signed out, e.g. right after creating a user).
export const sendEmail = async ({ to, cc, bcc, subject, html, text, token }) => {
  let idToken = token;
  if (!idToken) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    idToken = await user.getIdToken();
  }

  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ to, cc, bcc, subject, html, text }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Email failed (${res.status})`;
    throw new Error(data.detail ? `${msg} — ${data.detail}` : msg);
  }
  return res.json();
};
